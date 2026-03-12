import { NextResponse } from "next/server";
import { getTrackDb } from "../../lib/db/trackDb";
import { EventModel } from "../../models/Event";
import { ProductSchema } from "../../models/Product";
import mongoose from "mongoose";

const METRIC_MAP = {
  PRODUCT_VIEW: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, {
      $inc: { views: 1 },
      $set: { lastViewedAt: new Date() }
    });
  },
  ADD_TO_CART: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, { $inc: { cartCount: 1 } });
  },
  REMOVE_FROM_CART: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, { $inc: { cartCount: -1 } });
  },
  ADD_TO_WISHLIST: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, { $inc: { wishlistCount: 1 } });
  },
  REMOVE_FROM_WISHLIST: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, { $inc: { wishlistCount: -1 } });
  },
  ORDER_PLACED: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    if (Array.isArray(event.productIds)) {
      await Product.updateMany(
        { _id: { $in: event.productIds } },
        { $inc: { purchaseCount: 1 }, $set: { lastPurchasedAt: new Date() } }
      );
    }
  },
  CHECKOUT_ABANDONED: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    if (Array.isArray(event.productIds)) {
      await Product.updateMany(
        { _id: { $in: event.productIds } },
        { $inc: { abandonedCount: 1 } }
      );
    }
  },
  SEARCH: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    if (Array.isArray(event.productIds)) {
      await Product.updateMany(
        { _id: { $in: event.productIds } },
        { $inc: { searchAppearances: 1 } }
      );
    }
  },
  SIGNUP: async (event, conn) => {
    try {
      const usersColl = conn.db.collection("users");
      if (!event.userId && event.user && (event.user._id || event.user.id)) {
        event.userId = event.user._id || event.user.id;
      }
      const uid = event.userId;
      if (uid) {
        const query = mongoose.Types.ObjectId.isValid(uid) ? { _id: new mongoose.Types.ObjectId(uid) } : { _id: uid };
        await usersColl.updateOne(query, { $inc: { signupCount: 1 }, $set: { signedUpAt: new Date() } }, { upsert: true });
      }
    } catch (e) {
      console.error("SIGNUP metric error:", e);
    }
  },
  LOGIN: async (event, conn) => {
    try {
      const usersColl = conn.db.collection("users");
      if (!event.userId && event.user && (event.user._id || event.user.id)) {
        event.userId = event.user._id || event.user.id;
      }
      const uid = event.userId;
      if (uid) {
        const query = mongoose.Types.ObjectId.isValid(uid) ? { _id: new mongoose.Types.ObjectId(uid) } : { _id: uid };
        await usersColl.updateOne(query, { $inc: { loginCount: 1 }, $set: { lastLoginAt: new Date() } }, { upsert: false });
      }
    } catch (e) {
      console.error("LOGIN metric error:", e);
    }
  },
  PAGE_VIEW: async (event, conn) => {
    try {
      const pagesColl = conn.db.collection("pages");
      const url = event.url || event.path || null;
      if (!url) return;
      await pagesColl.updateOne(
        { url },
        { $inc: { views: 1 }, $set: { lastViewedAt: new Date(), title: event.title || null } },
        { upsert: true }
      );
    } catch (e) {
      console.error("PAGE_VIEW metric error:", e);
    }
  },
  // ...other event types...
};

