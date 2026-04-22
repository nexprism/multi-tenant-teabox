// tenantDb.js
import dbConnect from "../connection/dbConnect";
import mongoose from "mongoose";

export function getSubdomain(request) {
  const host = request.headers.get("host") || "";


  const xTenant = request.headers.get("x-tenant");
  if (xTenant && xTenant !== "localhost") return xTenant;

  const parts = host.split(".");
  if (parts.length > 2) return parts[0];
  if (parts.length === 2 && parts[0] !== "localhost") return parts[0];
  return null;
}

export async function getDbConnection(subdomain) {
  try {
    console.log("Getting DB connection for subdomain:", subdomain);
    if (!subdomain || subdomain === "localhost") {
      //consolle?.log('Using default DB for subdomain29829:', subdomain);
      return await dbConnect();
    }

    // Connect to the master database first
    await dbConnect();

    // Check for the Tenant model dynamically or build it if missing
    const tenantSchema = new mongoose.Schema({
      tenantId: String,
      companyName: String,
      subdomain: String,
      dbUri: String,
      status: String
    }, { collection: 'tenants' });

    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
    const tenant = await Tenant.findOne({ subdomain });
    console.log('[getDbConnection] Tenant lookup:', tenant);

    if (!tenant || !tenant.dbUri) {
      console.log(`Tenant '${subdomain}' not found or missing dbUri, falling back to default DB.`);
      return await dbConnect();
    }

    return await dbConnect(tenant.dbUri);
  } catch (error) {
    console.log("error in connecting ==> ", error.message);
  }
}
