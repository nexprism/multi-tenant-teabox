# Database Connection Flow (dbConnect & getDbConnection)

## 1. Subdomain Extraction
- The app extracts the subdomain from the request using `getSubdomain(request)`.
- This determines which tenant's data to use.

## 2. getDbConnection(subdomain)
- If `subdomain` is missing or 'localhost':
  - Calls `dbConnect()` to connect to the default (main) database.
- Otherwise:
  - Calls `dbConnect()` to connect to the main database (to access the tenants collection).
  - Looks up the tenant's DB URI in the `tenants` collection.
  - If found, calls `dbConnect(tenant.dbUri)` to connect to the tenant's database.
  - If not found, falls back to the default database.

## 3. dbConnect(dbUri)
- Checks if a connection for the given `dbUri` already exists (using a global cache).
- If not, creates a new connection:
  - Uses `mongoose.connect` for the default DB.
  - Uses `mongoose.createConnection` for tenant DBs.
- Registers common models on the connection if needed (for population).
- Returns the connection object.

## 4. Result
- Every request is routed to the correct MongoDB database (default or tenant-specific) based on the subdomain, ensuring data isolation for each tenant.

---

**This logic ensures multi-tenancy and data security in your app.**
