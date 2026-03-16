// Shiprocket API integration helper
async function createShiprocketOrder(order, shippingAddress, items) {
  // 1. Authenticate
  const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
    email: process.env.SHIPROCKET_API_EMAIL,
    password: process.env.SHIPROCKET_API_PASSWORD
  });
  const token = authRes.data.token;

  // 2. Prepare payload
  const payload = {
    order_id: order._id.toString(),
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: "Default", // Change if you use a different pickup name
    billing_customer_name: shippingAddress.fullName,
    billing_address: shippingAddress.addressLine1,
    billing_city: shippingAddress.city,
    billing_pincode: shippingAddress.postalCode,
    billing_state: shippingAddress.state,
    billing_country: shippingAddress.country,
    billing_email: shippingAddress.email || order.shippingAddress?.email || "test@example.com",
    billing_phone: shippingAddress.phoneNumber,
    order_items: items.map(item => ({
      name: item.name || "Product",
      sku: item.sku || "SKU",
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0
    })),
    payment_method: order.paymentMode === "COD" ? "COD" : "Prepaid",
    sub_total: order.total,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 1
  };

  // 3. Create order in Shiprocket
  const res = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
import mongoose from "mongoose";
import { OrderSchema } from "../models/Order.js";
import OrderRepository from "../repository/OrderRepository";
import CouponService from "./CouponService";
import EmailService from "./EmailService";
import { SettingSchema } from "../models/Setting";
import axios from "axios";
import https from "https"; // if using ES modules
import { ShippingSchema } from "../models/Shipping.js";
import WhatsappService from "../../lib/services/WhatsappService.js";
import UserService from "@/app/lib/services/userService.js";

import path from "path";
import fs from "fs";
import { current } from "@reduxjs/toolkit";
import { ProductSchema } from "../models/Product.js";
import * as xlsx from "xlsx"; // Fixed import for ESM
import multer from "multer"; // Already in dependencies

// Normalize Delhivery token env vars: prefer `DELHIVERY_API_TOKEN`, fallback to `DELHIVERY_TOKEN`.
// Trim whitespace and set both names to the same value to avoid mismatches across the codebase.
// If running in development and no env token is present, use a dev-only static token to aid debugging.
const DEV_STATIC_DELHIVERY_TOKEN = "5e7e9b8bfc46279733d74e9717a90b3842394771"; // dev-only
let _delhiveryToken = process.env.DELHIVERY_API_TOKEN?.trim() || process.env.DELHIVERY_TOKEN?.trim() || null;
if (!_delhiveryToken && process.env.NODE_ENV === "development") {
  _delhiveryToken = DEV_STATIC_DELHIVERY_TOKEN;
}
if (_delhiveryToken) {
  process.env.DELHIVERY_API_TOKEN = _delhiveryToken;
  process.env.DELHIVERY_TOKEN = _delhiveryToken;
}

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

class OrderService {
  constructor(orderRepository, couponService, emailService) {
    this.orderRepository = orderRepository;
    this.couponService = couponService;
    this.emailService = emailService || new EmailService();
  }

  async getTotalOrders(conn) {
    try {
      const Order = conn.models.Order || conn.model("Order", OrderSchema);
      return await Order.countDocuments().exec();
    } catch (error) {
      throw new Error(`Failed to fetch total orders: ${error.message}`);
    }
  }

  //checkOrder
  async checkOrder(data, conn, tenant) {
    try {
      const {
        userId,
        items,
        couponCode,
        shippingAddress,
        billingAddress,
        deliveryOption,
        paymentMode, // "COD" or "Prepaid"
      } = data;

      // Validate required fields (no paymentId needed here)
      if (
        !userId ||
        !items ||
        !items.length ||
        !shippingAddress ||
        !billingAddress ||
        !deliveryOption ||
        !paymentMode
      ) {
        return {
          success: false,
          message: "All required fields must be provided",
          data: null,
        };
      }

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          message: `Invalid userId: ${userId}`,
          data: null,
        };
      }

      // Validate delivery option
      const validDeliveryOptions = [
        "standard_delivery",
        "express_delivery",
        "overnight_delivery",
      ];
      if (!validDeliveryOptions.includes(deliveryOption)) {
        return {
          success: false,
          message: "Invalid delivery option",
          data: null,
        };
      }

