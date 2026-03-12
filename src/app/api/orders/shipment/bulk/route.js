import { NextResponse } from "next/server";
import mongoose from "mongoose";
import OrderController from "@/app/lib/controllers/orderController.js";
import OrderRepository from "@/app/lib/repository/OrderRepository.js";
import CouponService from "@/app/lib/services/CouponService.js";
import CouponRepository from "@/app/lib/repository/CouponRepository.js";
import EmailService from "@/app/lib/services/EmailService.js";
import { OrderSchema } from "@/app/lib/models/Order.js";
import { CouponSchema } from "@/app/lib/models/Coupon.js";
import { ProductSchema } from "@/app/lib/models/Product.js";
import { getSubdomain, getDbConnection } from "@/app/lib/tenantDb.js";
import { VariantSchema } from "@/app/lib/models/Variant.js";
import OrderService from "@/app/lib/services/orderService.js";

export async function GET(req) {
    try {
        const tenant = req.headers.get("x-tenant");

        // //consolle.log('Route received create order body:', JSON.stringify(body, null, 2));
        const subdomain = getSubdomain(req);
        // //consolle.log('Subdomain:', subdomain);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            //consolle.error("No database connection established");
            return NextResponse.json({ success: false, message: "DB not found" }, { status: 404 });
        }
        //consolle.log("Connection name in route:", conn.name);
        const Order = conn.models.Order || conn.model("Order", OrderSchema);
        const Coupon = conn.models.Coupon || conn.model("Coupon", CouponSchema);
        const Product = conn.models.Product || conn.model("Product", ProductSchema);
        const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
        //consolle.log("Models registered:", {
        //     Order: Order.modelName,
        //     Coupon: Coupon.modelName,
        //     Product: Product.modelName,
        //     Variant: Variant.modelName,
        // });
        const orderRepo = new OrderRepository(Order, conn);
        const couponRepo = new CouponRepository(Coupon);
        const couponService = new CouponService(couponRepo);
        const emailService = new EmailService();
        const orderService = new OrderService(
            orderRepo,
            couponService,
            emailService
        );
        const orderController = new OrderController(orderService);
        // Trigger bulk shipment processing asynchronously to avoid request timeouts.
        // The controller/service will handle fetching orders when req.body is empty.
        orderController.createBulkShipment(req, conn, tenant)
            .then((res) => {
                // eslint-disable-next-line no-console
                console.log("Bulk shipment completed:", res && res.summary ? res.summary : res);
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error("Bulk shipment async error:", err && err.message ? err.message : err);
            });

        return NextResponse.json({ success: true, message: "Processing started" }, { status: 202 });
    } catch (error) {
        //consolle.error("Route POST order error:", error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}