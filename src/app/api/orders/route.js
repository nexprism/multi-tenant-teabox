import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb";
import OrderController from "../../lib/controllers/orderController.js";
import OrderService from "../../lib/services/orderService.js";
import OrderRepository from "../../lib/repository/OrderRepository.js";
import CouponService from "../../lib/services/CouponService.js";
import CouponRepository from "../../lib/repository/CouponRepository.js";
import { OrderSchema } from "../../lib/models/Order.js";
import { CouponSchema } from "../../lib/models/Coupon.js";
import { ProductSchema } from "../../lib/models/Product.js";
import { VariantSchema } from "../../lib/models/Variant.js";

// GET /api/orders - Get all orders
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

    // Initialize models
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const Coupon = conn.models.Coupon || conn.model("Coupon", CouponSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);

    // Initialize repositories and services
    const orderRepo = new OrderRepository(Order, conn);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const orderService = new OrderService(orderRepo, couponService);
    const orderController = new OrderController(orderService);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortByRaw = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") || "desc";
    //bookedParam
    const bookedParam = searchParams.get("isShipmentBooked");

    let sortBy = { createdAt: -1 };
    if (sortByRaw) {
      try {
        sortBy = JSON.parse(sortByRaw);
      } catch (e) {
        // fallback to default
      }
    }

    // Pass all filters and options to controller
    const result = await orderController.getAllOrders(
      request,
      conn,
      { status, page, limit, sortBy, sortOrder, bookedParam }
    );

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.log("Error in GET /api/orders:", error?.message);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}
