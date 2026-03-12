import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: null,
    },
    salePrice: {
      type: Number,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Category, Subcategory, Brand as references
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    searchKeywords: {
      type: [String],
      default: [],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    // Media
    images: [
      {
        url: String, // Image URL
        alt: String, // Alt text for accessibility/SEO
      },
    ], // Product gallery images
    thumbnail: {
      url: String, // Primary display image URL
      alt: String, // Alt text for thumbnail
    },
    // How To Use Section
    howToUseTitle: String,
    howToUseVideo: String, // Video URL
    howToUseSteps: [
      {
        title: String,
        description: String,
        icon: String, // optional icons
      },
    ],
    ingredients: [
      {
        name: String,
        quantity: String,
        description: String,
        image: String,
        alt: String,
      },
    ],
    benefits: [
      {
        title: String,
        description: String,
        image: String,
        alt: String,
      },
    ],
    precautions: [
      {
        title: String,
        description: String,
        image: String,
        alt: String,
      },
    ],
    targetAudience: {
      idealFor: {
        type: [String],
        default: [],
      },
      consultDoctor: {
        type: [String],
        default: [],
      },
    },
    storyVideoUrl: {
      type: String,
      default: null,
    },
    // Description Media Section
    descriptionImages: [
      {
        url: String,
        alt: String,
      },
    ],
    descriptionVideo: String,
    // Highlights / Features
    highlights: [String],
    comparison: {
      headers: {
        type: [String],
        default: [],
      },
      rows: [
        {
          title: String,
          cells: [String],
          note: String,
        },
      ],
      default: { headers: [], rows: [] },
    },
    // Ratings and Reviews
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isTopRated: {
      type: Boolean,
      default: false,
    },
    isAddon: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Attributes for variants
    attributeSet: [
      {
        attributeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attribute",
        },
      },
    ],
    // Frequently Bought Together
    frequentlyPurchased: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isFrequentlyPurchased: {
      type: Boolean,
      default: false,
    },
    custom_template: {
      type: Boolean,
      default: false,
    }, // Custom template for product page
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    // Status and Soft Delete
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictPopulate: false
  }
);

// Virtual field to populate variants
productSchema.virtual("variants", {
  ref: "Variant",
  localField: "_id",
  foreignField: "productId"
});

productSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});


productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update?.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
});

// Create a partial unique index on `slug` so soft-deleted products
// (where `deletedAt` is not null) don't block duplicate slugs.
productSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const ProductSchema = productSchema;
export const ProductModel =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default ProductModel;
