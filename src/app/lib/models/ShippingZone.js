import mongoose from "mongoose";

export const shippingZoneSchema = new mongoose.Schema(
  {
    shippingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },
    postalCodes: {
      type: [
        {
          code: {
            type: String,
            required: true,
            trim: true,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one postal code with price is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Remove cached model to ensure the updated schema is used
delete mongoose.models.ShippingZone;

export const ShippingZoneModel = mongoose.models.ShippingZone || mongoose.model("ShippingZone", shippingZoneSchema);
export default ShippingZoneModel;