import mongoose from "mongoose";
const abandonedCheckoutSchema = new mongoose.Schema({
  guestId: { type: String, required: true },
  cart: [{ type: Object }],
  startedAt: { type: Date, required: true },
  abandonedAt: { type: Date }
});
export const AbandonedCheckoutModel = mongoose.models.AbandonedCheckout || mongoose.model("AbandonedCheckout", abandonedCheckoutSchema);
export default abandonedCheckoutSchema;
