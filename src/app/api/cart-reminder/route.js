import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb.js";
import { cartSchema } from "@/app/lib/models/Cart.js";
import userSchema from "@/app/lib/models/User.js";
import { ProductSchema } from "@/app/lib/models/Product.js";
import WhatsappService from "@/app/lib/services/WhatsappService.js";

/**
 * Tenant-aware per-product cart reminder endpoint.
 *
 * Usage:
 *  - Call this endpoint from a scheduler (hourly/daily).
 *  - Query param `period` controls cutoff. Supported values:
 *      - "1 week" | "1w"
 *      - "2 week" | "2w"
 *      - "1 month" | "1m"
 *    Default: "1 week"
 *
 * Example: GET /api/cart-reminder?period=2w
 */
export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    // Ensure models are registered on this connection (important for tenant connections)
    const Cart = conn.models.Cart || conn.model("Cart", cartSchema);
    // Register User and Product schemas on the same connection so populate() works
    try {
      conn.models.User || conn.model("User", userSchema);
    } catch (e) {
      // ignore if already registered or schema incompatible
    }
    try {
      conn.models.Product || conn.model("Product", ProductSchema);
    } catch (e) {
      // ignore
    }

    const url = new URL(request.url);
    const periodRaw = (url.searchParams.get("period") || "1 week").toString();
    const p = periodRaw.trim().toLowerCase();
    const periodMap = {
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1 week": 7 * 24 * 60 * 60 * 1000,
      "2w": 14 * 24 * 60 * 60 * 1000,
      "2 week": 14 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "1 month": 30 * 24 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    };

    const ms = periodMap[p] || periodMap["1 week"];
    const humanPeriod =
      p === "2w" || p === "2 week"
        ? "2 week"
        : p === "1m" || p === "1 month"
        ? "1 month"
        : p === "24h"
        ? "24 hours"
        : "1 week";

    const cutoff = new Date(Date.now() - ms);

    // Find active carts that either have a linked user or have a phone (guest)
    const carts = await Cart.find({
      status: "active",
      items: { $exists: true, $ne: [] },
      $or: [{ user: { $ne: null } }, { phone: { $exists: true, $ne: null } }],
    })
      .populate("user", "name phone email")
      .populate("items.product", "title name");

    if (!carts.length) {
      return NextResponse.json({
        success: true,
        message: "No carts to process",
        processed: 0,
      });
    }

    console.log("fetched carts: ", carts);
    const whatsapp = new WhatsappService();
    let processedItems = 0;

    for (const cart of carts) {
      const phone = cart.user?.phone || cart.phone;
      if (!phone) continue; // need a phone to send reminder

      const name = cart.user?.name || "Customer";
      const email = cart.user?.email || cart.email || "";

      let modified = false;

      for (let idx = 0; idx < (cart.items || []).length; idx++) {
        const item = cart.items[idx];
        if (!item) continue;

        // If item has no addedAt we can't schedule reminders
        if (!item.addedAt) continue;

        const addedAt = new Date(item.addedAt);

        // derive product name if populated
        const productName =
          item.product?.title ||
          item.product?.name ||
          String(item.product || "");

        const now = new Date();

        // 1) First reminder: item hasn't got a firstReminderSentAt and addedAt <= cutoff
        if (!item.firstReminderSentAt && addedAt <= cutoff) {
          const payload = {
            phone,
            name,
            email,
            extraFields: {
              status: "abandonment",
              productName1: productName,
            },
          };

          try {
            const res = await whatsapp.sendWebhookRequest(payload);
            cart.items[idx].firstReminderSentAt = now;
            // do not set secondReminderSentAt here
            modified = true;
            if (res && res.success) processedItems += 1;
          } catch (err) {
            console.error(
              "Failed to send first reminder for item",
              item,
              err.message || err
            );
            // still mark first reminder sent to avoid repeated attempts; change if you prefer retries
            cart.items[idx].firstReminderSentAt = now;
            modified = true;
          }

          continue; // move to next item after attempting first reminder
        }

        // 2) Second reminder: firstReminderSentAt exists, secondReminderSentAt not set, and 7 days passed since first
        if (item.firstReminderSentAt && !item.secondReminderSentAt) {
          const firstAt = new Date(item.firstReminderSentAt);
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (now - firstAt >= sevenDaysMs) {
            const payload = {
              phone,
              name,
              email,
              extraFields: {
                status: "abandonment",
                productName1: productName,
              },
            };

            try {
              const res = await whatsapp.sendWebhookRequest(payload);
              cart.items[idx].secondReminderSentAt = now;
              modified = true;
              if (res && res.success) processedItems += 1;
            } catch (err) {
              console.error(
                "Failed to send second reminder for item",
                item,
                err.message || err
              );
              // still mark second reminder sent to avoid repeat attempts; change if you prefer retries
              cart.items[idx].secondReminderSentAt = now;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        try {
          await cart.save();
        } catch (err) {
          console.error(
            "Failed to save cart after marking reminders",
            cart._id,
            err.message || err
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedItems} item reminders`,
      processed: processedItems,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}
