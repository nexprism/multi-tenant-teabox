import mongoose from "mongoose";

const frequentlyPurchasedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    priority: {
      type: Number,
      default: 0, // Higher priority means higher rank in the list
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Admin who added the product
    },
  },
  {
    timestamps: true,
  }
);

export const FrequentlyPurchasedProductSchema = frequentlyPurchasedProductSchema;
export const FrequentlyPurchasedProduct =
  mongoose.models.FrequentlyPurchasedProduct ||
  mongoose.model("FrequentlyPurchasedProduct", frequentlyPurchasedProductSchema);
export default FrequentlyPurchasedProduct;