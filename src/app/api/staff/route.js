import { NextResponse } from "next/server";
import UserService from "../../lib/services/userService.js";
import { Token } from "../../middleware/generateToken.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import RoleRepository from "../../lib/repository/roleRepository.js";

// Register (Create User)
export async function POST(request) {
  try {
   
    const subdomain = getSubdomain(request);
   
    
    const conn = await getDbConnection(subdomain);
    if (!conn) {
   
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const userService = new UserService(conn);
    const roleRepo = new RoleRepository(conn);

    const body = await request.json();
    
    const {
      name,
      email,
      password,
      role,
      tenant,
      isSuperAdmin,
      isActive,
      isDeleted,
    } = body;
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    let finalTenant = tenant || null;
    let finalRole = role || null;

    // Validate role and tenant IDs if provided
    if (role) {
      
      if (!mongoose.Types.ObjectId.isValid(role)) {
       
        return NextResponse.json(
          { success: false, message: "Invalid role ID." },
          { status: 400 }
        );
      }
      // Fetch the role document using repository
      const roleDoc = await roleRepo.findById(role);
      if (!roleDoc) {
      
        return NextResponse.json(
          { success: false, message: "Role not found." },
          { status: 400 }
        );
      }
      console.log("POST /api/staff - Role found:", roleDoc.name, "Scope:", roleDoc.scope);
      
      // Handle tenant assignment based on role
      if (roleDoc.name == "Customer") {
        finalTenant = roleDoc.tenantId || null;
      } else if (roleDoc.scope === "tenant") {
      
        // If tenant was provided, it should match the role's tenantId
        if (roleDoc.tenantId) {
          if (tenant && tenant.toString() !== roleDoc.tenantId.toString()) {
            console.error("POST /api/staff - Tenant mismatch for tenant-scoped role");
            return NextResponse.json(
              { success: false, message: "Tenant-scoped role does not belong to the specified tenant." },
              { status: 400 }
            );
          }
          finalTenant = roleDoc.tenantId;
        } else {
          // Role has tenant scope but no tenantId - use provided tenant or null
          finalTenant = tenant || null;
        }
      }
      // For global-scoped roles, use provided tenant or null
    } else {
      console.warn("POST /api/staff - No role provided in request");
    }

    // Check if user exists
    console.log("POST /api/staff - Checking if email exists:", email);
    const existing = await userService.findByEmail(email);
    if (existing) {
      console.error("POST /api/staff - Email already exists:", email);
      return NextResponse.json(
        { success: false, message: "Email already registered." },
        { status: 400 }
      );
    }

   
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      name,
      email,
      passwordHash,
      role: finalRole,
      tenant: finalTenant ? (typeof finalTenant === 'string' ? finalTenant : finalTenant.toString()) : null,
      isSuperAdmin: !!isSuperAdmin,
      isActive: isActive !== undefined ? !!isActive : true,
      isDeleted: isDeleted !== undefined ? !!isDeleted : false,
    };
    console.log("POST /api/staff - Creating user with data:", { 
      ...userData, 
      passwordHash: "[HIDDEN]",
      role: finalRole ? finalRole.toString() : null,
      tenant: finalTenant ? finalTenant.toString() : null,
    });
    
    try {
      const user = await userService.createUser(userData);
    
      
      // Generate tokens
      const tokens = Token.generateTokens(user);

      // Return user info (without password) and tokens
      const userObj = user.toObject();
      delete userObj.passwordHash;

      return NextResponse.json(
        { success: true, data: userObj, user: userObj, ...tokens },
        { status: 201 }
      );
    } catch (userServiceError) {
     
      throw userServiceError;
    }

  } catch (err) {
   
    
    // Handle Mongoose validation errors
    if (err?.name === 'ValidationError' && err?.errors) {
      const validationErrors = Object.values(err.errors).map((e) => e.message).join(', ');
      return NextResponse.json(
        { success: false, message: `Validation error: ${validationErrors}` },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors (e.g., duplicate email)
    if (err?.code === 11000 || err?.code === 11001) {
      const field = Object.keys(err?.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        { success: false, message: `${field} already exists` },
        { status: 400 }
      );
    }
    
    // Return specific error message if available
    const errorMessage = err?.message || "Something went wrong";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 400 }
    );
  }
}

// Login
export async function PATCH(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    //consolle.log("PATCH /user login subdomain:", subdomain);
    //consolle.log(
    //   "PATCH /user login conn:",
    //   conn ? "connected" : "not connected"
    // );

    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const userService = new UserService(conn);

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await userService.findByEmail(email);
    if (!user || user.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = Token.generateTokens(user);

    // Return user info (without password) and tokens
    const userObj = user.toObject();
    delete userObj.passwordHash;

    return NextResponse.json(
      { success: true, user: userObj, ...tokens },
      { status: 200 }
    );
  } catch (err) {
    //consolle.error("PATCH /user login error:", err?.message);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    //consolle.log("GET /user subdomain: ===> ", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const userService = new UserService(conn);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get user by ID
      const user = await userService.getUserById(id);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }
      const userObj = user.toObject();
      delete userObj.passwordHash;
      return NextResponse.json(
        { success: true, user: userObj },
        { status: 200 }
      );
    } else {
      // Get users with filters
      const query = {};
      for (const [key, value] of searchParams.entries()) {
        // Handle boolean values
        if (value === 'true') {
          query[key] = true;
        } else if (value === 'false') {
          query[key] = false;
        } else {
          query[key] = value;
        }
      }

      // Parse filters if provided as JSON string
      const filtersParam = searchParams.get('filters');
      if (filtersParam) {
        try {
          const filters = typeof filtersParam === 'string' ? JSON.parse(filtersParam) : filtersParam;
          Object.assign(query, filters);
        } catch (e) {
          console.warn('Failed to parse filters:', e);
        }
      }

      //set query for role != 6888848d897c0923edbed1fb or 6888d1dd50261784a38dd087
      const isAdmin_and_Customer = [
        "6888848d897c0923edbed1fb",
        "6888d1dd50261784a38dd087",
      ];

      query.role = { $nin: isAdmin_and_Customer };

      // Ensure isDeleted filter is applied - exclude deleted users by default
      // If filters.isDeleted is explicitly set to false, ensure it's handled
      if (query.isDeleted === false || query.isDeleted === 'false') {
        query.isDeleted = false;
        // Don't set includeDeleted flag, so userService will filter out deleted
      } else if (query.isDeleted === undefined) {
        // Default: exclude deleted users
        query.isDeleted = false;
      }

      const { users, total, page, limit } = await userService.getAllUsers(
        query
      );

      const sanitizedUsers = users.map((u) => {
        const userObj = u.toObject();
        delete userObj.passwordHash;
        return userObj;
      });

      return NextResponse.json(
        {
          success: true,
          users: sanitizedUsers,
          total,
          page,
          limit,
        },
        { status: 200 }
      );
    }
  } catch (err) {
    //consolle.error("GET /user error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    //consolle.log("PUT /user subdomain:", subdomain);
    //consolle.log(
    //   "PUT /user db connection:",
    //   conn ? "connected" : "not connected"
    // );

    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    const userService = new UserService(conn);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    //consolle.log("PUT /user id:", id);

    const body = await request.json();
    //consolle.log("PUT /user update body:", body);

    const result = await userService.updateUser(id, body);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "User not found or deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    //consolle.error("PUT /user error:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const userService = new UserService(conn);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const result = await userService.deleteUser(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error("DELETE /user error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
