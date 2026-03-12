
import RoleService from '../services/roleService.js';
import { successResponse, errorResponse } from '../../utils/response.js';

// Create a new role

export async function createRole(form, currentUser, conn) {
    try {
        const roleService = new RoleService(conn);
        const { name, scope, tenantId, modulePermissions } = form;
        const existing = await roleService.findByName(name, conn);
        if (existing) {
            return {
                status: 400,
                body: errorResponse('Role with this name already exists', 400),
            };
        }

        // Validate scope
        if (!['global', 'tenant'].includes(scope)) {
            return {
                status: 400,
                body: errorResponse('Invalid scope', 400),
            };
        }
        // Validate tenantId if scope is tenant
        if (scope === 'tenant' && !tenantId) {
            return {
                status: 400,
                body: errorResponse('Tenant ID is required for tenant scope', 400),
            };
        }

        const newRole = await roleService.createRole({
            name,
            scope,
            tenantId: tenantId || null,
            modulePermissions: modulePermissions || []
        }, currentUser, conn);
        return {
            status: 201,
            body: successResponse("Role created", newRole),
        };
    } catch (err) {
        //consolle.error('Create Role error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}

// Get all roles

export async function getRoles(query, conn) {
    try {
        const roleService = new RoleService(conn);
        const data = await roleService.getRoles(query, conn);
        return {
            status: 200,
            body: successResponse("Roles fetched successfully", data),
        };
    } catch (err) {
        //consolle.error('Get Roles error:', err);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}

// Get a role by ID

export async function getRoleById(id, conn) {
    try {
        const roleService = new RoleService(conn);
        const role = await roleService.getRoleById(id, conn);
        if (!role) {
            return {
                status: 404,
                body: errorResponse('Role not found', 404),
            };
        }
        return {
            status: 200,
            body: successResponse("Role fetched", role),
        };
    } catch (err) {
        //consolle.error('Get Role error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}

// Update a role by ID

export async function updateRole(id, data, currentUser = null, conn) {
    try {
        const roleService = new RoleService(conn);
        // Pass currentUser to the service
        const updated = await roleService.updateRole(id, data, currentUser, conn);
        if (!updated) {
            return {
                status: 404,
                body: errorResponse('Role not found', 404),
            };
        }
        return {
            status: 200,
            body: successResponse("Role updated", updated),
        };
    } catch (err) {
        //consolle.error('Update Role error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}

// Delete a role by ID

export async function deleteRole(id, conn) {
    try {
        const roleService = new RoleService(conn);
        const deleted = await roleService.deleteRole(id, conn);
        if (!deleted) {
            return {
                status: 404,
                body: errorResponse('Role not found', 404),
            };
        }
        return {
            status: 200,
            body: successResponse("Role deleted", deleted),
        };
    } catch (err) {
        //consolle.error('Delete Role error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}
