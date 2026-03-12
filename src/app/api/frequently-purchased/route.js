import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb";
import FrequentlyPurchasedProductService from "../../lib/services/FrequentlyPurchasedProductService";
import { FrequentlyPurchasedProductSchema } from "../../lib/models/FrequentlyPurchasedProduct.js";
import { ProductSchema } from "../../lib/models/Product.js";
import userSchema from "../../lib/models/User.js"; // Import User schema
import { withUserAuth } from "../../middleware/commonAuth.js";

export const POST = withUserAuth(async function (req) {
  try {
    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //console.log("Connection name in route:", conn.name);

    // Register models
    const FrequentlyPurchasedProduct =
      conn.models.FrequentlyPurchasedProduct ||
      conn.model("FrequentlyPurchasedProduct", FrequentlyPurchasedProductSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const User = conn.models.User || conn.model("User", userSchema);
    // console.log("Models registered:", {
    //   FrequentlyPurchasedProduct: FrequentlyPurchasedProduct.modelName,
    //   Product: Product.modelName,
    //   User: User.modelName,
    // });

    // Check if user is admin
    const user = req.user;
    const isAdmin =
      user.isSuperAdmin || user.role.toString() === "6888d1dd50261784a38dd087";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const service = new FrequentlyPurchasedProductService(conn);

    const body = await req.json();
    const { productId, priority = 0 } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "productId is required" },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid productId" },
        { status: 400 }
      );
    }

    // Check if product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate product
    const existingEntry = await FrequentlyPurchasedProduct.exists({ productId });
    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: "Product already added to frequently purchased list" },
        { status: 400 }
      );
    }

    // Add product
    const data = {
      productId,
      priority,
      addedBy: user._id,
    };
    const result = await service.addProduct(data, conn);

    return NextResponse.json(
      {
        success: true,
        message: "Product added to frequently purchased list",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    //console.error("Route POST frequently purchased error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
});

export const GET = withUserAuth(async function (req) {
  try {
    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //console.log("Connection name in route:", conn.name);
    const FrequentlyPurchasedProduct =
      conn.models.FrequentlyPurchasedProduct ||
      conn.model("FrequentlyPurchasedProduct", FrequentlyPurchasedProductSchema);
    // console.log("Models registered:", {
    //   FrequentlyPurchasedProduct: FrequentlyPurchasedProduct.modelName,
    // });

    const service = new FrequentlyPurchasedProductService(conn);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    const products = await service.getFrequentlyPurchased(conn, limit);

    return NextResponse.json(
      {
        success: true,
        message: "Frequently purchased products fetched successfully",
        data: products,
      },
      { status: 200 }
    );
  } catch (error) {
    //console.error("Route GET frequently purchased error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
});