import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import userSchema from '../lib/models/User.js';
import mongoose from 'mongoose';
import * as RoleModule from '../lib/models/role.js';
const Role = RoleModule.default || RoleModule;
import { getDbConnection, getSubdomain } from '../lib/tenantDb.js';
// Helper to get User model from schema, using a specific mongoose connection
function getUserModel(conn) {
    return conn.models.User || conn.model('User', userSchema);
}
import dotenv from 'dotenv';
dotenv.config();

// Helper to extract tenant from request headers
function getTenantFromRequest(request) {
    return request.headers.get('x-tenant') || null;
}


const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY;

/**
 * Verify JWT Token
 */
export async function verifyJwtToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}

/**
 * Fetch User by ID (using tenant DB connection)
 */
export async function getUserById(userId, tenantId = null, conn = null) {
    try {
        let user = null;
        if (!conn) {
            // fallback to default connection if not provided
            conn = mongoose;
        }
        const UserModel = getUserModel(conn);
        
        // Convert userId to ObjectId if possible
        let query = {};
        try {
            query._id = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        } catch {
            query._id = userId;
        }

        // For tenant users, we don't need to filter by tenant when using tenant-specific DB
        // The tenant-specific database already contains only users for that tenant
        // Only add tenant filter for global/default DB queries
        if (tenantId && tenantId !== 'localhost' && conn === mongoose) {
            try {
                query.tenant = mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId;
            } catch {
                query.tenant = tenantId;
            }
        }

        //console.log('[getUserById] Query:', query, 'TenantId:', tenantId, 'Using tenant DB:', conn !== mongoose);
        
        user = await UserModel.findOne(query).lean();
        //console.log('[getUserById] Result:', user ? 'User found' : 'User not found');
        return user;
    } catch (err) {
        //console.log('Error fetching user:', err.message);
        return null;
    }
}

/**
 * Verify Token & User by Role
 */
export async function verifyTokenAndUser(request, userType = 'user') {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                { success: false, message: 'Missing or invalid authorization header' },
                { status: 401 }
            )
        };
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
        payload = await verifyJwtToken(token);
    } catch (err) {
        //console.error('JWT verification failed:', err.message);
        return {
            error: NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            )
        };
    }

    // //console.log('[verifyTokenAndUser] Decoded JWT payload:', payload);
    // Try all possible id fields
    const userId = payload.userId || payload._id || payload.id;
    const tenantId = payload.tenantId || payload.tenant || getTenantFromRequest(request) || getSubdomain(request);
    // //console.log('[verifyTokenAndUser] userId:', userId, 'tenantId:', tenantId);

    // Always get the correct tenant DB connection

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);    
    //console.log('[verifyTokenAndUser] DB connection established:', conn);
    const user = await getUserById(userId, tenantId, conn);
    if (!user) {
        // //console.error('[verifyTokenAndUser] User not found for query:', { userId, tenantId });
        return {
            error: NextResponse.json(
                { success: false, message: 'User not found or unauthorized', query: { userId, tenantId } },
                { status: 403 }
            )
        };
    }

    return { user };
}

/**
 * Verify if User is Super Admin
 */
export async function verifySuperAdminAccess(request) {
    const result = await verifyTokenAndUser(request, 'user');
    if (result.error) return result;

    if (!result.user.isSuperAdmin) {
        return {
            error: NextResponse.json(
                { success: false, message: 'Access Denied: Super Admins only' },
                { status: 403 }
            )
        };
    }

    return result;
}

/**
 * Route Protection for Super Admin Access
 */
export function withSuperAdminAuth(handler) {
    return async function (request, ...args) {
        const authResult = await verifySuperAdminAccess(request);
        if (authResult.error) return authResult.error;

        request.user = authResult.user;
        return handler(request, ...args);
    };
}

/**
 * Verify if User can Create Super Admin
 */
export async function verifyRoleForSuperAdminCreation(request) {
    const result = await verifyTokenAndUser(request, 'user');
    if (result.error) return result;

    if (!result.user.isSuperAdmin) {
        return {
            error: NextResponse.json(
                { success: false, message: 'Only Super Admins can create' },
                { status: 403 }
            )
        };
    }

    return result;
}

/**
 * Route Protection for Super Admin Creation
 */