function waitForConnection(conn, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (conn.readyState === 1) return resolve();
    const timer = setTimeout(() => reject(new Error("DB not connected in time")), timeoutMs);
    conn.once("connected", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    let conn;
    try {
      conn = await getTrackDb(undefined, 8000); // 8s timeout
      await waitForConnection(conn, 8000); // Ensure connection is ready
    } catch (dbErr) {
      return NextResponse.json(
        { success: false, error: "Database connection failed: " + dbErr.message },
        { status: 500 }
      );
    }

    // Use native collection to avoid mongoose buffering on default connection
    const eventsColl = conn.db.collection("events");

    // Batch event support
    if (Array.isArray(body.batch)) {
      const eventsData = body.batch.map((evt) => {
        let eventData = { ...evt, timestamp: new Date() };
        if (evt.user && typeof evt.user === "object") {
          eventData.userId = evt.user._id;
          eventData.userInfo = { ...evt.user };
        }
        return eventData;
      });
      try {
        await eventsColl.insertMany(eventsData, {
          writeConcern: { w: 1 },
          maxTimeMS: 8000,
          ordered: false, // allow partial success
        });
      } catch (insertErr) {
        //consolle.error("Batch insert error:", insertErr);
        return NextResponse.json(
          { success: false, error: "Batch insert failed: " + insertErr.message },
          { status: 500 }
        );
      }

      for (const evt of body.batch) {
        if (METRIC_MAP[evt.type]) {
          await METRIC_MAP[evt.type](evt, conn);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Single event (legacy) - use native insertOne to avoid buffering
    let eventData = { ...body, timestamp: new Date() };
    if (body.user && typeof body.user === "object") {
      eventData.userId = body.user._id;
      eventData.userInfo = { ...body.user };
    }

    try {
      await eventsColl.insertOne(eventData, { writeConcern: { w: 1 }, maxTimeMS: 8000 });
    } catch (singleInsertErr) {
      //consolle.error("Single insert error:", singleInsertErr);
      return NextResponse.json(
        { success: false, error: "Event insert failed: " + singleInsertErr.message },
        { status: 500 }
      );
    }

    if (METRIC_MAP[body.type]) {
      await METRIC_MAP[body.type](body, conn);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// export async function GET(req) {
//   try {
//     const url = new URL(req.url);
  

//     let conn;
//     try {
//       conn = await getTrackDb(undefined, 8000);
//       await waitForConnection(conn, 8000);
//     } catch (dbErr) {
//       return NextResponse.json(
//         { success: false, error: "Database connection failed: " + dbErr.message },
//         { status: 500 }
//       );
//     }

//     const eventsColl = conn.db.collection("events");

//     // Build filter from query params
//     const filter = {};
//     const type = url.searchParams.get("type");
//     const productId = url.searchParams.get("productId");
//     const userId = url.searchParams.get("userId");
//     const since = url.searchParams.get("since"); // ISO date
//     const limit = Math.min(1000, parseInt(url.searchParams.get("limit") || "200", 10));
//     const sortParam = url.searchParams.get("sort") || "-timestamp";
//     if (type) filter.type = type;
//     if (productId) {
//       try {
//         filter.productId = mongoose.Types.ObjectId.isValid(productId)
//           ? mongoose.Types.ObjectId(productId)
//           : productId;
//       } catch (e) {
//         filter.productId = productId;
//       }
//     }
//     if (userId) filter.userId = userId;
//     if (since) {
//       const d = new Date(since);
//       if (!isNaN(d.getTime())) filter.timestamp = { $gte: d };
//     }

//     const sort = sortParam.startsWith("-")
//       ? { [sortParam.slice(1)]: -1 }
//       : { [sortParam]: 1 };

//     const events = await eventsColl.find(filter).sort(sort).limit(limit).toArray();

//     // If userId provided, also fetch user document and addresses (best-effort)
//     let userDoc = null;
//     let addresses = [];
//     if (userId) {
//       try {
//         const usersColl = conn.db.collection("users");
//         if (mongoose.Types.ObjectId.isValid(userId)) {
//           userDoc = await usersColl.findOne({ _id: mongoose.Types.ObjectId(userId) });
//         } else {
//           userDoc = await usersColl.findOne({ _id: userId }) || await usersColl.findOne({ email: userId }) || null;
//         }
//       } catch (e) {
//         // non-blocking: don't fail the whole request if user lookup fails
//         userDoc = null;
//       }

//       try {
//         const addressesColl = conn.db.collection("addresses");
//         if (mongoose.Types.ObjectId.isValid(userId)) {
//           addresses = await addressesColl.find({ userId: mongoose.Types.ObjectId(userId) }).toArray();
//         } else {
//           addresses = await addressesColl.find({ userId }).toArray();
//         }
//       } catch (e) {
//         addresses = [];
//       }
//     }

//     return NextResponse.json({ success: true, count: events.length, events, user: userDoc, addresses });
//   } catch (err) {
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }


export async function GET(req) {
  try {
    const url = new URL(req.url);
  
    let conn;
    try {
      conn = await getTrackDb(undefined, 8000);
      await waitForConnection(conn, 8000);
    } catch (dbErr) {
      return NextResponse.json(
        { success: false, error: "Database connection failed: " + dbErr.message },
        { status: 500 }
      );
    }

    const eventsColl = conn.db.collection("events");

    // Build filter from query params
    const filter = {};
    const type = url.searchParams.get("type");
    const productId = url.searchParams.get("productId");
    const userId = url.searchParams.get("userId");
    const since = url.searchParams.get("since"); // legacy alias for from
    const from = url.searchParams.get("from") || since;
    const to = url.searchParams.get("to");
    const limit = Math.min(1000, parseInt(url.searchParams.get("limit") || "200", 10));
    const sortParam = url.searchParams.get("sort") || "-timestamp";
    
    if (type) filter.type = type;
    
    // Build flexible productId filter: match either ObjectId or string
    if (productId) {
      const prodFilter = {};
      try {
        if (mongoose.Types.ObjectId.isValid(productId)) {
          prodFilter.$or = [
            { productId: new mongoose.Types.ObjectId(productId) },
            { productId: productId },
          ];
        } else {
          prodFilter.productId = productId;
        }
      } catch (e) {
        prodFilter.productId = productId;
      }
      if (Object.keys(filter).length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push(prodFilter);
      } else {
        Object.assign(filter, prodFilter);
      }
    }

    // Flexible userId filter as well (match ObjectId or string)
    if (userId) {
      const uFilter = {};
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          uFilter.$or = [{ userId: new mongoose.Types.ObjectId(userId) }, { userId: userId }];
        } else {
          uFilter.userId = userId;
        }
      } catch (e) {
        uFilter.userId = userId;
      }
      if (Object.keys(filter).length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push(uFilter);
      } else {
        Object.assign(filter, uFilter);
      }
    }

    // Date range filtering: from (>=) and to (<=)
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) {
        filter.timestamp = filter.timestamp || {};
        filter.timestamp.$gte = d;
      }
    }
    if (to) {
      const d2 = new Date(to);
      if (!isNaN(d2.getTime())) {
        filter.timestamp = filter.timestamp || {};
        filter.timestamp.$lte = d2;
      }
    }

    const sort = sortParam.startsWith("-")
      ? { [sortParam.slice(1)]: -1 }
      : { [sortParam]: 1 };

    // Compute totals per event type for the full matching set (ignore limit)
    let eventTotals = {};
    try {
      const aggPipeline = [{ $match: filter }, { $group: { _id: "$type", count: { $sum: 1 } } }];
      const aggRes = await eventsColl.aggregate(aggPipeline, { allowDiskUse: true }).toArray();
      eventTotals = aggRes.reduce((acc, cur) => {
        acc[cur._id || "UNKNOWN"] = cur.count;
        return acc;
      }, {});
    } catch (e) {
      console.error("Event totals agg error:", e);
      eventTotals = {};
    }

    const events = await eventsColl.find(filter).sort(sort).limit(limit).toArray();

    // --- Fetch users / addresses BEFORE creating populated events (fixes addressesByUser access) ---
    const usersColl = conn.db.collection("users");
    const addressesColl = conn.db.collection("addresses");

    let userDoc = null;
    let addresses = [];
    let addressesByUser = {};

    if (userId) {
      try {
        const userIdToQuery = mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : userId;
        userDoc = await usersColl.findOne({ _id: userIdToQuery });
        if (!userDoc && typeof userId === 'string') {
          userDoc = await usersColl.findOne({ email: userId });
        }
      } catch (e) {
        console.error('User lookup error:', e);
        userDoc = null;
      }

      try {
        const userIdToQuery = mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : userId;
        addresses = await addressesColl.find({ user: userIdToQuery, deletedAt: null })
          .sort({ isDefault: -1, createdAt: -1 })
          .toArray();
      } catch (e) {
        console.error('Address lookup error:', e);
        addresses = [];
      }
    } else {
      // No single userId supplied — fetch addresses for users referenced in events (best-effort)
      const eventUserIds = [...new Set(
        events
          .map(e => e.userId)
          .filter(Boolean)
          .map(id => (typeof id === "object" && id._id) ? id._id : id)
      )];

      const MAX_USERS_TO_POPULATE = 50;
      if (eventUserIds.length > 0 && eventUserIds.length <= MAX_USERS_TO_POPULATE) {
        try {
          const userObjectIds = eventUserIds.map(id =>
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
          );
          const foundAddresses = await addressesColl.find({
            user: { $in: userObjectIds },
            deletedAt: null
          }).toArray();

          addressesByUser = foundAddresses.reduce((acc, addr) => {
            const uid = (addr.user && addr.user.toString) ? addr.user.toString() : String(addr.user);
            if (!acc[uid]) acc[uid] = [];
            acc[uid].push(addr);
            return acc;
          }, {});
        } catch (e) {
          console.error('Bulk address lookup error:', e);
          addressesByUser = {};
        }
      }
    }

    // Populate products for events (only name and variant)
    const productsColl = conn.db.collection("products");
    const productIds = [...new Set(
      events
        .map(e => e.productId)
        .filter(id => id != null)
    )];

    let productsMap = {};
    if (productIds.length > 0) {
      const products = await productsColl.find(
        {
          _id: { $in: productIds.map(id => 
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
          )}
        },
        {
          projection: { name: 1, variant: 1, slug: 1 } // Only fetch name and variant fields
        }
      ).toArray();
      
      productsMap = products.reduce((acc, product) => {
        acc[product._id.toString()] = {
          name: product.name,
          variant: product.variant,
          slug: product.slug
        };
        return acc;
      }, {});
    }

    // Add populated product and addresses to each event
    const populatedEvents = events.map((event) => {
      const product = event.productId
        ? productsMap[event.productId.toString()] || null
        : null;

      // normalize user id string for lookup
      const uid =
        event.userId && typeof event.userId === "object" && event.userId._id
          ? String(event.userId._id)
          : event.userId
          ? String(event.userId)
          : null;

      let eventAddresses = [];
      if (userId) {
        // single-user path: use addresses fetched into `addresses` variable
        eventAddresses = addresses || [];
      } else if (uid && addressesByUser && addressesByUser[uid]) {
        eventAddresses = addressesByUser[uid];
      } else {
        eventAddresses = [];
      }

      return {
        ...event,
        product,
        addresses: eventAddresses,
      };
    });

    return NextResponse.json({ 
      success: true, 
      count: populatedEvents.length,
      events: populatedEvents,
      user: userDoc,
      addresses,
      addressesByUser,
      eventTotals, // totals per event type for the whole matching set
      currentWishlisted: (eventTotals["ADD_TO_WISHLIST"] || 0) - (eventTotals["REMOVE_FROM_WISHLIST"] || 0),
      currentCartCount: (eventTotals["ADD_TO_CART"] || 0) - (eventTotals["REMOVE_FROM_CART"] || 0)
    });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}