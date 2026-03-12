import mongoose from "mongoose";

export const shippingServiceSchema = new mongoose.Schema(
  {
    shippingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceCode: {
      type: String, // like G71, D72, etc
      required: true,
      trim: true,
    },

    carrier: {
      type: String,
      trim: true,
      default: null,
    },

    isDefaultService: {
      type: Boolean,
      default: false,
    },

    servicePriority: {
      type: Number,
      default: 0,
    },

    cost: {
      type: Number,
      min: 0,
      default: null,
    },

    estimatedDeliveryDays: {
      min: {
        type: Number,
        min: 0,
        default: null,
      },
      max: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Compound unique index to avoid duplicates per shipping method
shippingServiceSchema.index({ shippingId: 1, serviceCode: 1 }, { unique: true });

// Remove cached model to ensure the updated schema is used
delete mongoose.models.ShippingService;

export const ShippingServiceModel = mongoose.models.ShippingService || mongoose.model('ShippingService', shippingServiceSchema);
export default ShippingServiceModel;


