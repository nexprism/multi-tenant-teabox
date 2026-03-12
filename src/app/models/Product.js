import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String },
  images: [
    {
      url: { type: String },
      alt: { type: String },
    },
  ],
  price: { type: Number, required: true },
  salePrice: { type: Number },
  stock: { type: Number, default: 0 },
  category: { type: ObjectId, ref: "Category" },
  subcategory: { type: ObjectId, ref: "Subcategory" },
  brand: { type: ObjectId, ref: "Brand" },
  attributes: [
    {
      attributeId: { type: ObjectId, ref: "Attribute" },
      value: { type: String },
    },
  ],
  variants: [
    {
      type: ObjectId,
      ref: "Variant",
    },
  ],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // New metrics fields
  views: { type: Number, default: 0 },
  cartCount: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  searchAppearances: { type: Number, default: 0 },
  clickThrough: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  lastPurchasedAt: { type: Date },
  abandonedCount: { type: Number, default: 0 },
    // Comparison table data: headers and rows for dynamic comparison table
    comparison: {
      headers: [{ type: String }],
      rows: [
        {
          title: { type: String },
          // cells correspond to headers order
          cells: [{ type: String }],
          note: { type: String, default: "" },
          whyExcels: { type: String, default: "" }, // Dynamic "Why [Product] Excels" text
        },
      ],
    },
}, { 
  strict: false, // Allow fields not explicitly in schema
  minimize: false // Don't remove empty objects/arrays
});

export const ProductSchema = productSchema;
export default productSchema;