export function withSuperAdminCreationAuth(handler) {
    return async function (request, ...args) {
        const authResult = await verifyRoleForSuperAdminCreation(request);
        if (authResult.error) return authResult.error;

        request.user = authResult.user;
        return handler(request, ...args);
    };
}

/**
 * Verify if User is Super Admin or Role Admin
 */
export async function verifySuperAdminOrRoleAdminAccess(request) {
    const result = await verifyTokenAndUser(request, 'user');
    if (result.error) return result;

    // Check if user is super admin
    if (result.user.isSuperAdmin) {
        return result;
    }

    // Get tenant connection for role lookup
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    
    // Check if user has 'admin' role (by name or by specific ObjectId)
    let roleDoc = result.user.role;
    //console.log('User role:', roleDoc);
    if (!roleDoc || typeof roleDoc === 'string' || (roleDoc._bsontype === 'ObjectId')) {
        // Fetch role document if not populated using tenant-specific connection
        const RoleModel = conn ? (conn.models.Role || conn.model('Role', Role)) : (mongoose.models.Role || mongoose.model('Role', Role));
        roleDoc = await RoleModel.findById(result.user.role).lean();
    }
    if (roleDoc && (roleDoc.name === 'admin' || roleDoc.slug === 'admin')) {
        return result;
    }

    return {
        error: NextResponse.json(
            { success: false, message: 'Access Denied: Only Super Admin or Role Admin can create roles' },
            { status: 403 }
        )
    };
}

/**
 * Route Protection for Super Admin or Role Admin Access (for role creation)
 */
export function withSuperAdminOrRoleAdminAuth(handler) {
    return async function (request, ...args) {
        const authResult = await verifySuperAdminOrRoleAdminAccess(request);
        if (authResult.error) return authResult.error;

        request.user = authResult.user;
        return handler(request, ...args);
    };
}

/**
 * Check if user has permission for a module
 * @param {Object} user - User document
 * @param {String} moduleId - Module ObjectId as string
 * @param {String} permission - Permission string (e.g. 'view', 'edit')
 * @param {Object} conn - Optional tenant-specific connection
 * @returns {Boolean}
 */


export async function hasModulePermission(user, moduleId, permission = null, conn = null) {
    // Super Admins have all permissions
    if (user.isSuperAdmin) return true;

    // Get user's role (populated or id)
    let role = user.role;
    if (!role) return false;

    // If role is an ObjectId, convert to string for lookup
    if (typeof role === 'object' && role._bsontype === 'ObjectId') {
        role = role.toString();
    }

    // Use tenant-specific connection if provided
    let RoleModel;
    if (conn) {
        RoleModel = conn.models.Role || conn.model('Role', Role);
    } else {
        RoleModel = mongoose.models.Role || mongoose.model('Role', Role);
    }

    // If role is populated, use directly; otherwise, fetch role document
    let roleDoc = role.modulePermissions ? role : await RoleModel.findById(role).lean();
    //console.log('Role id:', role, 'Role document modulePermissions:', roleDoc?.modulePermissions);
    if (!roleDoc) return false;

    // Check permission for requested module
    //console?.log('Checking permissions for module:', moduleId, 'and permission:', permission);
    if (moduleId) {
        if (permission) {
            // Check for specific permission
            return roleDoc.modulePermissions?.some(mp =>
                mp.module?.toString() == moduleId && mp.permissions?.includes(permission)
            );
        } else {
            // Check for ANY permission (used for sidebar modules)
            return roleDoc.modulePermissions?.some(mp =>
                mp.module?.toString() == moduleId && mp.permissions?.length > 0
            );
        }
    } else {
        // For all modules, require at least one permission
        if (permission) {
            return roleDoc.modulePermissions?.some(mp =>
                mp.permissions?.includes(permission)
            );
        } else {
            return roleDoc.modulePermissions?.some(mp =>
                mp.permissions?.length > 0
            );
        }
    }
}


/**
 * Route Protection for Authenticated Users (any user)
 */
export function withUserAuth(handler) {
    return async function (request, context) {
        try {
            const authResult = await verifyTokenAndUser(request, 'user');
            if (authResult.error) return authResult.error;

            request.user = authResult.user;
            // Pass both request and context to handler so params are available
            return await handler(request, context);
        } catch (error) {
            console.error('withUserAuth error:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Authentication failed' },
                { status: 500 }
            );
        }
    };
}