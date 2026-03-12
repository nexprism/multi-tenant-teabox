import { NextResponse } from "next/server";

import { OrderSchema } from "@/app/lib/models/Order.js";
import { ShippingValidation } from "@/app/lib/validation/shippingValidation.js";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb.js";
import { BlueDartShippingService } from "@/app/lib/services/shippingProviderService";
import DTDCShippingService from "@/app/lib/services/DTDCShippingService";

export async function POST(req) {
  try {
    const tenant = req.headers.get("x-tenant");
    const body = await req.json();

    console.log("[shipping][create] incoming request", {
      tenant,
      orderId: body?.orderId,
      shipping_method: body?.shipping_method,
    });

    //consolle.log(
    //   "Shipping creation request body:",
    //   JSON.stringify(body, null, 2)
    // );

    // Validate request body
    const validation = ShippingValidation.validateCreateShippingRequest(body);
    if (!validation.isValid) {
      console.log("[shipping][create] request validation failed", validation.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    let subdomain;
    let conn;
    try {
      subdomain = getSubdomain(req);
      console.log("[shipping][create] subdomain:", subdomain);

      conn = await getDbConnection(subdomain);
      if (!conn) {
        console.error("[shipping][create] No database connection for subdomain:", subdomain);
        return NextResponse.json(
          { success: false, message: "DB not found" },
          { status: 404 }
        );
      }
    } catch (err) {
      console.error("[shipping][create] error getting DB connection", err?.stack || err);
      return NextResponse.json(
        { success: false, message: "Internal error while connecting to DB" },
        { status: 500 }
      );
    }

    // Get Order model and fetch order details
    const orderSchema = OrderSchema;
    const Order = conn.models.Order || conn.model("Order", orderSchema);

    let order;
    try {
      console.log("[shipping][create] fetching order", { orderId: body.orderId });
      order = await Order.findById(body.orderId).populate("items");
      if (!order) {
        console.warn("[shipping][create] Order not found", { orderId: body.orderId });
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }
    } catch (err) {
      console.error("[shipping][create] error fetching order", err?.stack || err);
      return NextResponse.json(
        { success: false, message: "Internal error while fetching order" },
        { status: 500 }
      );
    }

    // Validate order data
    const orderValidation = ShippingValidation.validateOrderData(order);
    if (!orderValidation.isValid) {
      console.log("[shipping][create] order validation failed", orderValidation.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Order validation failed",
          errors: orderValidation.errors,
        },
        { status: 400 }
      );
    }

    let shippingResult;
    const shippingMethod = (body.shipping_method || "").toLowerCase();

    console.log("[shipping][create] preparing to call provider", {
      shippingMethod,
      itemsCount: Array.isArray(order.items) ? order.items.length : 0,
    });

    switch (shippingMethod) {
      case "dtdc":
        // Validate DTDC environment configuration
        const envValidation = ShippingValidation.validateEnvironmentConfig();
        if (!envValidation.isValid) {
          return NextResponse.json(
            {
              success: false,
              message: "DTDC configuration error",
              errors: envValidation.errors,
            },
            { status: 500 }
          );
        }

        const dtdcService = new DTDCShippingService();
        console.log("[shipping][create] calling DTDC createShipment");
        try {
          const providerStart = Date.now();
          shippingResult = await dtdcService.createShipment(
          {
            order_id: order._id.toString(),
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            items: order.items,
          },
          {
            service_type_id: body.service_type_id || "B2C PRIORITY",
            dimensions: body.dimensions,
            weight: body.weight,
          }
          );
          console.log("[shipping][create] DTDC response summary", {
            success: !!shippingResult?.success,
            trackingNumber: shippingResult?.trackingNumber,
            durationMs: Date.now() - providerStart,
          });
        } catch (err) {
          console.error("[shipping][create] DTDC provider threw", err?.stack || err);
          shippingResult = { success: false, error: err?.message || String(err), data: null };
        }
        break;

      case "bluedart":
      case "blue dart":
        const blueDartService = new BlueDartShippingService();
        console.log("[shipping][create] calling BlueDart createShipment");
        try {
          const providerStart = Date.now();
          shippingResult = await blueDartService.createShipment(
          {
            order_id: order._id.toString(),
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            items: order.items,
          },
          {
            service_type_id: body.service_type_id,
            dimensions: body.dimensions,
            weight: body.weight,
          }
          );
          console.log("[shipping][create] BlueDart response summary", {
            success: !!shippingResult?.success,
            trackingNumber: shippingResult?.trackingNumber,
            durationMs: Date.now() - providerStart,
          });
        } catch (err) {
          console.error("[shipping][create] BlueDart provider threw", err?.stack || err);
          shippingResult = { success: false, error: err?.message || String(err), data: null };
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: `Shipping method '${body.shipping_method}' is not supported. Supported methods: DTDC, Blue Dart`,
          },
          { status: 400 }
        );
    }

    if (!shippingResult.success) {
      console.error("[shipping][create] provider error", shippingResult.error || shippingResult);
      return NextResponse.json(
        {
          success: false,
          message: shippingResult.error || "Failed to create shipping",
        },
        { status: 400 }
      );
    }

    // Update order with shipping information
    if (shippingResult.trackingNumber) {
      await Order.findByIdAndUpdate(body.orderId, {
        $set: {
          shipping_provider: body.shipping_method,
          tracking_number: shippingResult.trackingNumber,
          shipping_status: "shipped",
          shipped_at: new Date(),
        },
      });
    }

    console.log("[shipping][create] shipping success", {
      orderId: body.orderId,
      trackingNumber: shippingResult.trackingNumber,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shipping created successfully",
        data: {
          orderId: body.orderId,
          shipping_method: body.shipping_method,
          tracking_number: shippingResult.trackingNumber,
          provider_response: shippingResult.data,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[shipping][create] unhandled error", error?.stack || error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
