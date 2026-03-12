import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import { cartSchema } from "../../lib/models/Cart.js";
import { verifyTokenAndUser } from "../../middleware/commonAuth.js";

// Helper to find or create a cart for either an authenticated user or a guest identifier
async function findOrCreateCart({ conn, user, guestId }) {
  if (!conn) throw new Error("Connection is required");
  const Cart = conn.models.Cart || conn.model("Cart", cartSchema);
  const Variant = conn.models.Variant || conn.model("Variant", (await import("../../lib/models/Variant.js")).variantSchema);
  
  let cart = null;
  if (user && user._id) {
    cart = await Cart.findOne({ user: user._id })
      .populate("items.product")
      .populate("items.variant")
      .lean(); // Convert to plain JS object
    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [], total: 0 });
      return cart;
    }
    
    // Manually populate variants for each product
    if (cart && cart.items) {
      for (let item of cart.items) {
        if (item.product && item.product._id) {
          const variants = await Variant.find({ productId: item.product._id }).lean();
          item.product.variants = variants;
        }
      }
    }
    return cart;
  }

  // Guest flow: use userIsGestId
  if (!guestId) {
    // generate a simple guest id if none provided
    guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
  cart = await Cart.findOne({ userIsGestId: guestId })
    .populate("items.product")
    .populate("items.variant")
    .lean(); // Convert to plain JS object
  if (!cart) {
    cart = await Cart.create({
      user: null,
      userIsGest: true,
      userIsGestId: guestId,
      items: [],
      total: 0,
    });
    return cart;
  }
  
  // Manually populate variants for each product
  if (cart && cart.items) {
    for (let item of cart.items) {
      if (item.product && item.product._id) {
        const variants = await Variant.find({ productId: item.product._id }).lean();
        item.product.variants = variants;
      }
    }
  }
  return cart;
}

export const GET = async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    // Try to resolve user from token if present (optional)
    let user = null;
    try {
      const auth = await verifyTokenAndUser(request);
      if (!auth.error) user = auth.user;
    } catch (e) {
      // ignore - we treat as guest
    }

    const url = new URL(request.url);
    const guestId =
      url.searchParams.get("guestId") ||
      request.headers.get("x-guest-id") ||
      null;

    const cart = await findOrCreateCart({ conn, user, guestId });
    return NextResponse.json({ success: true, cart });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};

export const POST = async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    let user = null;
    try {
      const auth = await verifyTokenAndUser(request);
      if (!auth.error) user = auth.user;
    } catch (e) {
      // ignore - guest will be used
    }

    const body = await request.json().catch(() => ({}));
    const guestId =
      body.userIsGestId ||
      body.userIsGuestId ||
      request.headers.get("x-guest-id") ||
      null;

    const cart = await findOrCreateCart({ conn, user, guestId });
    return NextResponse.json({ success: true, cart });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};
