import mongoose from "mongoose";
import slugify from "slugify";

export const shippingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight", "international", "pickup"],
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    freeShippingThreshold: {
      type: Number,
      min: 0,
      default: null,
    },
    estimatedDeliveryDays: {
      type: {
        min: Number,
        max: Number,
      },
      required: true,
    },
    supportedRegions: [
      {
        country: {
          type: String,
          required: true,
        },
        states: [String],
        postalCodes: [String],
      },
    ],
    weightLimit: {
      type: {
        min: Number,
        max: Number,
      },
      default: null,
    },
    dimensionsLimit: {
      type: {
        length: Number,
        width: Number,
        height: Number,
      },
      default: null,
    },
    carrier: {
      type: String,
      trim: true,
      default: "Blue Dart",
    },
    trackingAvailable: {
      type: Boolean,
      default: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    cod: {
      type: {
        available: Boolean,
        fee: Number,
      },
      default: { available: false, fee: 0 },
    },
    additionalCharges: {
      type: {
        fuelSurcharge: Number,
        remoteAreaSurcharge: Number,
        oversizedSurcharge: Number,
        dangerousGoodsSurcharge: Number,
      },
      default: {
        fuelSurcharge: 0,
        remoteAreaSurcharge: 0,
        oversizedSurcharge: 0,
        dangerousGoodsSurcharge: 0,
      },
    },
    customs: {
      type: {
        clearanceRequired: Boolean,
        documentation: [String],
      },
      default: { clearanceRequired: false, documentation: [] },
    },
    proofOfDelivery: {
      type: {
        available: Boolean,
        details: {
          consigneeName: String,
          deliveryDate: Date,
          signature: String,
        },
      },
      default: { available: false, details: {} },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug from name
shippingSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// Pre-update hook to update slug if name changes
shippingSchema.pre("findOneAndUpdate", function (next) {
  try {
    const update = this.getUpdate();
    if (update && update.name) {
      update.slug = slugify(update.name, { lower: true });
    }
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    if (typeof next === 'function') {
      next(error);
    }
  }
});

export const ShippingSchema = shippingSchema;
export const ShippingModel =
  mongoose.models.Shipping || mongoose.model("Shipping", shippingSchema);
export default ShippingModel;
