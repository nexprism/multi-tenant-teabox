import mongoose from "mongoose";

async function dbConnect(dbUri) {
  // eslint-disable-next-line no-console
  const maskUri = (u) => {
    try {
      return u.replace(/:\/\/.*@/, '://***@');
    } catch (e) {
      return '***';
    }
  };

  // eslint-disable-next-line no-console
  console.log(`[dbConnect] Attempting connection. dbUri: ${maskUri(dbUri || '')}, defaultUri: ${maskUri(process.env.MONGODB_URI || '')}`);
  const defaultUri = process.env.MONGODB_URI;
  const uri = dbUri || defaultUri;
  // //consolle.log("Using URI:", uri);
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('[dbConnect] No MongoDB URI provided!');
    const err = new Error("DB not found");
    err.status = 404;
    throw err;
  }
  // Use a cache key per URI to allow multiple connections
  const cacheKey = "_mongooseCache_" + Buffer.from(uri).toString("base64");
  let cached = global[cacheKey];
  if (!cached) {
    cached = global[cacheKey] = { conn: null, promise: null };
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // Default connection options with reasonable timeouts so a bad
    // tenant URI doesn't block requests for the driver's 30s default.
    const defaultOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    if (uri === defaultUri) {
      // eslint-disable-next-line no-console
      console.log(`[dbConnect] Connecting to DEFAULT DB: ${maskUri(uri)}`);
      cached.promise = mongoose
        .connect(uri, defaultOptions)
        .then((mongoose) => {
          // eslint-disable-next-line no-console
          console.log(`[dbConnect] Connected to DEFAULT DB: ${maskUri(uri)}`);
          return mongoose.connection;
        })
        .catch((err) => {
          cached.promise = null;
          // eslint-disable-next-line no-console
          console.error(`[dbConnect] MongoDB default connection error (${maskUri(uri)}):`, err && err.message ? err.message : err);
          throw err;
        });
    } else {
      // eslint-disable-next-line no-console
      console.log(`[dbConnect] Connecting to TENANT DB: ${maskUri(uri)}`);
      const conn = mongoose.createConnection(uri, defaultOptions);
      cached.promise = new Promise((resolve, reject) => {
        conn.once("open", () => {
          // eslint-disable-next-line no-console
          console.log(`[dbConnect] Connected to TENANT DB: ${maskUri(uri)}`);
          resolve(conn);
        });
        conn.on("error", (err) => {
          cached.promise = null;
          // eslint-disable-next-line no-console
          console.error(`[dbConnect] MongoDB tenant connection error (${maskUri(uri)}):`, err && err.message ? err.message : err);
          reject(err);
        });
      });
    }
  }
  try {
    cached.conn = await cached.promise;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[dbConnect] MongoDB connected: ${maskUri(uri)}`);
    }
    // If this is a tenant connection (created via createConnection), ensure
    // commonly-populated referenced models (like `User`) are registered on
    // this connection so `populate()` doesn't throw MissingSchemaError.
    try {
      const connObj = cached.conn;
      // Only run for non-default connections (createConnection returns a Connection)
      if (connObj && connObj.model && connObj.models) {
        const ensure = async (name, path) => {
          if (!connObj.models[name]) {
            try {
              const mod = await import(path);
              // prefer an exported Schema named `${Name}Schema` or default export
              const schemaCandidate = mod[`${name}Schema`] || mod.default || mod[Object.keys(mod)[0]];
              const schema = schemaCandidate?.schema || schemaCandidate;
              if (schema) {
                connObj.model(name, schema);
              }
            } catch (e) {
              // ignore individual failures to register optional schemas
            }
          }
        };

        // Register the most common schemas used in populate calls.
        await Promise.all([
          ensure("User", "../lib/models/User.js"),
          ensure("Product", "../lib/models/Product.js"),
          ensure("Ticket", "../lib/models/Ticket.js"),
          ensure("Lead", "../lib/models/Lead.js"),
          ensure("Setting", "../lib/models/Setting.js"),
        ]);
      }
    } catch (err) {
      // swallow; model registration failures shouldn't block DB connection
    }

    return cached.conn;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[dbConnect] MongoDB connection error:`, err && err.message ? err.message : err);
    throw err;
  }
}

export default dbConnect;

// Optional: pre-warm default DB connection to avoid first-request stalls.
// Set environment variable PREWARM_DB=true to enable.
if (process.env.PREWARM_DB === 'true' && process.env.MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.log('Pre-warming default MongoDB connection...');
  dbConnect().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Pre-warm MongoDB connection failed:', err && err.message ? err.message : err);
  });
}
