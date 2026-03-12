import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    prepaidDiscount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled", "return_requested", "returned", "refunded", "confirmed"], // Added "confirmed"
      default: "pending",
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    deliveryOption: {
      type: String,
      enum: ["standard_delivery", "express_delivery", "overnight_delivery"],
      required: true,
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    gstRate: { type: Number, default: 0 },
    paymentGatewayRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    paymentGatewayAmount: { type: Number, default: 0 },
    // URL to the generated invoice HTML (stored after invoice is created)
    invoiceUrl: { type: String, default: null },
    paymentMode: {
      type: String,
      enum: ["COD", "Prepaid"],
      required: true,
    },
    codBlockedReason: {
      type: String,
      default: null,
    },
    shippingMethod: {
      type: String,
      required: false,
    },
    shippingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: false,
    },
    shippingName: {
      type: String,
      required: false,
    },
    shippingPriority: {
      type: Number,
      required: false,
      default: 0,
    },
    isShipmentBooked: {
      type: Boolean,
      default: false,
    },
    shipping_details: {
      platform: { type: String, enum: ['dtdc', 'delhivery', 'bluedart', null], default: null },
      reference_number: { type: String, default: null }, // e.g., AWB, order_ref, consignment_no
      tracking_url: { type: String, default: null },
      raw_response: { type: Object, default: null }, // Store full API response safely
      labelUrl: { type: String, default: null },
      status_history: { type: Array, default: [] }, // Array of status updates
      current_status: { type: String, default: null }, // Latest status
      normalized_status: {
        type: String,
        enum: [
          "BOOKED",
          "PICKED_UP",
          "PICKUP_FAILED",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "RTO_IN_TRANSIT",
          "RTO_DELIVERED",
          "CANCELLED",
          "UNKNOWN",
        ],
        default: "UNKNOWN",
      },
      last_updated: { type: Date, default: Date.now },
      cancelled: { type: Boolean, default: false },
      cancelled_at: { type: Date, default: null },
      cancel_response: { type: Object, default: null }, // Store cancellation API response
    },

    // Return & Refund Management
    return_details: {
      is_return_requested: { type: Boolean, default: false },
      return_status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'received', 'completed'],
        default: 'none'
      },
      return_reason: { type: String, default: null },
      return_comments: { type: String, default: null },
      return_requested_at: { type: Date, default: null },
      return_approved_at: { type: Date, default: null },
      return_approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      return_received_at: { type: Date, default: null },
      return_images: [{ type: String }], // URLs to uploaded images

      // Refund Information
      refund_status: {
        type: String,
        enum: ['none', 'pending', 'processing', 'completed', 'failed'],
        default: 'none'
      },
      refund_amount: { type: Number, default: 0 },
      refund_method: {
        type: String,
        enum: ['original_payment', 'bank_transfer', 'wallet', 'store_credit'],
        default: 'original_payment'
      },
      refund_initiated_at: { type: Date, default: null },
      refund_initiated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      refund_completed_at: { type: Date, default: null },
      refund_transaction_id: { type: String, default: null },
      refund_notes: { type: String, default: null },

      // Bank Details for Manual Refund (if needed)
      bank_details: {
        account_holder_name: { type: String, default: null },
        account_number: { type: String, default: null },
        ifsc_code: { type: String, default: null },
        bank_name: { type: String, default: null },
        upi_id: { type: String, default: null },
      },

      // Timeline tracking
      refund_deadline: { type: Date, default: null }, // 7 days from return approval
      days_remaining: { type: Number, default: null },
    }
  },
  {
    timestamps: true,
  }
);

export const OrderSchema = orderSchema;
export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export default OrderModel;
