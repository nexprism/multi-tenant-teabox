import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import OrderController from "../../../lib/controllers/orderController.js";
import OrderService from "../../../lib/services/orderService.js";
import OrderRepository from "../../../lib/repository/OrderRepository.js";
import CouponService from "../../../lib/services/CouponService.js";
import CouponRepository from "../../../lib/repository/CouponRepository.js";
import EmailService from "../../../lib/services/EmailService.js";
import WhatsappService from "../../../lib/services/WhatsappService.js";
import { OrderSchema } from "../../../lib/models/Order.js";
import { CouponSchema } from "../../../lib/models/Coupon.js";
import { ProductSchema } from "../../../lib/models/Product.js";
import { VariantSchema } from "../../../lib/models/Variant.js";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";
import { getUserById, withUserAuth } from "../../../middleware/commonAuth.js";
import userSchema from "@/app/lib/models/User.js";
import { generateInvoiceHtml } from "../../../lib/utils/invoiceGenerator.js";
import UserService from "@/app/lib/services/userService.js";

export async function POST(req) {
  try {
    const tenant = req.headers.get("x-tenant");
    const body = await req.json();
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const Coupon = conn.models.Coupon || conn.model("Coupon", CouponSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
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
    const result = await orderController.create({ body }, conn, tenant);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Send WhatsApp notification after order placed
    const whatsappService = new WhatsappService();
    const userService = new UserService(conn);
    const user = await userService.getUserById(
      result.data.order.user.toString()
    );
    result.data.userName = user?.name || "Customer";

    const payload = {
      phone: user.phone || user.phoneNumber || "",
      name: user.name || user.fullName || result.data.userName || "Customer",
      email: user.email || "",
      extraFields: {
        orderId: result.data.order._id.toString(),
        orderTotal: result.data.order.total.toString(),
        status: result.data.order.status,
      },
    };

    const orderItems = result.data.order.items || [];
    const productPromises = orderItems.map(async (item) => {
      if (item.product) {
        return Product.findById(item.product).lean().exec();
      }
      return null;
    });
    const products = await Promise.all(productPromises);

    products.forEach((product, index) => {
      const item = orderItems[index];
      payload.extraFields[`productName${index + 1}`] = product?.name || item?.product || "";
    });

    const response = await whatsappService.sendWebhookRequest({ ...payload });
    if (!response.success) {
      result.whatsappError = response.error;
    }

    // Generate invoice HTML file using the centralized generator
    try {
      const order = result.data.order || {};
      const invoiceId = order._id ? order._id.toString() : `order-${Date.now()}`;
      const origin = new URL(req.url).origin;
      const invoicesDir = path.join(process.cwd(), "public", "uploads", "invoices");
      await fs.mkdir(invoicesDir, { recursive: true });

      // Ensure product names are available for the invoice
      // Convert order document to a plain object to allow adding non-schema fields like 'name'
      const invoiceOrder = order.toObject ? order.toObject() : JSON.parse(JSON.stringify(order));

      if (invoiceOrder.items && Array.isArray(invoiceOrder.items)) {
        invoiceOrder.items.forEach((item, index) => {
          const product = products[index];
          if (product && product.name) {
            item.name = product.name;
          }
        });
      }

      const invoiceHtml = generateInvoiceHtml(invoiceOrder, origin);
      const filePath = path.join(invoicesDir, `${invoiceId}.html`);
      await fs.writeFile(filePath, invoiceHtml, "utf8");

      const invoiceUrl = `/uploads/invoices/${invoiceId}.html`;
      result.data.invoiceUrl = invoiceUrl;

      // Persist invoice URL to the Order document
      try {
        const idStr = order._id ? order._id.toString() : null;
        if (idStr) {
          await Order.findByIdAndUpdate(idStr, { $set: { invoiceUrl } }).exec();
          order.invoiceUrl = invoiceUrl;
        }
      } catch (dbErr) {
        console.error("Failed to save invoiceUrl to Order document:", dbErr);
        result.invoiceSaveError = dbErr.message;
      }
    } catch (err) {
      console.error("Failed to generate invoice file:", err);
      result.invoiceError = err.message;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.log("Route POST order error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
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
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const Coupon = conn.models.Coupon || conn.model("Coupon", CouponSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
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
    const result = await orderController.getUserOrders(request, conn);

    // Attach invoiceUrl for each order if invoice file exists
    try {
      const invoicesDir = path.join(process.cwd(), "public", "uploads", "invoices");
      const attachUrl = async (ord) => {
        if (!ord) return ord;
        const id = ord._id ? (typeof ord._id === "string" ? ord._id : ord._id.toString()) : null;
        if (!id) return ord;
        const filePath = path.join(invoicesDir, `${id}.html`);
        try {
          await fs.access(filePath);
          ord.invoiceUrl = `/uploads/invoices/${id}.html`;
        } catch (e) {
          // file doesn't exist — skip
        }
        return ord;
      };

      if (Array.isArray(result.data)) {
        await Promise.all(result.data.map((o) => attachUrl(o)));
      } else if (result.data && Array.isArray(result.data.results)) {
        await Promise.all(result.data.results.map((o) => attachUrl(o)));
      } else if (result.data && Array.isArray(result.data.orders)) {
        await Promise.all(result.data.orders.map((o) => attachUrl(o)));
      } else if (result.data && typeof result.data === 'object' && result.data._id) {
        await attachUrl(result.data);
      }
    } catch (e) {
      console.error('Error attaching invoice URLs', e);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
});
