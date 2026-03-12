import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  mainTitle: { type: String, default: null },

  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true }, // HTML/Markdown
  metaTitle: { type: String, default: null },
  metaDescription: { type: String, default: null },
  redirectBySlug: { type: Boolean, default: false },
  isContactPage: { type: Boolean, default: false },
  contactData: {
    phone: { type: String },
    email: { type: String },
    appointmentNote: { type: String },
    contactHours: {
      monWed: { type: String },
      thuFri: { type: String },
      sat: { type: String },
    },
  },
  status: { type: String, enum: ["published", "draft"], default: "draft" },
  showInFooter: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
  deleted: { type: Boolean, default: false },
});

export const PageSchema = pageSchema;
export const PageModel =
  mongoose.models.Page || mongoose.model("Page", pageSchema);
export default PageModel;