      // Validate items
      for (const item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
          return {
            success: false,
            message:
              "Each item must have a valid product and positive quantity",
            data: null,
          };
        }
        if (
          item.variantId &&
          !mongoose.Types.ObjectId.isValid(item.variantId)
        ) {
          return {
            success: false,
            message: `Invalid variantId: ${item.variantId}`,
            data: null,
          };
        }
      }

      // --- Postal code shipping method selection ---
      // const ShippingZone =
      //   conn.models.ShippingZone ||
      //   conn.model(
      //     "ShippingZone",
      //     require("../models/ShippingZone.js").shippingZoneSchema
      //   );
      // const Shipping =
      //   conn.models.Shipping ||
      //   conn.model("Shipping", require("../models/Shipping.js").shippingSchema);

      // const userPostalCode = shippingAddress?.postalCode?.toString().trim();
      // if (!userPostalCode) {
      //   return {
      //     success: false,
      //     message: "Postal code is required in shipping address",
      //     data: null,
      //   };
      // }

      // // Find all shipping zones containing this postal code
      // const zones = await ShippingZone.find({
      //   "postalCodes.code": userPostalCode,
      // }).lean();
      // if (!zones || zones.length === 0) {
      //   return {
      //     success: false,
      //     message: "Delivery not available for this postal code",
      //     data: null,
      //   };
      // }

      // // Get all shippingIds from zones
      // const shippingIds = zones.map((z) => z.shippingId);

      // // Fetch all shipping methods for these IDs and sort by priority DESC
      // const shippingMethods = await Shipping.find({
      //   _id: { $in: shippingIds },
      //   status: "active",
      // })
      //   .sort({ priority: -1 })
      //   .lean();
      // if (!shippingMethods || shippingMethods.length === 0) {
      //   return {
      //     success: false,
      //     message: "No active shipping method found for this postal code",
      //     data: null,
      //   };
      // }

      // // Pick the highest priority shipping method
      // const selectedShipping = shippingMethods[0];
      const selectedShipping = { shippingMethod: "Standard", _id: null, name: "Standard Delivery", priority: 1 };

      // Fetch settings

      //consolle.log("check tenant for setting ==> " , tenant)
      const Setting =
        conn.models.Setting || conn.model("Setting", SettingSchema);
      const settings = await Setting.findOne({ tenant }).lean();

      // Calculate subtotal - use the total from frontend if provided, otherwise calculate
      let subtotal = 0;
      if (data.total) {
        subtotal = data.total;
      } else {
        for (const item of items) {
          const { product, variant, quantity, price } = item;
          let itemPrice = price || 0;
          if (!itemPrice) {
            if (variant) {
              const newVariant = await this.orderRepository.findVariantById(
                variant
              );
              itemPrice = newVariant.price;
            } else {
              const newProduct = await this.orderRepository.findProductById(
                product
              );
              itemPrice = newProduct.price;
            }
          }
          subtotal += itemPrice * quantity;
        }
      }

      // Apply coupon if provided
      let discount = 0;
      if (couponCode) {
        const couponResult = await this.couponService.applyCoupon(
          { code: couponCode, cartValue: subtotal },
          conn
        );
        if (!couponResult.success) {
          return {
            success: false,
            message: couponResult.message,
            data: null,
          };
        }
        discount = couponResult.data.discount;
      }

      // Apply prepaid discount if applicable
      let prepaidDiscount = 0;
      if (paymentMode !== "COD" && settings?.prepaidDiscountEnabled) {
        if (settings?.prepaidDiscountType === 'percentage') {
          prepaidDiscount = (subtotal * (settings?.prepaidDiscountValue || 0)) / 100;
        } else if (settings?.prepaidDiscountType === 'amount') {
          prepaidDiscount = settings?.prepaidDiscountValue || 0;
        }
      }

      // Calculate order total after discount
      const order_total = subtotal - discount - prepaidDiscount;

      // --- COD Order Limit ---
      if (paymentMode === "COD" && order_total > (settings?.codLimit ?? 1500)) {
        return {
          success: false,
          message: "COD not available for orders above ₹1500",
          data: null,
        };
      }

      // --- Repeat COD Restriction (per product, within 10 days) ---
      if (paymentMode === "COD" && settings?.repeatOrderRestrictionDays) {
        const Order = conn.models.Order || conn.model("Order", OrderSchema);
        for (const item of items) {
          const lastOrder = await Order.findOne({
            user: userId,
            paymentMode: "COD",
            "items.product": item.product,
          })
            .sort({ createdAt: -1 })
            .lean();
          if (lastOrder && lastOrder.createdAt) {
            const lastDate = new Date(lastOrder.createdAt);
            const now = new Date();
            const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
            if (diffDays < (settings?.repeatOrderRestrictionDays ?? 10)) {
              return {
                success: false,
                message:
                  "COD not allowed for this product (ordered within last 10 days)",
                data: null,
              };
            }
          }
        }
      }

      //consolle.log("settings ===> " , settings)

      // --- Shipping Charges ---
      let shippingCharge = 0;
      const freeShippingThreshold = settings?.freeShippingThreshold ?? 500;
      if (order_total >= freeShippingThreshold) {
        shippingCharge = 0;
      } else if (order_total < freeShippingThreshold) {
        if (paymentMode === "COD") {
          shippingCharge = settings?.codShippingChargeBelowThreshold ?? 80;
        } else {
          shippingCharge = settings?.prepaidShippingChargeBelowThreshold ?? 40;
        }
      }

      // --- GST & Payment Gateway Charges ---
      const gstRate = settings?.gstCharge || 0;
      const pgRate = settings?.paymentGatewayCharge || 0;

      const taxableAmount = Math.max(0, order_total);
      const gstAmount = (taxableAmount * gstRate) / 100;

      let paymentGatewayAmount = 0;
      if (paymentMode !== "COD") {
        paymentGatewayAmount =
          ((taxableAmount + shippingCharge + gstAmount) * pgRate) / 100;
      }

      // If all checks pass, return success and calculated charges
      return {
        success: true,
        message: "Order is valid",
        data: {
          order_total,
          shippingCharge,
          discount,
          prepaidDiscount,
          gstAmount,
          paymentGatewayAmount,
          gstRate,
          paymentGatewayRate: pgRate,
          shippingMethod: selectedShipping.shippingMethod,
          shippingId: selectedShipping._id,
          shippingName: selectedShipping.name,
          shippingPriority: selectedShipping.priority,
        },
      };
    } catch (error) {
      //consolle.log("error in check api ", error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }


  //createBulkShipment
  async createBulkShipment(data, conn, tenant)
   {
  
    try {
      //check if data is an array its not complsury to send data if user want to book shipment for all pending orders
      if(data && !Array.isArray(data)) {
        data = [data];
      }

      const results = [];

      //if data is emty then fetch all pending orders and create shipment for them
      if (!data || data.length === 0) {
        const Order = conn.models.Order || conn.model("Order", OrderSchema);
        //also check shipping_details.reference_number is null to avoid trying to book shipment for already booked orders
        data = await Order.find({
          $and: [
            {
              $or: [
          { isShipmentBooked: { $exists: false } },
          { isShipmentBooked: false },
              ],
            },
            { status: { $in: ["pending", "confirmed"] } },
            {
              $or: [
          { "shipping_details.reference_number": { $exists: false } },
          { "shipping_details.reference_number": null },
          { "shipping_details.reference_number": "" },
              ],
            },
          ],
        }).lean();
      }

      console.log(`Total orders to process for shipment booking: ${data.length}`);
        let summary = {
          total: 0,
          booked: 0,
          failed: 0,
          skipped: 0,
          details: [],
        };
        summary.total = data.length;


        // Process orders in limited-concurrency batches to avoid long-running request timeouts.
        const CONCURRENCY = parseInt(process.env.BULK_SHIPMENT_CONCURRENCY, 10) || 5;
        for (let i = 0; i < data.length; i += CONCURRENCY) {
          const chunk = data.slice(i, i + CONCURRENCY);
          const promises = chunk.map((order) => (async () => {
            try {
              // eslint-disable-next-line no-console
              console.log(`Processing Order: ${order._id}`);
              const bookingResult = await this.autoBookSingleOrder(order, conn, tenant);
              return { order, bookingResult, error: null };
            } catch (error) {
              return { order, bookingResult: null, error };
            }
          })());

          const settled = await Promise.allSettled(promises);
          for (const r of settled) {
            if (r.status === 'fulfilled') {
              const { order, bookingResult, error } = r.value;
              if (error) {
                summary.failed++;
                summary.details.push({ orderId: order._id, status: 'ERROR', message: error.message || String(error) });
                continue;
              }
              if (bookingResult && bookingResult.success) {
                summary.booked++;
                summary.details.push({ orderId: order._id, status: 'BOOKED', carrier: bookingResult.carrier });
              } else {
                summary.failed++;
                summary.details.push({ orderId: order._id, status: 'FAILED' });
              }
            } else {
              // Unexpected rejection
              const maybe = r.reason || {};
              const oid = maybe.order && maybe.order._id ? maybe.order._id : null;
              summary.failed++;
              summary.details.push({ orderId: oid, status: 'ERROR', message: maybe.message || String(maybe) });
            }
          }
        }

        return {
          success: true,
          message: "Auto booking process completed",
          summary,
        };

      } catch (err) {
        console.log("Error in createBulkShipment:", err.message);
      return {
        success: false,
        message: err.message,
        data: null,
      };
    }
     
  }


  async autoBookSingleOrder(order, conn, tenant) {
    // Shipping flow disabled as per user request
    return { success: true, message: "Auto-booking disabled" };
  }

  async createOrder(data, conn, tenant) {
    try {
      console.log("[OrderService] createOrder called", { userId: data?.userId, paymentMode: data?.paymentMode, itemsCount: data?.items?.length });
      const {
        userId,
        items,
        couponCode,
        shippingAddress,
        billingAddress,
        paymentId,
        deliveryOption,
        paymentMode, // must be passed in data: "COD" or "Prepaid"
      } = data;
      // Validate required fields
      if (
        !userId ||
        !items ||
        !items.length ||
        !shippingAddress ||
        !billingAddress ||
        !deliveryOption ||
        !paymentMode
      ) {
        throw new Error("All required fields must be provided");
      }
      // Only require paymentId for Prepaid
      if (paymentMode !== "COD" && !paymentId) {
        throw new Error("paymentId is required for prepaid orders");
      }

      // If COD, generate a random paymentId
      let finalPaymentId = paymentId;
      if (paymentMode === "COD") {
        finalPaymentId =
          paymentId || "COD-" + Math.random().toString(36).substr(2, 12);
      }

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }

      // Fetch customer email from User model
      const User = conn.models.User || conn.model("User", UserSchema);
      const user = await User.findById(userId).select("email").exec();
      let customerEmail = null;
      if (user && user.email) {
        customerEmail = user.email;
      }

      // Validate delivery option
      const validDeliveryOptions = [
        "standard_delivery",
        "express_delivery",
        "overnight_delivery",
      ];
      if (!validDeliveryOptions.includes(deliveryOption)) {
        throw new Error("Invalid delivery option");
      }

      // Validate items
      for (const item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
          throw new Error(
            "Each item must have a valid product and positive quantity"
          );
        }
        if (
          item.variantId &&
          !mongoose.Types.ObjectId.isValid(item.variantId)
        ) {
          throw new Error(`Invalid variantId: ${item.variantId}`);
        }
      }

      // --- Postal code shipping method selection ---
      // const ShippingZone =
      //   conn.models.ShippingZone ||
      //   conn.model(
      //     "ShippingZone",
      //     require("../models/ShippingZone.js").shippingZoneSchema
      //   );
      // const Shipping =
      //   conn.models.Shipping ||
      //   conn.model("Shipping", require("../models/Shipping.js").shippingSchema);

      // const userPostalCode = shippingAddress?.postalCode?.toString().trim();
      // if (!userPostalCode) {
      //   throw new Error("Postal code is required in shipping address");
      // }

      // // Find all shipping zones containing this postal code
      // const zones = await ShippingZone.find({
      //   "postalCodes.code": userPostalCode,
      // }).lean();
      // if (!zones || zones.length === 0) {
      //   return {
      //     success: false,
      //     message: "Delivery not available for this postal code",
      //     data: null,
      //   };
      // }

      // // Get all shippingIds from zones
      // const shippingIds = zones.map((z) => z.shippingId);

      // // Fetch all shipping methods for these IDs and sort by priority DESC
      // const shippingMethods = await Shipping.find({
      //   _id: { $in: shippingIds },
      //   status: "active",
      // })
      //   .sort({ priority: -1 })
      //   .lean();
      // if (!shippingMethods || shippingMethods.length === 0) {
      //   return {
      //     success: false,
      //     message: "No active shipping method found for this postal code",
      //     data: null,
      //   };
      // }

      // // Pick the highest priority shipping method
      // const selectedShipping = shippingMethods[0];
      const selectedShipping = { shippingMethod: "Standard", _id: null, name: "Standard Delivery", priority: 1 };

      // Fetch settings

      const Setting =
        conn.models.Setting || conn.model("Setting", SettingSchema);
      const settings = await Setting.findOne({ tenant }).lean();

      // Calculate subtotal - use the total from frontend if provided, otherwise calculate
      let subtotal = 0;
      const orderItems = [];

      if (data.total) {
        subtotal = data.total;
        // Still create orderItems array for database storage
        for (const item of items) {
          const { product, variant, quantity, price } = item;
          
          // Fetch product/variant details to enrich item for Shiprocket
          if (variant) {
            const v = await this.orderRepository.findVariantById(variant);
            item.name = v.name;
            item.sku = v.sku;
          } else {
            const p = await this.orderRepository.findProductById(product);
            item.name = p.name;
            item.sku = p.sku;
          }

          orderItems.push({
            product: product,
            variant: variant || null,
            quantity,
            price: price || 0,
          });
        }
      } else {
        for (const item of items) {
          const { product, variant, quantity, price } = item;
          let itemPrice = price || 0;
          let itemName = "";
          let itemSku = "";

          if (variant) {
            const newVariant = await this.orderRepository.findVariantById(variant);
            itemPrice = itemPrice || newVariant.price;
            itemName = newVariant.name;
            itemSku = newVariant.sku;
          } else {
            const newProduct = await this.orderRepository.findProductById(product);
            itemPrice = itemPrice || newProduct.price;
            itemName = newProduct.name;
            itemSku = newProduct.sku;
          }

          item.price = itemPrice;
          item.name = itemName;
          item.sku = itemSku;

          orderItems.push({
            product: product,
            variant: variant || null,
            quantity,
            price: itemPrice,
          });
          subtotal += itemPrice * quantity;
        }
      }

      // Apply coupon if provided
      let discount = 0;
      let couponId = null;
      if (couponCode) {
        const couponResult = await this.couponService.applyCoupon(
          { code: couponCode, cartValue: subtotal },
          conn
        );
        if (!couponResult.success) {
          throw new Error(couponResult.message);
        }
        discount = couponResult.data.discount;
        couponId = couponResult.data.coupon._id;
      }

      // Apply prepaid discount if applicable
      let prepaidDiscount = 0;
      if (paymentMode !== "COD" && settings?.prepaidDiscountEnabled) {
        if (settings?.prepaidDiscountType === 'percentage') {
          prepaidDiscount = (subtotal * (settings?.prepaidDiscountValue || 0)) / 100;
        } else if (settings?.prepaidDiscountType === 'amount') {
          prepaidDiscount = settings?.prepaidDiscountValue || 0;
        }
      }

      // Calculate order total after discount
      const order_total = subtotal - discount - prepaidDiscount;

      // --- COD Order Limit ---
      if (paymentMode === "COD" && order_total > (settings?.codLimit ?? 1500)) {
        return {
          success: false,
          message: "COD not available for orders above ₹1500",
          data: null,
        };
      }

      // --- Repeat COD Restriction (per product, within 10 days) ---
      let codBlockedReason = null;
      if (paymentMode === "COD" && settings?.repeatOrderRestrictionDays) {
        const Order = conn.models.Order || conn.model("Order", OrderSchema);
        for (const item of items) {
          const lastOrder = await Order.findOne({
            user: userId,
            paymentMode: "COD",
            "items.product": item.product,
          })
            .sort({ createdAt: -1 })
            .lean();
          if (lastOrder && lastOrder.createdAt) {
            const lastDate = new Date(lastOrder.createdAt);
            const now = new Date();
            const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
            if (diffDays < (settings?.repeatOrderRestrictionDays ?? 10)) {
              codBlockedReason = `COD blocked for product ${item.product} (ordered within last ${settings?.repeatOrderRestrictionDays} days)`;
              return {
                success: false,
                message:
                  "COD not allowed for this product (ordered within last 10 days)",
                data: null,
              };
            }
          }
        }
      }

      // --- Shipping Charges ---
      let shippingCharge = 0;
      const freeShippingThreshold = settings?.freeShippingThreshold ?? 500;
      if (order_total >= freeShippingThreshold) {
        shippingCharge = 0;
      } else if (order_total < freeShippingThreshold) {
        if (paymentMode === "COD") {
          shippingCharge = settings?.codShippingChargeBelowThreshold ?? 80;
        } else {
          shippingCharge = settings?.prepaidShippingChargeBelowThreshold ?? 40;
        }
      }

      // --- GST & Payment Gateway Charges ---
      const gstRate = settings?.gstCharge || 0;
      const pgRate = settings?.paymentGatewayCharge || 0;

      const taxableAmount = Math.max(0, order_total);
      const gstAmount = (taxableAmount * gstRate) / 100;

      let paymentGatewayAmount = 0;
      if (paymentMode !== "COD") {
        paymentGatewayAmount =
          ((taxableAmount + shippingCharge + gstAmount) * pgRate) / 100;
      }

      // --- Create order ---
      const orderData = {
        user: userId,
        items: orderItems,
        total: order_total + shippingCharge + gstAmount,
        coupon: couponId,
        discount,
        prepaidDiscount,
        shippingAddress,
        billingAddress,
        paymentId: finalPaymentId,
        deliveryOption,
        status: "pending",
        shippingCharge,
        gstRate,
        paymentGatewayRate: pgRate,
        gstAmount,
        paymentGatewayAmount,
        paymentMode,
        codBlockedReason,
        // --- Save shipping method details ---
        shippingMethod: selectedShipping.shippingMethod,
        shippingId: selectedShipping._id,
        shippingName: selectedShipping.name,
        shippingPriority: selectedShipping.priority,
      };
      //consolle.log("data before repo ===> ", orderData);
      let order = await this.orderRepository.create(orderData);


      // --- Shiprocket API Integration ---
      try {
        console.log("[OrderService] About to call Shiprocket API integration block", { orderId: order._id });
        const shiprocketRes = await createShiprocketOrder(order, shippingAddress, items);
        console.log("Shiprocket API response:", shiprocketRes);
        // Save Shiprocket order ID and tracking info to your order
        const updateResult = await this.orderRepository.updateOrder(order._id, {
          "shipping_details.platform": "shiprocket",
          "shipping_details.reference_number": shiprocketRes.order_id?.toString(),
          "shipping_details.tracking_url": shiprocketRes.shipment_track_url || "",
          "shipping_details.raw_response": shiprocketRes,
          "isShipmentBooked": true
        });
        console.log("Order update result:", updateResult);
        // Fetch the updated order with Shiprocket info
        order = await this.orderRepository.model.findById(order._id).lean();
        console.log("Order after Shiprocket update:", order);
      } catch (err) {
        // Optionally log or handle Shiprocket API errors
        console.log("Shiprocket order creation failed:", err.message);
      }

      // Send email notifications
      const orderDate = new Date().toISOString().split("T")[0];
      const replacements = {
        app_name: "YourStore", // Replace with your app name
        order_id: order._id.toString(),
        order_url: `https://yourstore.com/orders/${order._id}`,
        owner_name: "Admin",
        order_date: orderDate,
      };

      // Send email to customer
      const customerEmailResult = await this.emailService.sendOrderEmail({
        templateName: "Order Created",
        to: customerEmail,
        replacements,
        conn,
      });
      if (!customerEmailResult.success) {
        //consolle.error(
        //   "Failed to send customer email:",
        //   customerEmailResult.message
        // );
      }

      // Send email to admin
      const adminEmailResult = await this.emailService.sendOrderEmail({
        templateName: "Order Created For Owner",
        to: "smaisuriya1206@gmail.com",
        replacements,
        conn,
      });
      if (!adminEmailResult.success) {
        //consolle.error("Failed to send admin email:", adminEmailResult.message);
      }


      //fetch shipping base on priority (we already have `shippingMethods` applicable to this postal code)
      // const ShippingModel =
      //   conn.models.Shipping ||
      //   conn.model("Shipping", require("../models/Shipping.js").shippingSchema);

      // // Attempt automatic shipment booking across available shipping methods (highest priority first)
      let bookingResult = null;

      // //fetch shipping method priority wise and status active
      // const activeShippingMethods = await ShippingModel.find({
      //   status: "active",
      // })
      //   .sort({ priority: 1 })
      //   .lean();

      //   // console.log("Active shipping methods to attempt booking:", activeShippingMethods);

      // try {
      //   const ShippingServiceModel =
      //     conn.models.ShippingService ||
      //     conn.model("ShippingService", require("../models/ShippingService.js").shippingServiceSchema);

      //   for (const sh of activeShippingMethods) {
      //     try {
      //       const carrier = (sh.carrier || sh.name || "").toString().toLowerCase();
      //       console.log(`Attempting shipment booking with carrier: ${carrier} (Shipping ID: ${sh._id})`);
      //       // 1) DTDC: existing flow (use default services + availability)
      //       if (carrier.includes("dtdc")) {
      //         // Get default services for this shipping sorted by servicePriority (ascending)
      //         const defaultServices = await ShippingServiceModel.find({
      //           shippingId: sh._id,
      //           status: "active",
      //           isDefaultService: true,
      //         })
      //           .sort({ servicePriority: 1 })
      //           .lean();

      //         // console.log(`Default DTDC services for shipping ${sh._id}:`, defaultServices);  
                
      //        // if (!defaultServices || defaultServices.length === 0) continue;

      //         // Call DTDC pincode availability / services API for this order
              
      //           // getDtdcServices expects an order shaped like: { data: { shippingAddress: { postalCode } } }
      //           const dtdcOrder = {
      //           data: order.toObject ? order.toObject() : order, // in case order is a Mongoose document, convert to plain object
      //           };
      //           const available = await this.getDtdcServices(dtdcOrder);
      //         // console.log(`DTDC services available for shipping ${sh._id}:`, available);
      //         const availableCodes = (available || []).map((a) => (a.code || a.name || "").toString());
      //         // console.log(`Available DTDC services for shipping ${sh._id}:`, availableCodes);

      //         // Match available services in order of priority and try creating shipment
      //         let shipped = false;
      //         for (const ds of defaultServices) {
      //           const code = (ds.serviceCode || ds.serviceName || "").toString();
      //           // console.log(`Trying DTDC service code ${code} for shipping ${sh._id}`);
      //           if (!code) continue;
      //           if (!availableCodes.includes(code)) continue;

      //           // Try to create shipment using existing createShipment function
      //           try {
      //             const resp = await this.createShipment(order, "DTDC", code);
      //             // console.log(`DTDC createShipment response for service code ${code} and shipping ${sh._id}:`, resp);
      //             if (resp && resp.success) {
      //               bookingResult = { shipping: sh, serviceCode: code, resp };
      //               shipped = true;
      //               //update isShipmentBooked to true in order
      //               await this.orderRepository.updateOrder(order._id, { isShipmentBooked: true });
      //               break;
      //             }
      //           } catch (err) {
      //             // try next default service
      //             console.log(`Failed to book DTDC with service code ${code} for shipping ${sh._id}:`, err.message);
      //             continue;
      //           }
      //         }
      //         // console.log(`DTDC booking result for shipping ${sh._id}:`, bookingResult);
      //         // console.log(`DTDC shipped status for shipping ${sh._id}:`, shipped);

      //         if (shipped) break; // stop trying further shippings
      //         continue; // go to next shipping method if DTDC attempts failed
      //       }

      //       // 1.b) Bluedart: don't fetch services from DB — call Bluedart API and try available services
      //       if (carrier.includes("bluedart")) {
      //         try {
      //           // Call Bluedart service availability function for this order
      //           const bluedartOrder = {
      //             data: order.toObject ? order.toObject() : order, // in case order is a Mongoose document, convert to plain object
      //           };
      //           const availableBD = await this.getBluedartServices(bluedartOrder);
      //           const availableCodesBD = (availableBD || []).map((a) => (a.code || a.name || "").toString());

      //           if (!availableCodesBD || !availableCodesBD.length) continue;

      //           // Try available Bluedart service codes in the order returned (priority order expected from API)
      //           let shippedBD = false;
      //           for (const code of availableCodesBD) {
      //             if (!code) continue;
      //             try {
      //               const resp = await this.createShipment(order, "BLUEDART", code);
      //               if (resp && resp.success) {
      //                 bookingResult = { shipping: sh, serviceCode: code, resp };
      //                 shippedBD = true;
      //                 //update isShipmentBooked to true in order
      //                 await this.orderRepository.updateOrder(order._id, { isShipmentBooked: true });
      //                 break;
      //               }
      //             } catch (err) {
      //               // try next available service
      //               continue;
      //             }
      //           }

      //           if (shippedBD) break; // stop trying further shippings
      //           continue;
      //         } catch (err) {
      //           // swallow bluedart errors and continue to next shipping
      //           continue;
      //         }
      //       }

      //       // 2) Delhivery (when shipping name or carrier contains "delivery")
      //       if (carrier.includes("delivery")) {
      //         try {
      //           const destinationPincode = order?.shippingAddress?.postalCode || shippingAddress?.postalCode;
      //           if (!destinationPincode) continue;

      //           const agent = new https.Agent({ rejectUnauthorized: false });
      //           const headers = { Authorization: `Token ${process.env.DELHIVERY_TOKEN}` };
      //           const pinApi = `${process.env.DELHIVERY_PIN_API_URL || 'https://track.delhivery.com/c/api/pin-codes/json/?filter_codes='}${encodeURIComponent(destinationPincode)}`;

      //           const pinResp = await axios.get(pinApi, { headers, httpsAgent: agent });
      //           const data = pinResp?.data || {};

      //           // Support multiple possible response shapes. Primary shape: data.delivery_codes[0].postal_code
      //           const postal = (data.delivery_codes && data.delivery_codes[0] && data.delivery_codes[0].postal_code) || (data.data && data.data[0]) || data.delivery_codes && data.delivery_codes[0] || null;
      //           if (!postal) continue;

      //           const isOda = (postal.is_oda || postal.oda || '').toString().toUpperCase() === 'Y';
      //           const codAvailable = (postal.cod || postal.cash || '').toString().toUpperCase() === 'Y';
      //           const prepaidAvailable = (postal.pre_paid || postal.prepaid || '').toString().toUpperCase() === 'Y';
      //           const pickupAvailable = (postal.pickup || '').toString().toUpperCase() === 'Y';

      //           // Skip if ODA
      //           if (isOda) continue;

      //           // Check payment-mode specific availability
      //           if (paymentMode === 'COD' && !codAvailable) continue;
      //           if (paymentMode !== 'COD' && !prepaidAvailable) continue;

      //           // At this point Delhivery reports the pin as serviceable for required payment mode
      //           // Call existing createShipment - pass the shipping object as the 3rd param (createDelhiveryShipment expects shipping info)
      //           try {
      //             const resp = await this.createShipment(order, "DELHIVERY", sh);
      //             if (resp && resp.success) {
      //               bookingResult = { shipping: sh, serviceCode: null, resp };

      //               //update isShipmentBooked to true in order
      //               await this.orderRepository.updateOrder(order._id, { isShipmentBooked: true });
      //               break; // stop trying further shippings
      //             }
      //           } catch (err) {
      //             // failed to book with this shipping, continue to next shipping
      //             continue;
      //           }
      //         } catch (err) {
      //           // if pin API or parsing fails for this shipping, skip to next
      //           continue;
      //         }
      //       }

      //       // otherwise, unsupported carrier for auto-booking in this flow
      //     } catch (err) {
      //       console.log(`Error processing shipping method ${sh._id} (${sh.name}):`, err.message);
      //       // swallow per-shipping errors and continue to next shipping method
      //       continue;
      //     }
      //   }
      // } catch (err) {
      //   // if anything here fails, we continue silently and return success without booking
      // }






      // try {
      //   // Only trigger auto-call for COD orders if enabled in settings
      //   //consolle.log("Triggering auto-call for COD order", settings);
      //   if (settings?.orderConfirmEnabled) {
      //     const apiUrl = "https://obd-api.myoperator.co/obd-api-v1";
      //     const payload = {
      //       company_id: settings?.myOperatorCompanyId || "683aebae503f2118",
      //       secret_token:
      //         settings?.myOperatorSecretToken ||
      //         "2a67cfdb278391cf9ae47a7fffd6b0ec8d93494ff0004051c0f328a501553c98",
      //       type: "2",
      //       number: "+91" + shippingAddress.phoneNumber, // fallback to shipping phone if user phone not present
      //       public_ivr_id: settings?.myOperatorIvrId || "68b0383927f53564",
      //     };
      //     //consolle.log("User phone number:", user);
      //     //consolle.log("Shipping address phone number:", shippingAddress);
      //     //consolle.log("Auto-call payload:", payload);
      //     // Use fetch or axios for HTTP request
      //     const res = await fetch(apiUrl, {
      //       method: "POST",
      //       headers: {
      //         "x-api-key":
      //           settings?.myOperatorApiKey ||
      //           "oomfKA3I2K6TCJYistHyb7sDf0l0F6c8AZro5DJh",
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify(payload),
      //     });

      //     const result = await res.json();
      //     //consolle.log("Auto-call API response:", result);
      //     if (!result.success) {
      //       //consolle.error("Auto-call API failed:", result);
      //     }
      //   }
      // } catch (err) {
      //   //consolle.error("Auto-call order confirm error:", err.message);
      // }

      const responseData = { order };
      if (typeof bookingResult !== 'undefined' && bookingResult && bookingResult.resp) {
        responseData.shipment = bookingResult.resp;
        responseData.shippedWith = bookingResult.shipping;
        responseData.shippedServiceCode = bookingResult.serviceCode;
      }

      return {
        success: true,
        message: "Order placed successfully",
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getUserOrders(request, conn) {
    try {
      //consolle.log("request user", request.user);
      const userId = request.user?._id;
      //consolle.log("User ID:", userId);
      if (!userId) {
        throw new Error("User authentication required");
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }
      const searchParams = request.nextUrl.searchParams;
      const {
        page = 1,
        limit = 10,
        filters = "{}",
        sort = "{}",
        populateFields = ["items.product", "items.variant", "coupon"],
        selectFields = {},
      } = Object.fromEntries(searchParams.entries());
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const parsedFilters =
        typeof filters === "string" ? JSON.parse(filters) : filters;
      const parsedSort = typeof sort === "string" ? JSON.parse(sort) : sort;
      const filterConditions = { ...parsedFilters };
      const sortConditions = {};
      for (const [field, direction] of Object.entries(parsedSort)) {
        sortConditions[field] = direction === "asc" ? 1 : -1;
      }
      const { results, totalCount, currentPage, pageSize } =
        await this.orderRepository.getUserOrders(
          userId,
          filterConditions,
          sortConditions,
          pageNum,
          limitNum,
          populateFields,
          selectFields
        );
      const totalPages = Math.ceil(totalCount / limitNum);
      return {
        success: true,
        message: "Orders fetched successfully",
        data: results,
        currentPage,
        totalPages,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getOrderDetails(request, conn, params) {
    try {
      const userId = request.user?._id;
      if (!userId) {
        throw new Error("User authentication required");
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }
      const { id } = await params;
      if (!id) {
        throw new Error("orderId is required");
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid orderId: ${id}`);
      }
      const order = await this.orderRepository.getOrderById(
        id,
        userId,
        ["items.product", "items.variant", "coupon"],
        {}
      );
      return {
        success: true,
        message: "Order details fetched successfully",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getOrderById(orderId, userId, populateFields = [], selectFields = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error(`Invalid orderId: ${orderId}`);
      }
      if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }

      const order = await this.orderRepository.getOrderById(
        orderId,
        userId,
        populateFields,
        selectFields
      );

      return {
        success: true,
        message: "Order fetched successfully",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getRecentOrders(conn) {
    try {
      const orders = await this.orderRepository.getRecentOrders(5, [
        "items.product",
        "items.variant",
        "user",
      ]);      z
      return orders;
    } catch (error) {
      throw new Error(`Failed to fetch recent orders: ${error.message}`);
    }
  }

  async calculateIncome(filterConditions, conn) {
    try {
      const income = await this.orderRepository.calculateIncome(
        filterConditions
      );
      return income;
    } catch (error) {
      throw new Error(`Failed to calculate income: ${error.message}`);
    }
  }

  // Fetch DTDC services
  async getDtdcServices(order) {
    //consolle.log("order in dtdc ====>", order);
    if (!order?.data?.shippingAddress?.postalCode) {
      throw new Error("Shipping address or postal code is missing");
    }
    //consolle.log(
    //   "Fetching DTDC services for order:",
    //   order.data.shippingAddress.postalCode
    // );
    const originPincode = "110001";
    const destinationPincode = order?.data?.shippingAddress?.postalCode; // replace if needed

    const resp = await axios.post(
      "http://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall",
      { orgPincode: originPincode, desPincode: destinationPincode }
    );
    // //consolle.log('DTDC response:', resp.data);

    const services = resp.data.SERV_LIST_DTLS || [];
    console.log('Services:', services);
    return services.map((s) => ({
      code: s.NAME,
      name: s.NAME,
      courier: "DTDC",
      priority: 0, // default, will override from ShippingModel
    }));
  }

  // Fetch Delhivery services
  async getDelhiveryServices(order) {
    //console.log(
    //   "Fetching Delhivery services for order:",
    //   order?.data?.shippingAddress?.postalCode
    // );
    const originPincode = "110001";
    const destinationPincode = order?.data?.shippingAddress.postalCode; // replace if needed

    const resp = await axios.post(
      "http://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall",
      { orgPincode: originPincode, desPincode: destinationPincode }
    );
    // //consolle.log('DTDC response:', resp.data);

    const services = resp.data.SERV_LIST_DTLS || [];
    // //consolle.log('Services:', services);
    return services.map((s) => ({
      code: s.CODE,
      name: s.NAME,
      courier: "DTDC",
      priority: 0, // default, will override from ShippingModel
    }));
  }
  // Fetch Bluedart services
  async getBluedartServices(order) {
    try {
      const originPincode = process.env.BLUEDART_ORIGIN_PINCODE || "110001";
      const destinationPincode = order?.data?.shippingAddress?.postalCode;

      if (!destinationPincode) {
        throw new Error(
          "Destination postal code missing for Bluedart service check"
        );
      }

      // Generate JWT Token (assuming you store in ENV or helper)
      const tokenResp = await axios.post(
        process.env.BLUEDART_AUTH_URL, // e.g. https://api.bluedart.com/Authenticate
        {
          client_id: process.env.BLUEDART_CLIENT_ID,
          client_secret: process.env.BLUEDART_CLIENT_SECRET,
        }
      );
      const jwtToken = tokenResp.data?.access_token;

      const resp = await axios.post(
        process.env.BLUEDART_API_URL + "/GetServicesforPincodeAndProduct",
        {
          OriginPincode: originPincode,
          DestinationPincode: destinationPincode,
          ProductCode: "A", // Example product code (A = Express)
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const services = resp.data?.Services || [];
      return services.map((s) => ({
        code: s.ServiceCode,
        name: s.ServiceName,
        courier: "BLUEDART",
        priority: 0,
      }));
    } catch (error) {
      //consolle.error("Bluedart service fetch error:", error.message);
      return [];
    }
  }

  // Fetch all shipping methods with priority from DB
  async attachPriority(services, conn, tenant) {
    const Shipping =
      conn.models.Shipping || conn.model("Shipping", ShippingSchema);
    const shippings = await Shipping.find({ status: "active" }).lean();

    return services.map((s) => {
      const match = shippings.find(
        (sh) =>
          sh.carrier.toUpperCase() === s.courier.toUpperCase() &&
          sh.shippingMethod.toLowerCase().includes(s.name.toLowerCase())
      );
      return { ...s, priority: match ? match.priority : 0 };
    });
  }

  async getDelhiveryServices(order) {
    const originPincode = "110001";
    const destinationPincode = order?.data?.shippingAddress?.postalCode; // replace if needed
    const agent = new https.Agent({ rejectUnauthorized: false });
    return [
      { code: "SD1", name: "Express", courier: "DELHIVERY", priority: 0 },
      { code: "SD2", name: "Standard", courier: "DELHIVERY", priority: 0 },
    ];
    const headers = { Authorization: `Token ${process.env.DELHIVERY_TOKEN}` };
    const [originResp, destResp] = await Promise.all([
      axios.get(
        `https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes=${originPincode}`,
        { headers, httpsAgent: agent }
      ),
      axios.get(
        `https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes=${destinationPincode}`,
        { headers, httpsAgent: agent }
      ),
    ]);

    //consolle.log("Delhivery origin response:", originResp);
    //consolle.log("Delhivery destination response:", destResp);

    const serviceable =
      originResp.data.success &&
      destResp.data.success &&
      originResp.data.data[0].serviceable === "Y" &&
      destResp.data.data[0].serviceable === "Y";

    if (!serviceable) return [];

    return [
      { code: "SD1", name: "Express", courier: "DELHIVERY", priority: 0 },
      { code: "SD2", name: "Standard", courier: "DELHIVERY", priority: 0 },
    ];
  }

  //getServiceOptions
  async getServiceOptions(order, conn, tenant) {
    let services = [];

    const [dtdc, delhivery, bluedart] = await Promise.all([
      this.getDtdcServices(order),
      this.getDelhiveryServices(order),
      this.getBluedartServices(order),
    ]);

    services = [...dtdc, ...delhivery, ...bluedart];
    services = await this.attachPriority(services, conn, tenant);

    // Sort by priority (highest first)
    services.sort((a, b) => b.priority - a.priority);

    return services;
  }

  //getAllOrdersForTracking
  async getAllOrdersForTracking(request, conn) {
    try {
      // Ensure User model is registered on this connection so populate('user') works
      const User = conn.models.User || conn.model("User", UserSchema);

      const orders = await this.orderRepository.getAllOrdersForTracking([
        "items.product",
        "items.variant",
        "user",
      ]);
      //consolle.log("Orders for tracking fetched:", orders.length);
      return {
        success: true,
        message: "All orders for tracking fetched successfully",
        data: orders,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  //cancelOrder
  async cancelOrder(orderId, userId, conn) {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (userId && order.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized to cancel this order");
      }

      if (['delivered', 'cancelled', 'shipped'].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      const updatedOrder = await this.orderRepository.updateOrder(orderId, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      return {
        success: true,
        message: "Order cancelled successfully",
        data: updatedOrder
      };
    } catch (error) {
      throw error;
    }
  }

  async getOrders(query = {}, conn, options = {}) {
    return await this.orderRepository.findOrders(query, conn, options);
  }

  async getAllOrders(request, conn) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const {
        page = 1,
        limit = 10,
        filters = "{}",
        sort = "{}",
        populateFields = ["items.product", "items.variant", "coupon", "user"],
        selectFields = {},
      } = Object.fromEntries(searchParams.entries());

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const parsedFilters =
        typeof filters === "string" ? JSON.parse(filters) : filters;
      const parsedSort = typeof sort === "string" ? JSON.parse(sort) : sort;

      const filterConditions = { ...parsedFilters };
      const sortConditions = {};

      for (const [field, direction] of Object.entries(parsedSort)) {
        sortConditions[field] = direction === "asc" ? 1 : -1;
      }

      const { results, totalCount, currentPage, pageSize } =
        await this.orderRepository.getAllOrders(
          filterConditions,
          sortConditions,
          pageNum,
          limitNum,
          populateFields,
          selectFields
        );

      const totalPages = Math.ceil(totalCount / limitNum);

      return {
        success: true,
        message: "All orders fetched successfully",
        data: results,
        currentPage,
        totalPages,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Create Shipment on the selected courier
   */
  async createShipment(order, courier, serviceCode) {
    try {
      switch (courier.toUpperCase()) {
        case "DTDC":
          return this.createDtdcShipment(order, serviceCode);
        case "DELHIVERY":
          return this.createDelhiveryShipment(order, serviceCode);
        case "BLUEDART":
          return this.createBluedartShipment(order, serviceCode);
        default:
          throw new Error("Unsupported courier");
      }
    } catch (error) {
      consolle.error("Shipment creation error:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateOrder(id, data) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid orderId: ${id}`);
      }
      // Only update order status as per simplified functionality
      const updateData = {};
      if (data.status) {
        updateData.status = data.status;
      }

      /*
      // Shipping options disabled/commented out during update
      if (data.shippingAddress) {
        updateData.shippingAddress = data.shippingAddress;
      }
      if (data.shippingMethod) {
        updateData.shippingMethod = data.shippingMethod;
      }
      if (data.deliveryOption) {
        updateData.deliveryOption = data.deliveryOption;
      }
      if (data.shipping_details) {
        updateData.shipping_details = data.shipping_details;
      }
      */

      const updatedOrder = await this.orderRepository.updateOrder(id, updateData);
      return {
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  //generateLabel
  async generateLabel(order, courier, data) {
    switch (courier.toUpperCase()) {
      case "DTDC":
        return this.generateDtdcLabel(order, data);
      case "DELHIVERY":
        return this.generateDelhiveryLabel(order, data);
      case "BLUEDART":
        return this.generateBluedartLabel(order, data);
      default:
        throw new Error("Unsupported courier for label generation");
    }
  }

  // DTDC label generation
  async generateDtdcLabel(order, data) {
    // data.labelCode should be present
    if (!data?.labelCode) {
      throw new Error("labelCode is required for DTDC label generation");
    }
    const apiKey = process.env.DTDC_API_KEY;
    const referenceNumber = encodeURIComponent(
      order.shipping_details.reference_number
    );
    const labelCode = data.labelCode || "SHIP_LABEL_4X6"; // default to A4Z
    const labelFormat = "pdf";
    const url = `https://pxapi.dtdc.in/api/customer/integration/consignment/shippinglabel/stream?reference_number=${referenceNumber}&label_code=${labelCode}&label_format=${labelFormat}`;

    // Use GET request for label streaming
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      responseType: "arraybuffer", // PDF stream
    });

    // //consolle.log("DTDC label response status:", res.data);

    const labelDir = path.join(process.cwd(), "public/labels");
    if (!fs.existsSync(labelDir)) fs.mkdirSync(labelDir, { recursive: true });

    const fileName = `DTDC_${order._id}_${Date.now()}.pdf`;
    const filePath = path.join(labelDir, fileName);

    // Write binary data to file
    fs.writeFileSync(filePath, res.data);

    // Optionally make a public URL (if served via Express static)
    const labelUrl = `/labels/${fileName}`;
    const shippingDetails = {
      ...order.shipping_details,
      labelUrl: labelUrl,
    };

    //update order with label URL
    await this.orderRepository.updateOrder(order._id, {
      shipping_details: shippingDetails,
    });

    // Return PDF buffer and label URL
    return {
      success: true,
      message: "DTDC label generated successfully",
      // labelBuffer: res.data,
      labelUrl: labelUrl,
      reference_number: order.shipping_details.reference_number,
    };
  }

  // Delhivery label generation

  async generateDelhiveryLabel(order) {
    try {
      //consolle.log("=== DELHIVERY LABEL GENERATION DEBUG ===");

      // --- 1️⃣ Collect all waybills dynamically from order ---
      let waybills = [];
      if (order?.shipping_details?.waybill) {
        waybills.push(order.shipping_details.waybill);
      }
      if (order?.shipping_details?.raw_response?.packages) {
        const packageWaybills = order.shipping_details.raw_response.packages
          .map((pkg) => pkg.waybill)
          .filter(Boolean);
        waybills.push(...packageWaybills);
      }
      waybills = [...new Set(waybills)];
      //consolle.log("Found waybills:", waybills);

      if (!waybills.length) throw new Error("No waybill numbers found");

      const joined = waybills.join(",");
      const token = process.env.DELHIVERY_API_TOKEN;

      // --- 2️⃣ Fetch packing slip metadata (NOT PDF) ---
      const slipApi = `https://track.delhivery.com/api/p/packing_slip?wbns=${joined}&pdf=true&pdf_size=A6`;
      //consolle.log("Fetching packing slip metadata:", slipApi);

      const res = await axios.get(slipApi, {
        headers: { Authorization: `Token ${token}` },
      });

      //consolle.log("Packing slip API response status:", res);

      if (res.status !== 200 || !res.data) {
        throw new Error("Failed to fetch packing slip data");
      }

      // --- 3️⃣ Log full response to see structure ---
      //consolle.log("Full API response:", JSON.stringify(res.data, null, 2));

      // --- 4️⃣ Extract packages ---
      const packages = res.data.packages || [];
      if (!packages.length) {
        throw new Error("No packages found in response");
      }

      //consolle.log("Packages data:", JSON.stringify(packages, null, 2));

      // --- 5️⃣ Collect all PDF links ---
      const pdfLinks = packages
        .map((pkg) => pkg.pdf_download_link)
        .filter(Boolean);

      if (!pdfLinks.length) {
        throw new Error("No PDF download links found in packages");
      }

      //consolle.log("✅ PDF download links obtained:", pdfLinks);

      // --- 6️⃣ Update order with label URL ---
      const primaryLabelUrl = pdfLinks[0]; // Use first PDF link as primary
      const shippingDetails = {
        ...order.shipping_details,
        labelUrl: primaryLabelUrl,
      };

      // Update order with label URL
      await this.orderRepository.updateOrder(order._id, {
        shipping_details: shippingDetails,
      });

      //consolle.log("✅ Order updated with label URL:", primaryLabelUrl);

      // --- 7️⃣ Return the download link(s) ---
      return {
        success: true,
        message: "Delhivery packing slip link(s) generated successfully",
        waybills,
        pdfDownloadLinks: pdfLinks,
        primaryLink: primaryLabelUrl,
        labelUrl: primaryLabelUrl, // Added for consistency with other courier methods
        packages: packages.map((pkg) => ({
          wbn: pkg.wbn,
          pdf_download_link: pkg.pdf_download_link,
        })),
      };
    } catch (error) {
      //consolle.error("❌ Delhivery label generation failed:", error.message);
      //consolle.error("Stack trace:", error.stack);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Bluedart label generation (stub)
  async generateBluedartLabel(order, data) {
    // For now, return static response
    return {
      success: true,
      message: "Bluedart label generation not implemented yet",
      labelUrl: "https://bluedart.com/static-label.pdf",
    };
  }

  //getShipmentDashboardData
  async getShipmentDashboardData(conn, filters = {}) {
    try {
      const data = await this.orderRepository.getShipmentDashboardData(conn, filters);
      return {
        success: true,
        message: "Shipment dashboard data fetched successfully",
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  //trackShipment
  async trackShipment(order, trackingNumber, conn) {
    const courier = order?.shipping_details?.platform;
    // //consolle.log("Tracking shipment for courier:", courier);
    if (!courier) {
      throw new Error("Courier information missing in order");
    }
    if (!trackingNumber) {
      throw new Error("Tracking number is required for tracking");
    }
    switch (courier.toUpperCase()) {
      case "DTDC":
        return this.trackDtdcShipment(order, conn);
      case "DELHIVERY":
        return this.trackDelhiveryShipment(order, conn);
      case "BLUEDART":
        return this.trackBluedartShipment(order, conn);
      default:
        throw new Error("Unsupported courier for tracking");
    }
  }

  // DTDC tracking
  async trackDtdcShipment(order, conn) {
    console.log("Tracking DTDC shipment for order:", order);
    // You should store DTDC tracking username/password in env
    const username = process.env.DTDC_TRACK_USERNAME;
    const password = process.env.DTDC_TRACK_PASSWORD;
    if (!username || !password) {
      throw new Error("DTDC tracking credentials missing in environment");
    }
    const referenceNumber = order?.shipping_details?.reference_number;
    if (!referenceNumber) {
      throw new Error("Order missing DTDC reference number");
    }

    // //consolle.log("DTDC tracking reference number:", referenceNumber);

    // Step 1: Authenticate to get token
    const authUrl = `https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}`;
    // //consolle.log("DTDC auth URL:", authUrl);
    const authResp = await axios.get(authUrl);
    // //consolle.log("DTDC auth response:", authResp.data);
    const token = process.env.DTDC_TRACK_TOKEN || authResp.data;
    if (!token) {
      throw new Error("Failed to get DTDC tracking token");
    }

    // Step 2: Get tracking details
    const trackUrl =
      "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";
    const payload = {
      trkType: "cnno",
      strcnno: referenceNumber,
      addtnlDtl: "Y",
    };
    const trackResp = await axios.post(trackUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    // Build structured status history from DTDC response and persist to order
    const header = trackResp.data?.trackHeader || {};
    const details = Array.isArray(trackResp.data?.trackDetails)
      ? trackResp.data.trackDetails.slice()
      : [];

    // helper to parse DTDC date/time formats like "06112025" and "1252"
    function parseDtdcDate(dateStr, timeStr) {
      if (!dateStr) return null;
      // expect DDMMYYYY (8 chars) or DDM M? fallback
      const d =
        dateStr.length === 8 ? dateStr.slice(0, 2) : dateStr.slice(0, 2);
      const m =
        dateStr.length === 8 ? dateStr.slice(2, 4) : dateStr.slice(2, 4);
      const y = dateStr.length === 8 ? dateStr.slice(4) : dateStr.slice(4);
      const hh = timeStr && timeStr.length >= 2 ? timeStr.slice(0, 2) : "00";
      const mm = timeStr && timeStr.length >= 4 ? timeStr.slice(2, 4) : "00";
      // return ISO string (UTC)
      const iso = new Date(`${y}-${m}-${d}T${hh}:${mm}:00Z`);
      return isNaN(iso.getTime()) ? null : iso.toISOString();
    }

    // map DTDC track details to a normalized history array
    const statusHistory = details.map((d) => {
      return {
        code: d.strCode || d.strActionCode || null,
        action: d.strAction || d.strAction || null,
        manifest: d.strManifestNo || null,
        origin: d.strOrigin || null,
        destination: d.strDestination || null,
        actionDate: parseDtdcDate(
          d.strActionDate || d.strActionDate,
          d.strActionTime || d.strActionTime
        ),
        remarks: d.sTrRemarks || d.strRemarks || null,
        latitude: d.strLatitude || null,
        longitude: d.strLongitude || null,
        raw: d,
      };
    });

    // include header summary as the latest/top-level status entry (if present)
    if (header && Object.keys(header).length) {
      const headerDate = parseDtdcDate(
        header.strStatusTransOn || header.strExpectedDeliveryDate,
        header.strStatusTransTime || header.strStatusTransTime
      );
      statusHistory.push({
        code: header.strStatusRelCode || null,
        action: header.strStatus || header.strCNProduct || null,
        manifest: header.strRtoNumber || header.strRefNo || null,
        origin: header.strOrigin || null,
        destination: header.strDestination || null,
        actionDate: headerDate,
        remarks: header.strRemarks || null,
        raw: header,
      });
    }

    // sort history by date asc (oldest first). items with null date go to end.
    statusHistory.sort((a, b) => {
      if (!a.actionDate && !b.actionDate) return 0;
      if (!a.actionDate) return 1;
      if (!b.actionDate) return -1;
      return new Date(a.actionDate) - new Date(b.actionDate);
    });

    // derive a friendly current status (prefer header.strStatus, fallback to last history action)
    const latestStatus =
      header.strStatus || statusHistory.length
        ? statusHistory[statusHistory.length - 1]?.action ||
        statusHistory[statusHistory.length - 1]?.raw?.strAction ||
        null
        : null;

    // ensure the response has a place where existing code expects statusDescription
    if (
      Array.isArray(trackResp.data.trackDetails) &&
      trackResp.data.trackDetails.length
    ) {
      trackResp.data.trackDetails[0].statusDescription =
        trackResp.data.trackDetails[0].statusDescription || latestStatus;
    } else {
      // create a synthetic entry so downstream code can read statusDescription
      trackResp.data.trackDetails = [{ statusDescription: latestStatus }];
    }

    // prepare shipping_details payload and persist
    const shippingDetails = {
      ...order.shipping_details,
      platform: order.shipping_details?.platform || "dtdc",
      reference_number:
        header.strShipmentNo ||
        header.strRefNo ||
        order.shipping_details?.reference_number ||
        null,
      tracking_url:
        order.shipping_details?.tracking_url ||
        `https://www.dtdc.in/tracking?awb=${header.strShipmentNo || header.strRefNo || ""
        }`,
      status_history: statusHistory,
      current_status: latestStatus || order.status || "unknown",
      last_updated: new Date().toISOString(),
      raw_response: trackResp.data,
    };

    // //consolle.log("DTDC tracking details to be saved:", shippingDetails);

    await this.orderRepository.updateOrder(order._id, {
      shipping_details: shippingDetails,
    });

    ////console.log("checking order for shipping method Dtdc", order);
    const userService = new UserService(conn);

    let user = order.user;

    if (!user?._id) {
      const userResult = await userService.getUserById(order.user.toString());
      if (userResult.success) {
        user = userResult.data.user;
      }
    }

    const whatsappService = new WhatsappService();
    const payload2 = {
      phone: user.phone,
      name: user.name,
      email: user.email,
      extraFields: {
        orderId: order._id.toString(),
        orderTotal: order.total.toString(),
        status: order.status,
      },
    };
    const Product = conn.models.Product || conn.model("Product", ProductSchema);

    const items = order.items || [];
    const productPromises = items.map(async (item) => {
      // If item has a productId, fetch by id; otherwise try to find by product name as a fallback
      if (item.product) {
        return Product.findById(item.product)
          .lean()
          .exec()
          .catch((err) => {
            ////console.error("Failed to fetch product by id", item.product, err);
            return null;
          });
      } else if (item.product) {
        return Product.findOne({ _id: item.product })
          .lean()
          .exec()
          .catch((err) => {
            ////console.error("Failed to fetch product by name", item.product, err);
            return null;
          });
      } else {

        return null;
      }
    });
    const products = await Promise.all(productPromises);
    ////console.log("products ===> ", products);
    products.forEach((product, index) => {
      const item = items[index];
      payload2.extraFields[`productName${index + 1}`] =
        product?.name || item?.product || "";
    });

    ////console.log("payload is ===> ", payload2);
    const response = await whatsappService.sendWebhookRequest({ ...payload2 });
    ////console.log("api response ==> ", response);

    // if (!response.success) {
    //   ////console.log("failed to send message on whatsapp");
    //   result.whatsappError = response.error;
    // }

    return {
      success: true,
      message: "DTDC tracking fetched successfully",
      trackingNumber: referenceNumber,
    };
  }

  // Delhivery tracking
  async trackDelhiveryShipment(order) {
    try {
      const referenceNumber = order?.shipping_details?.reference_number;
      if (!referenceNumber) {
        throw new Error("Reference number not found in order shipping details");
      }

      const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?waybill=${referenceNumber}`;

      //consolle.log("Fetching Delhivery tracking for waybill:", referenceNumber);
      //consolle.log("Delhivery tracking API URL:", apiUrl);
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      // Normalize response payload (supporting various shapes)
      const respData = response.data || {};
      const shipmentArray =
        Array.isArray(respData.ShipmentData) && respData.ShipmentData.length
          ? respData.ShipmentData
          : respData.ShipmentData
            ? [respData.ShipmentData]
            : respData.Shipment
              ? [{ Shipment: respData.Shipment }]
              : [];

      const firstEntry = shipmentArray[0];
      const shipment = firstEntry ? firstEntry.Shipment || firstEntry : null;

      // Build status history from Scans and top-level Status
      const statusHistory = [];

      if (shipment?.Scans && Array.isArray(shipment.Scans)) {
        for (const scanWrapper of shipment.Scans) {
          const sd = scanWrapper?.ScanDetail || scanWrapper;
          const dateStr = sd?.ScanDateTime || sd?.StatusDateTime || null;
          statusHistory.push({
            code: sd?.StatusCode || null,
            action: sd?.Scan || sd?.ScanType || sd?.Status || null,
            manifest: shipment?.AWB || shipment?.ReferenceNo || null,
            origin:
              sd?.ScannedLocation ||
              shipment?.Origin ||
              shipment?.PickupLocation ||
              null,
            destination:
              shipment?.Consignee?.City ||
              shipment?.Destination ||
              (shipment?.Consignee?.PinCode
                ? String(shipment.Consignee.PinCode)
                : null),
            actionDate: dateStr ? new Date(dateStr).toISOString() : null,
            remarks: sd?.Instructions || sd?.Remarks || null,
            raw: sd,
          });
        }
      }

      if (shipment?.Status) {
        const s = shipment.Status;
        const dateStr = s?.StatusDateTime || s?.StatusDateTime || null;
        statusHistory.push({
          code: s?.StatusCode || null,
          action: s?.Status || s?.StatusType || null,
          manifest: shipment?.AWB || shipment?.ReferenceNo || null,
          origin: s?.StatusLocation || shipment?.Origin || null,
          destination:
            shipment?.Consignee?.City || shipment?.Destination || null,
          actionDate: dateStr ? new Date(dateStr).toISOString() : null,
          remarks: s?.Instructions || null,
          raw: s,
        });
      }

      // sort by date ascending (oldest first). Null dates go to end.
      statusHistory.sort((a, b) => {
        if (!a.actionDate && !b.actionDate) return 0;
        if (!a.actionDate) return 1;
        if (!b.actionDate) return -1;
        return new Date(a.actionDate) - new Date(b.actionDate);
      });

      // derive readable latest status
      const latestStatus =
        (shipment?.Status && shipment.Status.Status) ||
        (statusHistory.length
          ? statusHistory[statusHistory.length - 1]?.action
          : null) ||
        null;

      // prepare shipping_details payload for DB
      const referenceNum =
        shipment?.AWB || shipment?.ReferenceNo || referenceNumber;
      const shippingDetails = {
        ...order.shipping_details,
        platform: "delhivery",
        reference_number: referenceNum,
        waybill: shipment?.AWB || shippingDetails?.waybill || referenceNum,
        tracking_url: `https://track.delhivery.com/api/v1/packages/json/?waybill=${referenceNum}`,
        status_history: statusHistory,
        current_status: latestStatus || order.status || "unknown",
        last_updated: new Date().toISOString(),
        raw_response: respData,
      };

      // persist shipping details to order
      await this.orderRepository.updateOrder(order._id, {
        shipping_details: shippingDetails,
      });

      const userService = new UserService(conn);

      let user = order.user;

      if (!user?._id) {
        const userResult = await userService.getUserById(order.user.toString());
        if (userResult.success) {
          user = userResult.data.user;
        }
      }

      const whatsappService = new WhatsappService();
      const payload2 = {
        phone: user.phone,
        name: user.name,
        email: user.email,
        extraFields: {
          orderId: order._id.toString(),
          orderTotal: order.total.toString(),
          status: order.status,
        },
      };
      const Product =
        conn.models.Product || conn.model("Product", ProductSchema);

      const items = order.items || [];
      const productPromises = items.map(async (item) => {
        // If item has a productId, fetch by id; otherwise try to find by product name as a fallback
        if (item.product) {
          return Product.findById(item.product)
            .lean()
            .exec()
            .catch((err) => {
              ////console.error("Failed to fetch product by id", item.product, err);
              return null;
            });
        } else if (item.product) {
          return Product.findOne({ _id: item.product })
            .lean()
            .exec()
            .catch((err) => {

              return null;
            });
        } else {

          return null;
        }
      });
      const products = await Promise.all(productPromises);
      ////console.log("products ===> ", products);
      products.forEach((product, index) => {
        const item = items[index];
        payload2.extraFields[`productName${index + 1}`] =
          product?.name || item?.product || "";
      });

      ////console.log("payload is ===> ", payload2);
      const response2 = await whatsappService.sendWebhookRequest({
        ...payload2,
      });
      ////console.log("api response ==> ", response2);

      if (!response2.success) {
        ////console.log("filed to send message on whatsapp");
        result.whatsappError = response2.error;
      }

      return {
        success: true,
        message: "Delhivery tracking fetched successfully",
        trackingNumber: referenceNumber,
        data: response.data,
      };
    } catch (error) {
      //consolle.error("Delhivery tracking failed:", error);
      return {
        success: false,
        message: `Delhivery tracking failed: ${error.message}`,
        trackingNumber: order?.shipping_details?.waybill || "",
        data: {},
        error: error.message,
      };
    }
  }

  // Bluedart tracking (stub)
  async trackBluedartShipment(order) {
    // For now, return static response
    return {
      success: true,
      message: "Bluedart tracking not implemented yet",
      trackingNumber: order?.shipping_details?.reference_number || "",
      data: {},
    };
  }

  // ========== Build Common Helpers ========== //
  async buildProductDescription(order) {
    //consolle.log("Building product description for order:", order);

    return order?.items
      ?.map((i) => `${i.quantity}x ${i.product?.name || "Item"}`)
      .join(", ");
  }

  async buildPiecesDetail(order) {
    //consolle.log(
    //   "Building pieces detail for order:",
    //   order.items.map((i) => ({
    //     description: i.product?.name || "Product",
    //     declared_value: i.price.toString(),
    //     weight: (i.price / 1000).toFixed(2), // dummy logic: price ≈ weight/1000
    //     height: "5",
    //     length: "5",
    //     width: "5",
    //   }))
    // );
    return order.items.map((i) => ({
      description: i.product?.name || "Product",
      declared_value: i.price.toString(),
      weight: (i.price / 1000).toFixed(2), // dummy logic: price ≈ weight/1000
      height: "5",
      length: "5",
      width: "5",
    }));
  }

  // ========== DELHIVERY SERVICE ========== //
  // ✅ Create Delhivery Shipment (Single or Multi-Package)

  // 📦 Create Delhivery Shipment (Supports MPS)
 



  // ===============================================
// ✅ CREATE DELHIVERY SHIPMENT (FINAL FIXED)
// ===============================================
// ===============================================
// ✅ CREATE DELHIVERY SHIPMENT (CORRECTED FINAL)
// ===============================================
async createDelhiveryShipment(order, shipping) {
  try {
    // 🔐 Use your working token directly (since env not loading properly)
    const token = "5e7e9b8bfc46279733d74e9717a90b3842394771";

    const isCOD = order.paymentMode === "COD";
    const pin = order.shippingAddress.postalCode;

    // ------------------------------------
    // 1️⃣ GET WAYBILL
    // ------------------------------------
    const waybillResp = await this.getDelhiveryWaybill(1);

    const waybill =
      typeof waybillResp === "string"
        ? waybillResp
        : waybillResp?.waybill;

    if (!waybill) {
      throw new Error("Waybill not received");
    }

    console.log("Waybill Received:", waybill);

    // ------------------------------------
    // 2️⃣ SERVICEABILITY CHECK (FIXED)
    // ------------------------------------
    const serviceUrl =
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`;

    const serviceResp = await axios.get(serviceUrl, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
    });

    console.log("Serviceability Response:", serviceResp.data);

    const serviceData =
      serviceResp.data?.delivery_codes?.[0]?.postal_code;

    if (!serviceData) {
      throw new Error("Invalid serviceability response");
    }

    if (
      serviceData.pre_paid !== "Y" &&
      serviceData.cod !== "Y"
    ) {
      throw new Error("Destination PIN not serviceable");
    }

    // ------------------------------------
    // 3️⃣ CREATE SHIPMENT
    // ------------------------------------
    const pickup_location = {
      name: process.env.DELHIVERY_CLIENT_NAME || "COMPANY_NAME",
      add: "34 GOHANA VPO THASKA MAHARA, Sonipat, HARYANA 131301",
      city: "SONEPAT",
      pin: "131301",
      country: "India",
      phone: order.billingAddress.phoneNumber || "9999999999",
    };

    const shipmentData = {
      pickup_location,
      shipments: [
        {
          waybill,
          order: order._id.toString(),
          pin,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          add: order.shippingAddress.addressLine1,
          phone: order.shippingAddress.phoneNumber,
          payment_mode: isCOD ? "COD" : "Prepaid",
          cod_amount: isCOD ? order.total : 0,
          name: order.shippingAddress.fullName,
          total_amount: order.total,
          country: "India",
          weight: "1",
        },
      ],
    };

    const payload = new URLSearchParams();
    payload.append("format", "json");
    payload.append("data", JSON.stringify(shipmentData));

    const createResp = await axios.post(
      "https://track.delhivery.com/api/cmu/create.json",
      payload.toString(),
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Create Shipment Response:", createResp.data);

    if (!createResp.data.success) {
      throw new Error(
        createResp.data.rmk || "Shipment creation failed"
      );
    }

    // ------------------------------------
    // 4️⃣ SAVE SHIPPING DETAILS
    // ------------------------------------
    const shippingDetails = {
      platform: "delhivery",
      reference_number: waybill,
      tracking_url: `https://www.delhivery.com/track/package/${waybill}`,
      raw_response: createResp.data,
      created_at: new Date(),
    };

    await this.orderRepository.updateOrder(order._id, {
      shipping_details: shippingDetails,
    });

    return {
      success: true,
      message: "Delhivery shipment created successfully",
      trackingNumber: waybill,
      data: createResp.data,
    };

  } catch (error) {
    console.log("❌ Delhivery Error:", error.response?.data || error.message);

    return {
      success: false,
      message: `Delhivery shipment creation failed: ${
        error.response?.data?.rmk || error.message
      }`,
    };
  }
}





  //🔢 Get Delhivery Waybill Numbers
 // ===============================================
// ✅ GET DELHIVERY WAYBILL
// ===============================================
async getDelhiveryWaybill(count = 1) {
  try {
    const token = process.env.DELHIVERY_API_TOKEN?.trim();
    const clientName = process.env.DELHIVERY_CLIENT_NAME || "COMPANY_NAME";

    const url =
      `https://track.delhivery.com/waybill/api/bulk/json/?count=${count}&cl=${clientName}`;


       console?.log("Requesting waybill from Delhivery:", url);


    const response = await axios.get(url, {
      headers: {
        Authorization: `Token 5e7e9b8bfc46279733d74e9717a90b3842394771`,
      },
    });

    console.log("Waybill API Response:", response.data);

    return response.data;

  } catch (err) {
    console.error(
      "Waybill error:",
      err.response?.data || err.message
    );
    throw new Error("Failed to get Delhivery waybill");
  }
}




  // 🛍️ Build Product Description
  async buildProductDescription(order) {
    return order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
  }

  // ========== DTDC (Shipsy) SERVICE ========== //
  async createDtdcShipment(order, shipping) {
    // Build payload dynamically from order object

    //consolle.log("Creating DTDC shipment for order:", order);

    const isCOD = order.paymentMode === "COD";
    const origin = {
      fullName: process.env.DELHIVERY_CLIENT_NAME || "COMPANY_NAME",
      phoneNumber: order.billingAddress.phoneNumber,
      addressLine1: "34   GOHANA VPO THASKA MAHARA,",
      addressLine2: "GOHANA VPO THASKA MAHARA, Sonipat, HARYANA ,India 131301",
      postalCode: "131301",
      city: "SONEPAT",
      state: "HARYANA",
    };
    const destination = order.shippingAddress;

    // console.log("DTDC shipment origin:", origin);
    // console.log("DTDC shipment destination:", destination);

    // Build pieces_detail from order items
    const piecesDetail = order.items.map((item) => ({
      description: item.product?.name || "Product",
      declared_value: (item.price * item.quantity).toString(),
      weight: item.weight?.toString() || "0.5",
      height: item.product?.dimensions?.height?.toString() || "5",
      length: item.product?.dimensions?.length?.toString() || "5",
      width: item.product?.dimensions?.width?.toString() || "5",
    }));

    const payload = {
      consignments: [
        {
          customer_code: process.env.DTDC_CUSTOMER_CODE,
          service_type_id: typeof shipping === 'string' ? shipping : (shipping?.service_type_id || "B2C PRIORITY"),
          load_type: "NON-DOCUMENT",
          description: order.items
            .map((i) => i.product?.name || "Product")
            .join(", "),
          dimension_unit: "cm",
          length: shipping?.dimensions?.length?.toString() || "10.0",
          width: shipping?.dimensions?.width?.toString() || "10.0",
          height: shipping?.dimensions?.height?.toString() || "10.0",
          weight_unit: "kg",
          weight:
            shipping?.weight?.toString() || (order.total / 1000).toFixed(2),
          declared_value: order.total.toString(),
          num_pieces: order.items.length.toString(),
          origin_details: {
            name: origin.fullName,
            phone: origin.phoneNumber,
            alternate_phone: "",
            address_line_1: origin.addressLine1,
            address_line_2: origin.addressLine2 || "",
            pincode: origin.postalCode,
            city: origin.city,
            state: origin.state,
          },
          destination_details: {
            name: destination.fullName,
            phone: destination.phoneNumber,
            alternate_phone: "",
            address_line_1: destination.addressLine1,
            address_line_2: destination.addressLine2 || "",
            pincode: destination.postalCode,
            city: destination.city,
            state: destination.state,
          },
          customer_reference_number: order._id.toString(),
          cod_collection_mode: isCOD ? "cash" : "",
          cod_amount: isCOD ? order.total.toString() : "0",
          commodity_id: "7",
          reference_number: "",
          pieces_detail: piecesDetail,
        },
      ],
    };

    console.log("DTDC shipment payload:", payload);
    // //console.log("Using DTDC API Key:", process.env.DTDC_API_KEY);

    // Make API call
    console.log("[orderService][createDtdcShipment] DTDC_API_KEY present:", !!process.env.DTDC_API_KEY, process.env.DTDC_API_KEY ? `${process.env.DTDC_API_KEY.slice(0,4)}...${process.env.DTDC_API_KEY.slice(-4)}` : null);
    let res;
    try {
      res = await axios.post(
        "https://pxapi.dtdc.in/api/customer/integration/consignment/softdata",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.DTDC_API_KEY,
          },
        }
      );

      console.log("[orderService][createDtdcShipment] DTDC response status", res.status);
      //consolle.log("DTDC shipment response:", res.data);
    } catch (err) {
      console.error("[orderService][createDtdcShipment] DTDC request failed", err?.response?.status, err?.response?.data || err?.message || err);
      if (err.response) {
        // Surface provider error message for easier debugging
        throw new Error(`DTDC API Error: ${err.response.data?.message || JSON.stringify(err.response.data)}`);
      }
      throw new Error(`DTDC request failed: ${err.message || String(err)}`);
    }

    if (res.data.status == "OK" && res.data?.data?.[0]?.reference_number) {
      // Save shipping_details in order model
      const shippingDetails = {
        platform: "dtdc",
        reference_number: res.data?.data?.[0]?.reference_number || null,
        tracking_url: `https://www.dtdc.in/tracking?awb=${res.data?.data?.[0]?.reference_number}`,
        raw_response: res.data,
      };
      // //consolle.log("Shipping details to save:", shippingDetails);

      //save to order
      await this.orderRepository.updateOrder(order._id, {
        shipping_details: shippingDetails,
      });
    } else {
      console.log("DTDC shipment creation failed:", res.data);
      throw new Error(
        `DTDC shipment creation failed: ${res.data.data.message || "Unknown error"}`
      );
    }

    // Update order with shipping_details

    // //consolle.log("DTDC shipment response:", res.data);

    // Return formatted response
    return {
      success: true,
      message: "DTDC shipment created successfully",
      trackingNumber:
        res.data?.consignments?.[0]?.reference_number ||
        res.data?.consignments?.[0]?.awb_number,
      data: res.data,
    };
  }

  // ========== BLUEDART SERVICE ========== //
  // ========= BLUEDART CREATE SHIPMENT ========= //
  // async createBluedartShipment(order, shipping) {
  //   try {

  //     // //consolle.log("Creating Bluedart shipment for order:",  process.env.BLUEDART_CLIENT_ID, process.env.BLUEDART_CLIENT_SECRET, order);

  //     // Step 1: Generate authentication token using ClientID and clientSecret headers
  //     const tokenResp = await axios.get(
  //       'https://apigateway.bluedart.com/in/transportation/token/v1/login',
  //       {
  //         headers: {
  //           'ClientID': process.env.BLUEDART_CLIENT_ID,
  //           'clientSecret': process.env.BLUEDART_CLIENT_SECRET,
  //           'Content-Type': 'application/json'

  //         }
  //       }
  //     );

  //     //consolle.log('Bluedart token response status:', tokenResp.status);
  //     //consolle.log('Bluedart token response data:', tokenResp.data);

  //     if (!tokenResp.data?.JWTToken) {
  //       //consolle.error('Authentication failed - no JWT token in response');
  //       throw new Error(`Failed to get Bluedart authentication token: ${JSON.stringify(tokenResp.data)}`);
  //     }

  //     const jwtToken = tokenResp.data.JWTToken;
  //     //consolle.log('Bluedart token generated successfully, length:', jwtToken.length);

  //     // Step 2: Build waybill generation payload
  //     const origin = {
  //       fullName: 'BHARATGRAM B2C',
  //       phoneNumber: order.billingAddress.phoneNumber,
  //       addressLine1: "34 GOHANA VPO THASKA MAHARA",
  //       addressLine2: "GOHANA VPO THASKA MAHARA, Sonipat, HARYANA, India 131301",
  //       postalCode: "131301",
  //       city: "SONEPAT",
  //       state: "HARYANA",
  //     };

  //     const destination = order.shippingAddress;
  //     const isCOD = order.paymentMode === "COD";

  //     // Calculate total weight and pieces
  //     const totalWeight = order.items.reduce((sum, item) => {
  //       const itemWeight = parseFloat(item.weight) || 0.5; // Default 0.5kg per item
  //       return sum + (itemWeight * item.quantity);
  //     }, 0);

  //     const totalPieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  //     // Build waybill payload according to Bluedart API specification
  //     const waybillPayload = {
  //       Request: {
  //         Consignee: {
  //           ConsigneeName: destination.fullName,
  //           ConsigneeAddress1: destination.addressLine1,
  //           ConsigneeAddress2: destination.addressLine2 || "",
  //           ConsigneeAddress3: "",
  //           ConsigneePincode: destination.postalCode,
  //           ConsigneeCity: destination.city,
  //           ConsigneeState: destination.state,
  //           ConsigneeCountry: destination.country || "IND",
  //           ConsigneeMobile: destination.phoneNumber,
  //           ConsigneeEmailID: destination.email || "",
  //           ConsigneeTelephone: ""
  //         },
  //         Shipper: {
  //           CustomerName: origin.fullName,
  //           CustomerAddress1: origin.addressLine1,
  //           CustomerAddress2: origin.addressLine2,
  //           CustomerAddress3: "",
  //           CustomerPincode: origin.postalCode,
  //           CustomerCity: origin.city,
  //           CustomerState: origin.state,
  //           CustomerCountry: "IND",
  //           CustomerMobile: origin.phoneNumber,
  //           CustomerTelephone: "",
  //           CustomerEmailID: ""
  //         },
  //         Services: {
  //           ProductCode: shipping?.productCode || "A", // A = Express, E = Domestic Express
  //           SubProductCode: isCOD ? "C" : "", // C = COD, empty for prepaid
  //           PickupDate: new Date().toISOString().split("T")[0],
  //           PickupTime: "1500", // 3:00 PM in 24hr format
  //           PieceCount: totalPieces,
  //           Weight: totalWeight.toFixed(2),
  //           DeclaredValue: order.total,
  //           CollectableAmount: isCOD ? order.total : 0,
  //           Commodity: {
  //             CommodityDetail1: order.items.map(i => i.product?.name || "Product").join(", "),
  //             CommodityDetail2: "",
  //             CommodityDetail3: ""
  //           },
  //           SpecialInstruction: "",
  //           DeliveryTimeCode: shipping?.deliveryTimeCode || "",
  //           PackType: "",
  //           DimWeight: "",
  //           Length: shipping?.dimensions?.length || 10,
  //           Width: shipping?.dimensions?.width || 10,
  //           Height: shipping?.dimensions?.height || 10
  //         },
  //         ReferenceNumber: order._id.toString(),
  //         PickupLocationCode: process.env.BLUEDART_PICKUP_LOCATION || "131301",
  //         PickupMode: "P", // P = Pickup, S = Self Drop
  //         TotalCashPaytoCompany: 0,
  //         CreditReferenceNo: order.paymentId || order._id.toString(),
  //        Profile: {
  //     LoginID: "GOH92520",
  //     LicenseKey: "nmilgqfslqloplglu2spkqfhqohf5jim",
  //     Api_type: "S"
  //   },

  //       }
  //     };

  //     //consolle.log('Bluedart waybill payload:', JSON.stringify(waybillPayload, null, 2));

  //     // Step 3: Generate waybill
  //     let waybillResp;
  //     try {
  //       waybillResp = await axios.post(
  //         'https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill',
  //         waybillPayload,
  //         {
  //           headers: {
  //             'JWTToken': jwtToken,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  //     } catch (err) {
  //       //consolle.error('Bluedart waybill request failed:', err.message);
  //       //consolle.error('Request URL:', 'https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill');
  //       //consolle.error('Request payload:', JSON.stringify(waybillPayload, null, 2));
  //       //consolle.error('Request headers:', {
  //         'JWTToken': jwtToken ? 'Token present' : 'Token missing',
  //         'Content-Type': 'application/json'
  //       });
  //       //consolle.error('Response status:', err.response?.status);
  //       //consolle.error('Response headers:', err.response?.headers);
  //       //consolle.error('Response data:', JSON.stringify(err.response?.data, null, 2));

  //       return {
  //         success: false,
  //         message: `Bluedart waybill request failed: ${err.response?.status} - ${err.response?.statusText || err.message}`,
  //         error: {
  //           status: err.response?.status,
  //           statusText: err.response?.statusText,
  //           data: err.response?.data,
  //           message: err.message
  //         },
  //         courier: 'BLUEDART',
  //         orderId: order._id?.toString?.() || null,
  //       };
  //     }

  //     //consolle.log('Bluedart waybill response:', waybillResp.data);

  //     // Step 4: Process response and handle errors
  //     if (!waybillResp.data?.GenerateWayBillResult) {
  //       throw new Error(`Bluedart waybill generation failed: ${waybillResp.data?.ErrorMessage || 'Unknown error'}`);
  //     }

  //     const result = waybillResp.data.GenerateWayBillResult;

  //     if (!result.IsError && result.AWBNo) {
  //       // Step 5: Save shipping details to order (similar to DTDC implementation)
  //       const shippingDetails = {
  //         platform: "bluedart",
  //         awb_number: result.AWBNo,
  //         reference_number: order._id.toString(),
  //         tracking_url: `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${result.AWBNo}`,
  //         token_number: result.TokenNumber,
  //         destination_location: result.DestinationLocation,
  //         destination_area: result.DestinationArea,
  //         raw_response: waybillResp.data,
  //         created_at: new Date()
  //       };

  //       // Update order with shipping details
  //       await this.orderRepository.updateOrder(order._id, {
  //         shipping_details: shippingDetails,
  //       });

  //       return {
  //         success: true,
  //         message: "Bluedart waybill generated successfully",
  //         trackingNumber: result.AWBNo,
  //         tokenNumber: result.TokenNumber,
  //         destinationLocation: result.DestinationLocation,
  //         destinationArea: result.DestinationArea,
  //         courier: "BLUEDART",
  //         orderId: order._id.toString(),
  //         data: result,
  //       };
  //     } else {
  //       throw new Error(`Bluedart waybill generation failed: ${result.Status?.[0]?.StatusInformation || 'Unknown error'}`);
  //     }

  //   } catch (error) {
  //     //consolle.error("Bluedart shipment creation failed:", error);

  //     // Return structured error response
  //     return {
  //       success: false,
  //       message: `Bluedart shipment creation failed: ${error.message}`,
  //       error: {
  //         message: error.message,
  //         response: error.response?.data || null,
  //         status: error.response?.status || null
  //       },
  //       courier: "BLUEDART",
  //       orderId: order._id.toString(),
  //     };
  //   }
  // }

  async createBluedartShipment(order, shipping) {
    try {
      // Step 1: Generate authentication token
      const tokenResp = await axios.get(
        "https://apigateway.bluedart.com/in/transportation/token/v1/login",
        {
          headers: {
            ClientID: process.env.BLUEDART_CLIENT_ID,
            clientSecret: process.env.BLUEDART_CLIENT_SECRET,
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResp.data?.JWTToken) {
        throw new Error(`Failed to get Bluedart authentication token`);
      }

      const jwtToken = tokenResp.data.JWTToken;
      //consolle.log("Bluedart token generated successfully");

      // Step 2: Build waybill generation payload
      const origin = {
        fullName: process.env.DELHIVERY_CLIENT_NAME || "COMPANY_NAME",
        phoneNumber: order.billingAddress.phoneNumber,
        addressLine1: "34 GOHANA VPO THASKA MAHARA",
        addressLine2:
          "GOHANA VPO THASKA MAHARA, Sonipat, HARYANA, India 131301",
        postalCode: "131301",
        city: "SONEPAT",
        state: "HARYANA",
      };

      const destination = order.shippingAddress;
      const isCOD = order.paymentMode === "COD";

      // Calculate total weight and pieces
      const totalWeight = order.items.reduce((sum, item) => {
        const itemWeight = parseFloat(item.weight) || 0.5;
        return sum + itemWeight * item.quantity;
      }, 0);

      const totalPieces = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Convert date to Bluedart format: /Date(epochMilliseconds)/
      const pickupDate = new Date();
      pickupDate.setHours(15, 0, 0, 0); // Set to 3 PM
      const dateString = `/Date(${pickupDate.getTime()})/`;

      // Build waybill payload according to Bluedart API specification
      const waybillPayload = {
        Request: {
          Consignee: {
            ConsigneeName: destination.fullName,
            ConsigneeAddress1: destination.addressLine1,
            ConsigneeAddress2: destination.addressLine2 || "",
            ConsigneeAddress3: "",
            ConsigneePincode: destination.postalCode,
            ConsigneeMobile: destination.phoneNumber,
            ConsigneeEmailID: destination.email || "",
            ConsigneeTelephone: "",
            ConsigneeAttention: "",
            ConsigneeGSTNumber: "",
            ConsigneeLatitude: "",
            ConsigneeLongitude: "",
            ConsigneeMaskedContactNumber: "",
            ConsigneeAddressType: "R", // R = Residential, C = Commercial
          },
          Shipper: {
            CustomerName: origin.fullName,
            CustomerAddress1: origin.addressLine1,
            CustomerAddress2: origin.addressLine2,
            CustomerAddress3: "",
            CustomerPincode: origin.postalCode,
            CustomerMobile: origin.phoneNumber,
            CustomerTelephone: "",
            CustomerEmailID: "",
            CustomerCode: process.env.BLUEDART_CUSTOMER_CODE || "951554",
            CustomerGSTNumber: "",
            CustomerLatitude: "",
            CustomerLongitude: "",
            CustomerMaskedContactNumber: "",
            IsToPayCustomer: false,
            Sender: origin.fullName,
            OriginArea: process.env.BLUEDART_ORIGIN_AREA || "GOH",
            VendorCode: process.env.BLUEDART_VENDOR_CODE || "GOH951554",
            PickupLocationCode:
              process.env.BLUEDART_PICKUP_LOCATION_CODE || "GOH",
          },
          Returnadds: {
            ManifestNumber: "",
            ReturnAddress1: origin.addressLine1,
            ReturnAddress2: origin.addressLine2,
            ReturnAddress3: "",
            ReturnContact: origin.fullName,
            ReturnEmailID: "",
            ReturnLatitude: "",
            ReturnLongitude: "",
            ReturnMaskedContactNumber: "",
            ReturnMobile: origin.phoneNumber,
            ReturnPincode: origin.postalCode,
            ReturnTelephone: "",
          },
          Services: {
            AWBNo: "",
            ProductCode: typeof shipping === 'string' ? shipping : (shipping?.productCode || "D"), // D = Domestic, A = Apex
            SubProductCode: isCOD ? "C" : "", // C = COD
            ProductType: 0,
            PickupDate: dateString, // Use Bluedart date format
            PickupTime: "1500", // 3:00 PM
            PieceCount: totalPieces.toString(),
            ActualWeight: totalWeight.toFixed(2), // Changed from Weight to ActualWeight
            CreditReferenceNo: order.paymentId || order._id.toString(),
            RegisterPickup: true, // Set to true if you want pickup registered
            SpecialInstruction: "",
            PackType: "",
            Commodity: {
              CommodityDetail1: order.items
                .map((i) => i.product?.name || "Product")
                .join(", ")
                .substring(0, 100),
            },
            Dimensions: Array.from({ length: totalPieces }, () => ({
              Breadth: 10,
              Count: 1,
              Height: 10,
              Length: 10,
            })),
            ECCN: "",
            PDFOutputNotRequired: false, // Set to false if you need PDF
            OTPBasedDelivery: 0, // 0 = No OTP, 1 = OTP required
            OTPCode: "",
            itemdtl: [],
            noOfDCGiven: 0,
          },
        },
        Profile: {
          LoginID: process.env.BLUEDART_LOGIN_ID || "GOH92520",
          LicenceKey:
            process.env.BLUEDART_LICENSE_KEY ||
            "nmilgqfslqloplglu2spkqfhqohf5jim",
          Api_type: "S",
        },
      };

      //consolle.log(
      //   "Bluedart waybill payload:",
      //   JSON.stringify(waybillPayload, null, 2)
      // );

      // Step 3: Generate waybill
      let waybillResp;
      //consolle?.log("Sending Bluedart waybill request...", jwtToken);
      try {
        waybillResp = await axios.post(
          "https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill",
          waybillPayload,
          {
            headers: {
              JWTToken: jwtToken,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (err) {
        //consolle.error("Bluedart waybill request failed:", err.message);
        //consolle.error("Response status:", err.response?.status);
        //consolle.error(
        //   "Response data:",
        //   JSON.stringify(err.response?.data, null, 2)
        // );

        return {
          success: false,
          message: `Bluedart waybill request failed: ${err.response?.data?.title || err.message
            }`,
          error: {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          },
          courier: "BLUEDART",
          orderId: order._id?.toString?.() || null,
        };
      }

      //consolle.log("Bluedart waybill response:", waybillResp.data);

      // Step 4: Process response
      if (!waybillResp.data?.GenerateWayBillResult) {
        throw new Error(
          `Bluedart waybill generation failed: ${waybillResp.data?.ErrorMessage || "Unknown error"
          }`
        );
      }

      const result = waybillResp.data.GenerateWayBillResult;

      if (!result.IsError && result.AWBNo) {
        const shippingDetails = {
          platform: "bluedart",
          awb_number: result.AWBNo,
          reference_number: order._id.toString(),
          tracking_url: `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${result.AWBNo}`,
          token_number: result.TokenNumber,
          destination_location: result.DestinationLocation,
          destination_area: result.DestinationArea,
          raw_response: waybillResp.data,
          created_at: new Date(),
        };

        await this.orderRepository.updateOrder(order._id, {
          shipping_details: shippingDetails,
        });

        return {
          success: true,
          message: "Bluedart waybill generated successfully",
          trackingNumber: result.AWBNo,
          tokenNumber: result.TokenNumber,
          destinationLocation: result.DestinationLocation,
          destinationArea: result.DestinationArea,
          courier: "BLUEDART",
          orderId: order._id.toString(),
          data: result,
        };
      } else {
        throw new Error(
          `Bluedart waybill generation failed: ${result.Status?.[0]?.StatusInformation || "Unknown error"
          }`
        );
      }
    } catch (error) {
      //consolle.error("Bluedart shipment creation failed:", error);

      return {
        success: false,
        message: `Bluedart shipment creation failed: ${error.message}`,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null,
        },
        courier: "BLUEDART",
        orderId: order._id.toString(),
      };
    }
  }

  /**
   * Cancel shipment - common entry
   * order: may be null if caller passes AWB in body
   * courier: string
   * body: raw request body (may contain AWBNo or other courier-specific data)
   */
  async cancelShipment(order, courier, body = {}, conn) {
    try {
      if (!courier) throw new Error("Courier is required for cancelShipment");
      switch ((courier || "").toUpperCase()) {
        case "DTDC":
          return this.cancelDtdcShipment(order, body, conn);
        case "DELHIVERY":
          return this.cancelDelhiveryShipment(order, body, conn);
        case "BLUEDART":
          return this.cancelBluedartShipment(order, body, conn);
        default:
          throw new Error("Unsupported courier for cancelShipment");
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // DTDC cancel implementation (uses DTDC public cancel endpoint)
  async cancelDtdcShipment(order, body = {}, conn) {
    try {
      // determine AWB array
      let awbs = [];
      if (Array.isArray(body.AWBNo) && body.AWBNo.length) awbs = body.AWBNo;
      else if (body.AWBNo) awbs = Array.isArray(body.AWBNo) ? body.AWBNo : [body.AWBNo];
      else if (order && order.shipping_details && order.shipping_details.reference_number)
        awbs = [order.shipping_details.reference_number];

      if (!awbs.length) {
        return { success: false, message: "No AWB number(s) provided or found on order" };
      }

      const payload = {
        AWBNo: awbs,
        customerCode: body.customerCode || process.env.DTDC_CUSTOMER_CODE || undefined,
      };

      const headers = {
        "Content-Type": "application/json",
        "api-key": process.env.DTDC_API_KEY || body["api-key"],
      };

      const res = await axios.post(
        "https://pxapi.dtdc.in/api/customer/integration/consignment/cancel",
        payload,
        { headers }
      );

      // Persist cancellation info if order present
      if (order && order._id) {
        const shipping_details = {
          ...order.shipping_details,
          cancelled: true,
          cancelled_at: new Date(),
          cancel_response: res.data,
          last_updated: new Date(),
          current_status: "Cancelled",
        };
        try {
          await this.orderRepository.updateOrder(order._id, { shipping_details });
        } catch (e) {
          // non-fatal
        }
      }

      return {
        success: true,
        message: "DTDC cancel request sent",
        data: res.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `DTDC cancel failed: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }

  // Delhivery cancel - static response for now
  async cancelDelhiveryShipment(order, body = {}, conn) {
    let tokenSource = null;
    try {
      // determine waybill: prefer explicit body.waybill, then AWBNo, then order shipping details
      let waybill = null;
      if (body.waybill) waybill = body.waybill;
      else if (body.AWBNo) waybill = Array.isArray(body.AWBNo) ? body.AWBNo[0] : body.AWBNo;
      else if (order && order.shipping_details) {
        waybill = order.shipping_details.waybill || order.shipping_details.reference_number || order.shipping_details.awb_number;
      }

      if (!waybill) {
        return { success: false, message: "No waybill provided or found on order" };
      }

      const payload = {
        waybill: waybill,
        cancellation: "true",
      };

      // Prefer explicit token provided in request body over environment token.
      // This allows clients to pass a valid tenant-specific token even when an env var exists.
      const token = body.token || body.authorization || process.env.DELHIVERY_API_TOKEN || null;
      tokenSource = body.token ? "body.token" : body.authorization ? "body.authorization" : process.env.DELHIVERY_API_TOKEN ? "env" : "none";
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Token ${token}`;

      const res = await axios.post(
        "https://track.delhivery.com/api/p/edit",
        payload,
        { headers }
      );

      // Persist cancellation info if order present
      if (order && order._id) {
        const shipping_details = {
          ...order.shipping_details,
          cancelled: true,
          cancelled_at: new Date(),
          cancel_response: res.data,
          last_updated: new Date(),
          current_status: "Cancelled",
        };
        try {
          await this.orderRepository.updateOrder(order._id, { shipping_details });
        } catch (e) {
          // non-fatal
        }
      }

      return {
        success: true,
        message: "Delhivery cancel request sent",
        data: res.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Delhivery cancel failed: ${error.message}`,
        error: error.response?.data || error.message,
        tokenSource,
        status: error.response?.status || null,
      };
    }
  }

  // Bluedart cancel - static response for now
  // async cancelBluedartShipment(order, body = {}, conn) {
  //   try {
  //     // Step 1: Generate authentication token (reuse Bluedart auth used for create)

  //     console?.log("Generating Bluedart authentication token",process.env.BLUEDART_CLIENT_SECRET , body);

  //     const clientId = process.env.BLUEDART_CLIENT_ID || body.clientId;
  //     const clientSecret = process.env.BLUEDART_CLIENT_SECRET || body.clientSecret;
   

  //     const tokenResp = await axios.get(
  //       "https://apigateway.bluedart.com/in/transportation/token/v1/login",
  //       {
  //         headers: {
  //           ClientID: clientId,
  //           clientSecret: clientSecret,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     const jwtToken = tokenResp.data?.JWTToken;
  //     if (!jwtToken) {
  //       throw new Error("Failed to obtain Bluedart JWT token");
  //     }

  //     // Step 2: Determine TokenNumber to cancel
  //     let tokenNumber = null;
  //     if (body.request && (body.request.TokenNumber || body.request.tokenNumber)) {
  //       tokenNumber = body.request.TokenNumber || body.request.tokenNumber;
  //     } else if (body.TokenNumber || body.tokenNumber) {
  //       tokenNumber = body.TokenNumber || body.tokenNumber;
  //     } else if (order && order.shipping_details) {
  //       tokenNumber = order.shipping_details.token_number || order.shipping_details.tokenNumber || null;
  //     }

  //     if (!tokenNumber) {
  //       throw new Error("Bluedart TokenNumber is required to cancel pickup");
  //     }

  //     // Build pickup date: accept provided or use current
  //     const pickupDate = body.request?.PickupRegistrationDate || `/Date(${Date.now()})/`;

  //     const payload = {
  //       request: {
  //         PickupRegistrationDate: pickupDate,
  //         Remarks: body.request?.Remarks || body.Remarks || "",
  //         TokenNumber: Number(tokenNumber),
  //       },
  //       profile: {
  //         Api_type: body.profile?.Api_type || "S",
  //         LicenceKey: body.profile?.LicenceKey || process.env.BLUEDART_LICENSE_KEY || "",
  //         LoginID: body.profile?.LoginID || process.env.BLUEDART_LOGIN_ID || "",
  //       },
  //     };

  //     const res = await axios.post(
  //       "https://apigateway.bluedart.com/in/transportation/cancel-pickup/v1",
  //       payload,
  //       {
  //         headers: {
  //           JWTToken: jwtToken,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     // Persist cancellation info if order present
  //     if (order && order._id) {
  //       const shipping_details = {
  //         ...order.shipping_details,
  //         cancelled: true,
  //         cancelled_at: new Date(),
  //         cancel_response: res.data,
  //         last_updated: new Date(),
  //         current_status: "Cancelled",
  //       };
  //       try {
  //         await this.orderRepository.updateOrder(order._id, { shipping_details });
  //       } catch (e) {
  //         // non-fatal
  //       }
  //     }

  //     return {
  //       success: true,
  //       message: "Bluedart cancel request sent",
  //       data: res.data,
  //     };
  //   } catch (error) {
  //     console?.log("error here", error);
  //     return {
  //       success: false,
  //       message: `Bluedart cancel failed: ${error.message}`,
  //       error: error.response?.data || error.message,
  //     };
  //   }
  // }


  async cancelBluedartShipment(order, body = {}, conn) {
  try {

    const clientId = process.env.BLUEDART_CLIENT_ID || body.clientId;
    const clientSecret = process.env.BLUEDART_CLIENT_SECRET || body.clientSecret;

    // 🔥 STEP 1: Get JWT Token
    const tokenResp = await axios.get(
      "https://apigateway.bluedart.com/in/transportation/token/v1/login",
      {
        headers: {
          "ClientID": clientId,
          "ClientSecret": clientSecret,
          "Accept": "application/json"
        }
      }
    );

    const jwtToken = tokenResp.data?.JWTToken;

    if (!jwtToken) {
      throw new Error("Failed to obtain Bluedart JWT token");
    }

    // 🔥 STEP 2: Extract Token Number
    let tokenNumber =
      body?.request?.TokenNumber ||
      body?.tokenNumber ||
      order?.shipping_details?.token_number ||
      order?.shipping_details?.tokenNumber;

    if (!tokenNumber) {
      throw new Error("Bluedart TokenNumber is required to cancel pickup");
    }

    // 🔥 STEP 3: Prepare Payload
    const payload = {
      request: {
        PickupRegistrationDate:
          body?.request?.PickupRegistrationDate ||
          `/Date(${Date.now()})/`,
        Remarks:
          body?.request?.Remarks ||
          body?.Remarks ||
          "",
        TokenNumber: Number(tokenNumber),
      },
      profile: {
        Api_type:
          body?.profile?.Api_type ||
          "S",
        LicenceKey:
          body?.profile?.LicenceKey ||
          process.env.BLUEDART_LICENSE_KEY,
        LoginID:
          body?.profile?.LoginID ||
          process.env.BLUEDART_LOGIN_ID,
      },
    };

    // 🔥 STEP 4: Cancel Pickup (Correct Headers)
    const res = await axios.post(
      "https://apigateway.bluedart.com/in/transportation/cancel-pickup/v1",
      JSON.stringify(payload), // force raw JSON
      {
        headers: {
          "Authorization": `Bearer ${jwtToken}`,  // ✅ CRITICAL FIX
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    return {
      success: true,
      message: "Bluedart cancel request sent",
      data: res.data,
    };

  } catch (error) {
    console.log("Bluedart cancel error:", error.response?.data || error.message);

    return {
      success: false,
      message: `Bluedart cancel failed: ${error.message}`,
      error: error.response?.data || error.message,
    };
  }
}




  // New method: Export orders to Excel
  async exportOrdersToExcel(filterConditions = { status: 'pending' }, conn) {
    try {
      const orders = await this.orderRepository.getAllOrders(filterConditions, {}, null, null, ['user'], ['_id', 'user', 'total', 'status', 'createdAt']);
      if (!orders.results || orders.results.length === 0) {
        throw new Error('No orders found to export');
      }

      // Prepare data for Excel
      const data = orders.results.map(order => ({
        OrderID: order._id.toString(),
        UserID: order.user?._id?.toString() || '',
        UserEmail: order.user?.email || '',
        Total: order.total,
        Status: order.status,
        CreatedAt: order.createdAt,
      }));

      // Create workbook and worksheet
      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Orders');

      // Generate buffer
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        success: true,
        message: 'Orders exported successfully',
        data: buffer,
        filename: `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${error.message}`,
      };
    }
  }

  // New method: Confirm orders from uploaded Excel
  async confirmOrdersFromExcel(fileBuffer, conn) {
    try {
      // Parse Excel
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new Error('Excel file is empty or invalid');
      }

      const results = [];
      for (const row of data) {
        const orderId = row.OrderID;
        if (!orderId) continue; // Skip rows without OrderID

        try {
          const order = await this.orderRepository.findById(orderId);
          if (!order) {
            results.push({ orderId, status: 'failed', reason: 'Order not found' });
            continue;
          }
          if (order.status !== 'pending') {
            results.push({ orderId, status: 'skipped', reason: 'Order not pending' });
            continue;
          }

          // Update status to confirmed
          await this.orderRepository.updateOrder(orderId, { status: 'completed' });
          results.push({ orderId, status: 'completed' });
        } catch (err) {
          results.push({ orderId, status: 'failed', reason: err.message });
        }
      }

      return {
        success: true,
        message: 'Order confirmation processed',
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        message: `Confirmation failed: ${error.message}`,
      };
    }
  }
  // New method: Create manual orders from Excel
  async createManualOrdersFromExcel(fileBuffer, conn, tenant) {
    try {
      // Parse Excel
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new Error("Excel file is empty or invalid");
      }

      const results = [];
      const userService = new UserService(conn);
      const Product = conn.models.Product || conn.model("Product", ProductSchema);
      const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
      const Shipping = conn.models.Shipping || conn.model("Shipping", ShippingSchema);

      // Fetch a default active shipping method (e.g., highest priority or first found)
      const defaultShipping = await Shipping.findOne({ status: "active" }).sort({ priority: -1 }).lean();

      for (const [index, row] of data.entries()) {
        try {
          // 1. User Handling
          const phone = row.Phone ? String(row.Phone).trim() : null;
          const email = row.Email ? String(row.Email).trim() : null;
          const name = row.Username || row.Name || "Unknown User";

          if (!phone) {
            results.push({ row: index + 1, status: "failed", reason: "Phone number is missing" });
            continue;
          }

          let user = await userService.findByPhone(phone);
          if (!user) {
            // Create new user
            const userData = {
              name,
              phone,
              email,
              tenant: tenant || null,
              role: null // Default role
            };

            try {
              user = await userService.createUser(userData);
            } catch (uErr) {
              // If create fails, check if it's due to existing email
              if (email) {
                const emailUser = await userService.findByEmail(email);
                if (emailUser) {
                  user = emailUser;
                } else {
                  throw uErr;
                }
              } else {
                throw uErr;
              }
            }
          }

          // 2. Product & Variant Handling
          const productName = row.ProductName;
          const variantName = row.VariantName || row.Variant || null;
          const quantity = parseInt(row.Quantity) || 1;
          const price = parseFloat(row.Price) || 0;

          if (!productName) {
            results.push({ row: index + 1, status: "failed", reason: "Product Name is missing" });
            continue;
          }

          console.log("Product Name:", productName);
          console.log("Connection name:", conn.name);
          console.log("Database name:", conn.db?.databaseName);

          // Find product by name (case insensitive)
          const product = await Product.findOne({
            name: { $regex: new RegExp(`^${productName}$`, "i") }
          });

          console.log("Product found:", product ? product.name : "NULL");

          if (!product) {
            results.push({ row: index + 1, status: "failed", reason: `Product '${productName}' not found` });
            continue;
          }

          let variant = null;
          let finalPrice = price || product.price;

          if (variantName) {
            // Find variant by title/sku if provided
            variant = await Variant.findOne({
              productId: product._id,
              $or: [
                { title: { $regex: new RegExp(`^${variantName}$`, "i") } },
                { sku: { $regex: new RegExp(`^${variantName}$`, "i") } }
              ]
            });

            if (variant) {
              finalPrice = price || variant.price;
            } else {
              results.push({ row: index + 1, status: "failed", reason: `Variant '${variantName}' not found for product '${productName}'` });
              continue;
            }
          }

          // 3. Order Creation
          const address = {
            fullName: name,
            addressLine1: row.AddressLine1 || "Manual Order Address",
            addressLine2: row.AddressLine2 || "",
            city: row.City || "Unknown",
            state: row.State || "Unknown",
            postalCode: row.PostalCode ? String(row.PostalCode) : "000000",
            country: row.Country || "India",
            phoneNumber: phone,
          };

          const orderPayload = {
            user: user._id,
            items: [{
              product: product._id,
              variant: variant ? variant._id : null,
              quantity,
              price: finalPrice
            }],
            total: finalPrice * quantity,
            shippingAddress: address,
            billingAddress: address,
            paymentId: row.PaymentId || `MANUAL-${Date.now()}-${index}`,
            deliveryOption: row.DeliveryOption || "standard_delivery",
            paymentMode: row.PaymentMode || "COD",
            status: "completed",
            placedAt: new Date(),
            shippingCharge: 0,
            discount: 0,
            // Auto-populate shipping method details
            shippingMethod: defaultShipping ? defaultShipping.shippingMethod : "standard",
            shippingId: defaultShipping ? defaultShipping._id : null,
            shippingName: defaultShipping ? defaultShipping.name : "Manual Shipping",
            shippingPriority: defaultShipping ? defaultShipping.priority : 0,
            shipping_details: {
              platform: null,
              reference_number: null,
              tracking_url: null,
              raw_response: null,
              labelUrl: null
            }
          };

          const newOrder = await this.orderRepository.create(orderPayload);
          results.push({ row: index + 1, status: "success", orderId: newOrder._id });

        } catch (err) {
          results.push({ row: index + 1, status: "failed", reason: err.message });
        }
      }

      return {
        success: true,
        message: "Manual orders processed",
        data: results,
      };

    } catch (error) {
      return {
        success: false,
        message: `Processing failed: ${error.message}`,
      };
    }
  }
}

export default OrderService;
