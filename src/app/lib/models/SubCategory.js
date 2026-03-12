import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({

  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  image: { type: String },
  thumbnail: { type: String },
  seoTitle: { type: String },
  seoDescription: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  sortOrder: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

  // 👇 Linking to the parent Category
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },

}, { timestamps: true });

const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;