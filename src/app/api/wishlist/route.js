import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import wishlistController from "../../lib/controllers/wishlistController.js";
import { withUserAuth } from "../../middleware/commonAuth.js";
import mongoose from "mongoose";

function validateWishlistItem(item) {
  if (!item || typeof item !== "object") return "Invalid item payload";
  if (!item.product) return "Product is required";
  return null;
}

export const GET = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    request.user = request.user || {};
    return await wishlistController.getWishlist(request, null, null, conn);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
});

export const POST = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const body = await request.json();
    const error = validateWishlistItem(body);
    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 400 }
      );
    }
    request.user = request.user || {};
    return await wishlistController.addItem(request, null, body, conn);
  } catch (err) {
    //consolle.log("error ", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
});

export const DELETE = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const productId = request.nextUrl.searchParams.get("productId");
    const variantId = request.nextUrl.searchParams.get("variantId");
    //consolle.log("Removing item from wishlist:", productId, variantId);

    request.user = request.user || {};
    return await wishlistController.removeItem(
      request,
      null,
      { productId, variantId },
      conn
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
});

export const PUT = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const { action } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );
    if (action === "clear") {
      request.user = request.user || {};
      return await wishlistController.clearWishlist(request, null, null, conn);
    }
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
});
