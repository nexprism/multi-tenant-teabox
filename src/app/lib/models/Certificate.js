import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    // store uploaded file path (public URL returned by saveFile)
    file: { type: String },
    // optional reference to category (if certificates belong to categories)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    deletedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const CertificateSchema = certificateSchema;

const CertificateModel =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", certificateSchema);

export default CertificateModel;
