import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb.js";
import { cartSchema } from "../../../lib/models/Cart.js";
import { verifyTokenAndUser } from "../../../middleware/commonAuth.js";

function validateCartItem(item) {
  if (!item || typeof item !== "object") return "Invalid item payload";
  if (!item.product) return "Product is required";
  if (item.quantity == null || isNaN(item.quantity) || item.quantity < 1)
    return "Quantity must be at least 1";
  if (item.price == null || isNaN(item.price) || item.price < 0)
    return "Price must be a non-negative number";
  return null;
}

async function getCartModel(conn) {
  // Ensure the model is registered on the provided connection (supports tenant createConnection)
  if (!conn) throw new Error("Connection is required");
  return conn.models.Cart || conn.model("Cart", cartSchema);
}

async function resolveContext(request) {
  // returns { conn, user, guestId }
  const subdomain = getSubdomain(request);
  const conn = await getDbConnection(subdomain);
  let user = null;
  try {
    const auth = await verifyTokenAndUser(request);
    if (!auth.error) user = auth.user;
  } catch (e) {
    // ignore
  }
  const body = await request.json().catch(() => ({}));
  const guestId =
    body.userIsGestId ||
    body.userIsGuestId ||
    request.headers.get("x-guest-id") ||
    null;
  return { conn, user, body, guestId };
}

export const POST = async function (request) {
  try {
    const { conn, user, body, guestId } = await resolveContext(request);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const item = body;
    const error = validateCartItem(item);
    if (error)
      return NextResponse.json(
        { success: false, message: error },
        { status: 400 }
      );

    const Cart = await getCartModel(conn);

    // find cart by user or guestId
    let cart = null;
    if (user && user._id) {
      cart = await Cart.findOne({ user: user._id });
      if (!cart)
        cart = await Cart.create({ user: user._id, items: [], total: 0 });
    } else {
      let gid = guestId;
      if (!gid)
        gid = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      cart = await Cart.findOne({ userIsGestId: gid });
      if (!cart)
        cart = await Cart.create({
          user: null,
          userIsGest: true,
          userIsGestId: gid,
          items: [],
          total: 0,
        });
    }

    // add or update existing item
    const existing = cart.items.find(
      (i) =>
        i.product.toString() === item.product &&
        ((i.variant && item.variant && i.variant.toString() === item.variant) ||
          (!i.variant && !item.variant))
    );
    if (existing) {
      existing.quantity += item.quantity;
      existing.price = item.price;
      // preserve existing.addedAt
    } else {
      cart.items.push({
        product: item.product,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      });
    }
    cart.total = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
    await cart.save();
    
    // Convert to plain object and populate product and variant details
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("items.variant")
      .lean();
      
    // Manually populate variants for each product
    const Variant = conn.models.Variant || conn.model("Variant", (await import("../../../lib/models/Variant.js")).variantSchema);
    if (populatedCart && populatedCart.items) {
      for (let item of populatedCart.items) {
        if (item.product && item.product._id) {
          const variants = await Variant.find({ productId: item.product._id }).lean();
          item.product.variants = variants;
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Item added", cart: populatedCart });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};

export const PUT = async function (request) {
  try {
    const { conn, user, body, guestId } = await resolveContext(request);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const { product, variant, quantity } = body;
    if (!product)
      return NextResponse.json(
        { success: false, message: "product is required" },
        { status: 400 }
      );
    if (quantity == null || isNaN(quantity) || quantity < 1)
      return NextResponse.json(
        { success: false, message: "Quantity must be at least 1" },
        { status: 400 }
      );

    const Cart = await getCartModel(conn);
    let cart = null;
    if (user && user._id) cart = await Cart.findOne({ user: user._id });
    else cart = await Cart.findOne({ userIsGestId: guestId });
    if (!cart)
      return NextResponse.json(
        { success: false, message: "Cart not found" },
        { status: 404 }
      );

    const item = cart.items.find(
      (i) =>
        i.product.toString() === product &&
        ((i.variant && variant && i.variant.toString() === variant) ||
          (!i.variant && !variant))
    );
    if (!item)
      return NextResponse.json(
        { success: false, message: "Item not found in cart" },
        { status: 404 }
      );
    item.quantity = quantity;
    cart.total = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
    await cart.save();
    
    // Convert to plain object and populate product and variant details
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("items.variant")
      .lean();
      
    // Manually populate variants for each product
    const Variant = conn.models.Variant || conn.model("Variant", (await import("../../../lib/models/Variant.js")).variantSchema);
    if (populatedCart && populatedCart.items) {
      for (let item of populatedCart.items) {
        if (item.product && item.product._id) {
          const variants = await Variant.find({ productId: item.product._id }).lean();
          item.product.variants = variants;
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Item updated", cart: populatedCart });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};

export const DELETE = async function (request) {
  try {
    const { conn, user, body, guestId } = await resolveContext(request);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const { product, variant } = body;
    if (!product)
      return NextResponse.json(
        { success: false, message: "product is required" },
        { status: 400 }
      );

    const Cart = await getCartModel(conn);
    let cart = null;
    if (user && user._id) cart = await Cart.findOne({ user: user._id });
    else cart = await Cart.findOne({ userIsGestId: guestId });
    if (!cart)
      return NextResponse.json(
        { success: false, message: "Cart not found" },
        { status: 404 }
      );

    cart.items = cart.items.filter(
      (i) =>
        !(
          i.product.toString() === product &&
          ((i.variant && variant && i.variant.toString() === variant) ||
            (!i.variant && !variant))
        )
    );
    cart.total = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
    await cart.save();
    
    // Convert to plain object and populate product and variant details
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("items.variant")
      .lean();
      
    // Manually populate variants for each product
    const Variant = conn.models.Variant || conn.model("Variant", (await import("../../../lib/models/Variant.js")).variantSchema);
    if (populatedCart && populatedCart.items) {
      for (let item of populatedCart.items) {
        if (item.product && item.product._id) {
          const variants = await Variant.find({ productId: item.product._id }).lean();
          item.product.variants = variants;
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Item removed", cart: populatedCart });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};
