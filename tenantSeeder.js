const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Helper: wait for a connection to open or fail within a timeout
function waitForConnection(conn, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let settled = false;

    function onOpen() {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    }

    function onError(err) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    }

    function onTimeout() {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`connection timed out after ${timeoutMs}ms`));
    }

    function cleanup() {
      conn.removeListener("open", onOpen);
      conn.removeListener("connected", onOpen);
      conn.removeListener("error", onError);
      clearTimeout(timer);
    }

    conn.once("open", onOpen);
    conn.once("connected", onOpen);
    conn.once("error", onError);

    const timer = setTimeout(onTimeout, timeoutMs);
  });
}

// Schemas
const globalModuleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const globalRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scope: { type: String, enum: ["global", "tenant"], required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  modulePermissions: [
    {
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: true,
      },
      permissions: [{ type: String }],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const globalTenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  dbUri: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  plan: {
    type: String,
    enum: ["free", "basic", "pro", "enterprise"],
    default: "free",
  },
  subscriptionStatus: {
    type: String,
    enum: ["trial", "active", "cancelled", "expired"],
    default: "trial",
  },
  trialEndsAt: { type: Date },
  renewalDate: { type: Date },
  lastAccessedAt: { type: Date },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
  createdAt: { type: Date, default: Date.now },
});

// Seed Function
async function seedTenantDBs(singleTenantId = null) {
  const globalDbUri = process.env.MONGODB_URI;

  if (!globalDbUri) {
    console.error("MONGODB_URI not provided");
    throw new Error("MONGODB_URI not provided");
  }

  // Connect to global DB (fail fast with serverSelectionTimeoutMS)
  const globalConn = mongoose.createConnection(globalDbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await waitForConnection(globalConn, 10000);
  } catch (err) {
    console.error("Failed to connect to global DB inside seedTenantDBs:", err);
    await globalConn.close().catch(() => {});
    throw err;
  }

  const GlobalModule = globalConn.model("Module", globalModuleSchema);
  const GlobalRole = globalConn.model("Role", globalRoleSchema);
  const GlobalTenant = globalConn.model("Tenant", globalTenantSchema);

  // Fetch data from global DB
  const globalModules = await GlobalModule.find({});
  const globalRoles = await GlobalRole.find({});
  const globalModuleIds = globalModules.map((m) => m._id.toString());
  const globalRoleIds = globalRoles.map((r) => r._id.toString());

  // ✅ Get either one tenant or all tenants
  console.log("seedTenantDBs called with singleTenantId:", singleTenantId);
  const tenants = singleTenantId
    ? await GlobalTenant.find({ _id: singleTenantId })
    : await GlobalTenant.find();
  
  if (tenants.length === 0) {
    console.warn("No tenants found to seed for ID:", singleTenantId);
  }

  for (const tenant of tenants) {
    if (!tenant.dbUri) continue;
    const tenantConn = mongoose.createConnection(tenant.dbUri, {
      serverSelectionTimeoutMS: 10000,
    });

    try {
      await waitForConnection(tenantConn, 10000);

      const Module = tenantConn.model("Module", globalModuleSchema);
      const Role = tenantConn.model("Role", globalRoleSchema);

      // Upsert all modules
      for (const mod of globalModules) {
        await Module.replaceOne({ _id: mod._id }, mod.toObject(), {
          upsert: true,
        });
      }

      // Upsert all roles with updated tenantId
      for (const role of globalRoles) {
        const roleData = role.toObject();
        roleData.tenantId = tenant._id;
        await Role.replaceOne({ _id: role._id }, roleData, { upsert: true });
      }

    } catch (err) {
      console.error(`Error seeding tenant ${tenant._id}:`, err);
    } finally {
      await tenantConn.close().catch(() => {});
    }
  }

  await globalConn.close().catch(() => {});
}

// CLI support: node seedTenantDBs.js <tenantId>
if (require.main === module) {
  const tenantId = process.argv[2] || null;
  seedTenantDBs(tenantId)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1);
    });
}

module.exports = seedTenantDBs;
