import mongoose from "mongoose";
import slugify from "slugify";

const attributeSchema = new mongoose.Schema(
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
    description: String,
    values: [String],
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
  }
);

attributeSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
});

// Create a partial unique index on name that only applies when deletedAt is null
// This allows reusing names of soft-deleted attributes
attributeSchema.index(
  { name: 1 },
  { 
    unique: true,
    partialFilterExpression: { deletedAt: null },
    name: 'name_unique_when_not_deleted'
  }
);

const Attribute =
  mongoose.models.Attribute || mongoose.model("Attribute", attributeSchema);
export default Attribute;
export { attributeSchema };
