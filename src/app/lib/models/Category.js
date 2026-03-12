import mongoose from "mongoose";

let Category;
let categorySchema;

try {
  if (mongoose && mongoose.Schema) {
    categorySchema = new mongoose.Schema(
      {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String },
        image: { type: String },
        thumbnail: { type: String },
        seoTitle: { type: String },
        seoDescription: { type: String },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        sortOrder: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        allowPrepaidOnly: { type: Boolean, default: false }, // Only prepaid allowed
        disableCOD: { type: Boolean, default: false }, // Disable COD for this category
      },
      { timestamps: true }
    );
    Category =
      mongoose.models?.Category || mongoose.model("Category", categorySchema);
  } else {
    console.warn("Category model loaded without Mongoose (likely client-side).");
    Category = {};
    categorySchema = {};
  }
} catch (error) {
  console.error("Failed to initialize Category model:", error);
  Category = {};
  categorySchema = {};
}

export { categorySchema };

export default Category;
