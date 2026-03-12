import mongoose from "mongoose";

async function dbConnect(dbUri) {
  // //consolle.log("Connecting to MongoDB...", dbUri);
  const defaultUri = process.env.MONGODB_URI;
  const uri = dbUri || defaultUri;
  // //consolle.log("Using URI:", uri);
  if (!uri) {
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
    if (uri === defaultUri) {
      // Use default connection for global DB
      cached.promise = mongoose
        .connect(uri, {
          bufferCommands: false,
          maxPoolSize: 10,
        })
        .then((mongoose) => mongoose.connection)
        .catch((err) => {
          cached.promise = null;
          throw err;
        });
    } else {
      // Use createConnection for tenant DBs
      const conn = mongoose.createConnection(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
      });
      cached.promise = new Promise((resolve, reject) => {
        conn.once("open", () => resolve(conn));
        conn.on("error", (err) => {
          cached.promise = null;
          reject(err);
        });
      });
    }
  }
  try {
    cached.conn = await cached.promise;
    if (process.env.NODE_ENV !== "production") {
      //consolle.log("MongoDB connected:", uri);
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
        ]);
      }
    } catch (err) {
      // swallow; model registration failures shouldn't block DB connection
    }

    return cached.conn;
  } catch (err) {
    //consolle.error("MongoDB connection error:", err);
    throw err;
  }
}

export default dbConnect;
