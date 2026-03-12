import { getDbConnection, getSubdomain } from "../tenantDb.js";
import dbConnect from "../../connection/dbConnect.js";

export async function getTrackDb(req, timeoutMs = 8000) {
  let subdomain = null;
  if (req && req.headers && typeof req.headers.get === "function") {
    subdomain = getSubdomain(req);
  }
  // Get dynamic DB connection instead of hardcoded static URI
  return await Promise.race([
    getDbConnection(subdomain),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB connection timed out")), timeoutMs)
    ),
  ]);
}
