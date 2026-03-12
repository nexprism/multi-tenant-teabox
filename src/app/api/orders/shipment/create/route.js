import { NextResponse } from "next/server";
import mongoose from "mongoose";

import OrderRepository from "@/app/lib/repository/OrderRepository.js";
import CouponService from "@/app/lib/services/CouponService.js";
import CouponRepository from "@/app/lib/repository/CouponRepository.js";
import EmailService from "@/app/lib/services/EmailService.js";
import OrderService from "@/app/lib/services/orderService.js";

import { OrderSchema } from "@/app/lib/models/Order.js";
import { CouponSchema } from "@/app/lib/models/Coupon.js";
import { ProductSchema } from "@/app/lib/models/Product.js";
import { VariantSchema } from "@/app/lib/models/Variant.js";

import { getSubdomain, getDbConnection } from "@/app/lib/tenantDb.js";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("=================================");
    console.log("[Shipment Create] Incoming Body:", body);
    console.log("DELHIVERY TOKEN:", process.env.DELHIVERY_API_TOKEN);
    console.log("=================================");

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json(
        { success: false, message: "Database not found" },
        { status: 404 }
      );
    }

    // Register Models
    const Order =
      conn.models.Order || conn.model("Order", OrderSchema);

    const Coupon =
      conn.models.Coupon || conn.model("Coupon", CouponSchema);

    const Product =
      conn.models.Product || conn.model("Product", ProductSchema);

    const Variant =
      conn.models.Variant || conn.model("Variant", VariantSchema);

    const orderRepo = new OrderRepository(Order, conn);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const emailService = new EmailService();

    const orderService = new OrderService(
      orderRepo,
      couponService,
      emailService
    );

    // ===============================
    // 1️⃣ FETCH ORDER
    // ===============================
    const order = await orderRepo.findById(body.orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    console.log("Order Found:", order._id);

    // ===============================
    // 2️⃣ CREATE SHIPMENT
    // ===============================
    const result = await orderService.createShipment(
      order,
      body.courier,
      body.serviceCode
    );

    console.log("Shipment Result:", result);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.log("Error in Shipment Creation:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
