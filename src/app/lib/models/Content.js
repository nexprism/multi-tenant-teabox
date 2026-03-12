import mongoose from "mongoose";

const homepageSectionSchema = new mongoose.Schema(
  {
    sectionType: {
      type: String,
      required: true,
      enum: [
        "hero",
        "categoryPick",
        "offerBanner",
        "productSlider",
        "whyUs",
        "uniqueSellingPoints",
        "secondaryBanner",
        "promoBanner",
        "testimonial",
        "blogs",
        "faq",
        "genuineHeartStory",
        "noConfusion",
        "3V",
      ],
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    content: mongoose.Schema.Types.Mixed, // Flexible content structure
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "homepageSections",
  }
);

// Index for better query performance
homepageSectionSchema.index({ sectionType: 1, order: 1 });
homepageSectionSchema.index({ isVisible: 1 });

export default homepageSectionSchema;
