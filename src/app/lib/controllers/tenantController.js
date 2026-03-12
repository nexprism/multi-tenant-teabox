import TenantService from '../services/tenantService.js';
import UserSchema from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import seedTenantDBs from 'tenantSeeder.js';
import RoleRepository from '../repository/roleRepository.js';

const tenantService = new TenantService(); // Import the schema only, not model

export async function createTenant(data) {
  if (!data.email) {
    return {
      status: 201,
      body: result?.success !== false ? { success: true, message: "Tenant created", data: result } : result,
      status: 400,
      body: { success: false, message: 'Email is required' },
    };
  }

  const password = data.password || `${data.companyName || 'name'}@112`;

  try {
    // 1. Create tenant (and global DB entry)
    const tenantResult = await tenantService.createTenant({
      ...data,
      email: data.email,
    });

    console.log('Tenant creation result:', tenantResult);

    if (!tenantResult || !tenantResult.body?.data?.dbUri) {
      return {
        status: 400,
        body: { success: false, message: 'Tenant creation failed' },
      };
    }

    // 2. Connect to tenant DB dynamically
    const tenantDbUri = tenantResult.body.data.dbUri;
    const tenantConnection = await mongoose.createConnection(tenantDbUri, {

    });

    // 3. Register the User model on tenant DB
    const TenantUser =
      tenantConnection.models.User ||
      tenantConnection.model('User', UserSchema);

    // 4. Fetch the 'tenant' role ID dynamically
    const roleRepo = new RoleRepository();
    const tenantRole = await roleRepo.findByName('tenant');
    const roleId = tenantRole?._id || new mongoose.Types.ObjectId('69ae77a1df4c2392c3543220'); // fallback to the global tenant role ID found earlier

    // 5. Create password hash and save user in tenant DB
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user in tenant DB
    const user = new TenantUser({
      name: data.companyName || data.email,
      email: data.email,
      passwordHash,
      role: roleId,
      tenant: tenantResult.body.data._id,
      isSuperAdmin: false,
      isActive: true,
      isDeleted: false,
    });

    await user.save();

    // Use the same _id for global user
    const GlobalUser =
      mongoose.models.User ||
      mongoose.model('User', UserSchema);

    const globalUser = new GlobalUser({
      _id: user._id, // ensure same _id
      name: data.companyName || data.email,
      email: data.email,
      passwordHash,
      role: roleId,
      tenant: tenantResult.body.data._id,
      isSuperAdmin: false,
      isActive: true,
      isDeleted: false,
    });

    await globalUser.save();

    await seedTenantDBs(tenantResult.body.data._id);


    return {
      status: tenantResult.status || 201,
      body: {
        success: true,
        tenant: tenantResult,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant: user.tenant,
        },
        password,
      },
    };
  } catch (err) {
    console.error('Error creating tenant:', err?.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}


export async function getAllTenants(query) {
  try {
    const result = await tenantService.getAllTenants(query);
    return {
      status: 200,
      body: { success: true, message: "Tenants fetched", data: result },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}

export async function getTenantById(id) {
  try {
    const result = await tenantService.getTenantById(id);
    if (!result) {
      return {
        status: 404,
        body: { success: false, message: "Tenant not found", data: null },
      };
    }
    return {
      status: 200,
      body: { success: true, message: "Tenant fetched", data: result },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}

export async function updateTenant(id, data) {
  try {
    const result = await tenantService.updateTenant(id, data);
    if (!result) {
      return {
        status: 404,
        body: { success: false, message: "Tenant not found", data: null },
      };
    }
    return {
      status: 200,
      body: { success: true, message: "Tenant updated", data: result },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}

export async function deleteTenant(id) {
  try {
    const result = await tenantService.deleteTenant(id);
    if (!result) {
      return {
        status: 404,
        body: { success: false, message: "Tenant not found", data: null },
      };
    }
    return {
      status: 200,
      body: { success: true, message: "Tenant deleted", data: result },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}

