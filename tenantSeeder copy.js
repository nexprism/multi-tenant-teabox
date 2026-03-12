const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Schemas
const globalModuleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

const globalRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scope: { type: String, enum: ['global', 'tenant'], required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  modulePermissions: [{
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    permissions: [{ type: String }]
  }],
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const globalTenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  dbUri: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'cancelled', 'expired'], default: 'trial' },
  trialEndsAt: { type: Date },
  renewalDate: { type: Date },
  lastAccessedAt: { type: Date },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  createdAt: { type: Date, default: Date.now },
});

// Seed Function
async function seedTenantDBs() {
  const globalDbUri = process.env.MONGODB_URI;

  // Connect to global DB
  const globalConn = await mongoose.createConnection(globalDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const GlobalModule = globalConn.model('Module', globalModuleSchema);
  const GlobalRole = globalConn.model('Role', globalRoleSchema);
  const GlobalTenant = globalConn.model('Tenant', globalTenantSchema);

  // Fetch data from global DB
  const globalModules = await GlobalModule.find({});
  const globalRoles = await GlobalRole.find({});
  const globalModuleIds = globalModules.map(m => m._id.toString());
  const globalRoleIds = globalRoles.map(r => r._id.toString());

  const tenants = await GlobalTenant.find();

  for (const tenant of tenants) {
    if (!tenant.dbUri) continue;

    const tenantConn = await mongoose.createConnection(tenant.dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const Module = tenantConn.model('Module', globalModuleSchema);
    const Role = tenantConn.model('Role', globalRoleSchema);

    // // Delete modules not in global list
    // await Module.deleteMany({ _id: { $nin: globalModuleIds } });

    // Upsert all modules
    for (const mod of globalModules) {
      await Module.replaceOne({ _id: mod._id }, mod.toObject(), { upsert: true });
    }

    // // Delete roles not in global list
    // await Role.deleteMany({ _id: { $nin: globalRoleIds } });

    // Upsert all roles with updated tenantId and full replacement
    for (const role of globalRoles) {
      const roleData = role.toObject();
      roleData.tenantId = tenant._id; // override tenantId

      await Role.replaceOne({ _id: role._id }, roleData, { upsert: true });
    }

    await tenantConn.close();
  }

  await globalConn.close();
  mongoose.disconnect();
}

// Run seeding
seedTenantDBs()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    process.exit(1);
  });
