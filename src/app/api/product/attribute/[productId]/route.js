import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../../lib/tenantDb.js";
import ProductRepository from "../../../../lib/repository/productRepository.js";
import ProductService from "../../../../lib/services/productService.js";
import { getByProductId } from "../../../../lib/controllers/attributeController.js";   
import ProductModel from "../../../../lib/models/Product.js";

// GET /api/product/attribute/:productId
export async function GET(req, context) {
  try {
    const params = context?.params;
    let product_id = params?.productId;
    if (!product_id) {
      try {
        const url = new URL(req.url);
        const parts = url.pathname.split("/").filter(Boolean);
        product_id = parts[parts.length - 1];
      } catch (e) {
        product_id = undefined;
      }
    }
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);
    const productRepo = new ProductRepository(Product);
    const productService = new ProductService(productRepo);
    const response = await getByProductId(product_id, conn);
    return NextResponse.json(response.body, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


