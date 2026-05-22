const mongoose = require("mongoose");
const dotenv = require("dotenv");
const seedTenantDBs = require("../tenantSeeder");

dotenv.config();

const TENANT_ID = "ecomsaas";
const COMPANY_NAME = "Ecom SaaS";
const SUBDOMAIN = "ecomsaas";
const DB_URI = `mongodb+srv://anshul:anshul149@clusterdatabase.24furrx.mongodb.net/tenant_${SUBDOMAIN}?retryWrites=true&w=majority`;

async function onboard() {
    const globalDbUri = process.env.MONGODB_URI;
    if (!globalDbUri) {
        console.error("MONGODB_URI not found in .env");
        process.exit(1);
    }

    console.log(`Connecting to global database...`);
    const globalConn = await mongoose.createConnection(globalDbUri).asPromise();

    // Define Tenant Schema (matching src/app/lib/models/Tenant.js)
    const tenantSchema = new mongoose.Schema({
        tenantId: { type: String, required: true, unique: true },
        companyName: { type: String, required: true },
        subdomain: { type: String, required: true, unique: true },
        dbUri: { type: String },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
        subscriptionStatus: { type: String, enum: ['trial', 'active', 'cancelled', 'expired'], default: 'trial' },
        createdAt: { type: Date, default: Date.now },
    });

    const Tenant = globalConn.model("Tenant", tenantSchema);

    console.log(`Checking if tenant ${TENANT_ID} already exists...`);
    const existing = await Tenant.findOne({ tenantId: TENANT_ID });

    let tenantDoc;
    if (existing) {
        console.log(`Tenant ${TENANT_ID} already exists. Updating record...`);
        existing.dbUri = DB_URI;
        existing.subdomain = SUBDOMAIN;
        existing.companyName = COMPANY_NAME;
        await existing.save();
        tenantDoc = existing;
    } else {
        console.log(`Creating new tenant record for ${TENANT_ID}...`);
        tenantDoc = await Tenant.create({
            tenantId: TENANT_ID,
            companyName: COMPANY_NAME,
            subdomain: SUBDOMAIN,
            dbUri: DB_URI,
            status: 'active',
            plan: 'pro',
            subscriptionStatus: 'active'
        });
    }

    console.log(`Tenant record ready. ID: ${tenantDoc._id}`);

    console.log(`Running seeder to initialize tenant database (${DB_URI})...`);
    await seedTenantDBs(tenantDoc._id);

    console.log(`Onboarding complete for ${TENANT_ID}.hostilence.com`);
    await globalConn.close();
}

onboard().catch(err => {
    console.error("Onboarding failed:", err);
    process.exit(1);
});
