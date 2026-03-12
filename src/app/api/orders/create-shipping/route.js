import { NextResponse } from "next/server";
import OrderController from "@/app/lib/controllers/orderController";
import CouponRepository from "@/app/lib/repository/CouponRepository";
import OrderRepository from "@/app/lib/repository/OrderRepository";
import CouponService from "@/app/lib/services/CouponService";
import EmailService from "@/app/lib/services/EmailService";
import OrderService from "@/app/lib/services/orderService";
import DTDCShippingService from "@/app/lib/services/DTDCShippingService";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb";
import { OrderSchema } from "@/app/lib/models/Order";
import { CouponSchema } from "@/app/lib/models/Coupon";
import { ProductSchema } from "@/app/lib/models/Product";
import { VariantSchema } from "@/app/lib/models/Variant";

export async function POST(req) {
  try {
    const tenant = req.headers.get("x-tenant");
    const body = await req.json();
    //console.log(
    //   "Route received create order body:",
    //   JSON.stringify(body, null, 2)
    // );

    // Check if this is a DTDC shipping request
    if (body.method === "DTDC" || body.shipping_method === "DTDC") {
      return await handleDTDCShipping(req, body, tenant);
    }

    // Default behavior for other methods
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
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const Coupon = conn.models.Coupon || conn.model("Coupon", CouponSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
    //console.log("Models registered:", {
    //   Order: Order.modelName,
    //   Coupon: Coupon.modelName,
    //   Product: Product.modelName,
    //   Variant: Variant.modelName,
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
    const result = await orderController.serviceList({ body }, conn, tenant);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    //console.error("Route POST order error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

async function handleDTDCShipping(req, body, tenant) {
  try {
    //console.log("Handling DTDC shipping request");

    // Validate required fields for DTDC shipping
    const { orderId, service_type_id, dimensions, weight } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "orderId is required for shipping creation",
        },
        { status: 400 }
      );
    }

    if (!service_type_id) {
      return NextResponse.json(
        {
          success: false,
          message: "service_type_id is required for DTDC shipping",
        },
        { status: 400 }
      );
    }

    if (
      !dimensions ||
      !dimensions.length ||
      !dimensions.width ||
      !dimensions.height
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "dimensions (length, width, height) are required for DTDC shipping",
        },
        { status: 400 }
      );
    }

    if (!weight) {
      return NextResponse.json(
        { success: false, message: "weight is required for DTDC shipping" },
        { status: 400 }
      );
    }

    // Get database connection
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "Database connection not found" },
        { status: 404 }
      );
    }

    // Get Order model and fetch order data
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const orderData = await Order.findById(orderId).populate(
      "items.product items.variant"
    );

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    //console.log("Order found for DTDC shipping:", orderData._id);

    // Initialize DTDC shipping service
    const dtdcService = new DTDCShippingService();

    // Create shipping with DTDC
    const shippingResult = await dtdcService.createShipping(orderData, {
      service_type_id,
      dimensions,
      weight,
      declared_value: body.declared_value,
    });

    //console.log("DTDC shipping created successfully:", shippingResult);

    return NextResponse.json(shippingResult, { status: 201 });
  } catch (error) {
    //console.error("DTDC shipping error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: `DTDC shipping failed: ${error.message}`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
