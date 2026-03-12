import { NextResponse } from "next/server";
import { getTrackDb } from "../../lib/db/trackDb";
import { EventModel } from "../../models/Event";
import { ProductSchema } from "../../models/Product";
import mongoose from "mongoose";
import { useTrack } from "@/app/lib/tracking/useTrack";
import { trackEvent } from "@/app/lib/tracking/trackEvent"; // added import

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
    // Optionally decrement cartCount
  },
  ADD_TO_WISHLIST: async (event, conn) => {
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    await Product.findByIdAndUpdate(event.productId, { $inc: { wishlistCount: 1 } });
  },
  REMOVE_FROM_WISHLIST: async (event, conn) => {
    // Optionally decrement wishlistCount
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