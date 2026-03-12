import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    // timestamp for the first reminder sent (used to schedule the second reminder)
    firstReminderSentAt: {
      type: Date,
      default: null,
    },
    // timestamp for the second reminder sent (one week after first)
    secondReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

export const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userIsGest: {
      type: Boolean,
      default: false,
    },
    userIsGestId: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      required: false,
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      default: 0,
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
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "converted", "abandoned"],
      default: "active",
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
