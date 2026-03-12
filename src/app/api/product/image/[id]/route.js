import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../../lib/tenantDb.js";
import ProductRepository from "../../../../lib/repository/productRepository.js";
import ProductService from "../../../../lib/services/productService.js";
import ProductController from "../../../../lib/controllers/productController.js";
import ProductModel from "../../../../lib/models/Product.js";
import mongoose from "mongoose";

// DELETE /api/product/image/:id
export async function DELETE(req, context) {
  try {
    // ✅ params is async in App Router
    const params = await context.params;
    const { id } = params;

    // Normalize & sanitize
    let imageId = typeof id === "string" ? id : String(id || "");
    try {
      imageId = decodeURIComponent(imageId).trim();
    } catch {
      imageId = imageId.trim();
    }

    const subdomain = getSubdomain(req);

    // Validate ObjectId
    if (!mongoose.isValidObjectId(imageId)) {
      return NextResponse.json(
        { success: false, message: "Invalid image ID format" },
        { status: 400 }
      );
    }

    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);

    const objectId = new mongoose.Types.ObjectId(imageId);

    const product = await Product.findOne({
      $or: [
        { "images._id": objectId },
        { "descriptionImages._id": objectId }
      ]
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Image not found" },
        { status: 404 }
      );
    }

    let updated = false;

    if (product.images?.length) {
      const filtered = product.images.filter(
        img => img._id.toString() !== imageId
      );
      if (filtered.length !== product.images.length) {
        product.images = filtered;
        updated = true;
      }
    }

    if (!updated && product.descriptionImages?.length) {
      const filtered = product.descriptionImages.filter(
        img => img._id.toString() !== imageId
      );
      if (filtered.length !== product.descriptionImages.length) {
        product.descriptionImages = filtered;
        updated = true;
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Image not found" },
        { status: 404 }
      );
    }

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      product
    });
  } catch (error) {
    console.error("DELETE image error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
