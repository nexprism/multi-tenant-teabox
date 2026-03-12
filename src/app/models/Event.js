import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  guestId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userInfo: { type: Object }, // Store all user info if available
  cart: [{ type: Object }],
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  searchQuery: { type: String },
  filter: { type: Object },
  sort: { type: Object },
  url: { type: String },
  timestamp: { type: Date, default: Date.now }
});
export const EventModel = mongoose.models.Event || mongoose.model("Event", eventSchema);
export default eventSchema;
