import mongoose from "mongoose";

const categoryPaymentSettingSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    allowPrepaidOnly: { type: Boolean, default: false },
    disableCOD: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema(
  {
    tenant: { type: String, required: true, index: true }, // subdomain or tenant id
    activeHomepageLayout: {
      type: String,
      required: true,
      enum: ["Modern & Detailed UI", "Minimal & Organic UI"],
      default: "Modern & Detailed UI",
    },
    codLimit: { type: Number, default: 1500 },
    freeShippingThreshold: { type: Number, default: 500 },
    codShippingChargeBelowThreshold: { type: Number, default: 80 },
    prepaidShippingChargeBelowThreshold: { type: Number, default: 40 },
    repeatOrderRestrictionDays: { type: Number, default: 10 },
    codOtpRequired: { type: Boolean, default: true },
    codDisableForHighRTO: { type: Boolean, default: true },
    codBlockOnRTOAddress: { type: Boolean, default: true },
    highRTOOrderCount: { type: Number, default: 3 },
    codAllowed: { type: Boolean, default: true }, // New field to allow/disallow COD globally
    gstCharge: { type: Number, default: 0 },
    paymentGatewayCharge: { type: Number, default: 0 },
    
    // Prepaid Discount Settings
    prepaidDiscountEnabled: { type: Boolean, default: false },
    prepaidDiscountType: { 
      type: String, 
      enum: ["percentage", "amount"], 
      default: "percentage" 
    },
    prepaidDiscountValue: { type: Number, default: 0 }, // Percentage (e.g., 20 for 20%) or fixed amount
    
    categoryPaymentSettings: [categoryPaymentSettingSchema],

    // Meta (Facebook) CRM/Ads Integration
    metaIntegration: {
      adAccountId: { type: String, default: null }, // e.g., "123456789"
      pixelId: { type: String, default: null }, // e.g., "987654321"
      pageId: { type: String, default: null }, // Facebook Page ID for lead forms
      accessToken: { type: String, default: null }, // Long-lived user access token
      appId: { type: String, default: null }, // Meta App ID
      appSecret: { type: String, default: null }, // Meta App Secret
      isConnected: { type: Boolean, default: false },
      connectedAt: { type: Date, default: null },
      tokenExpiresAt: { type: Date, default: null }, // Track token expiration
    },
  },
  { timestamps: true }
);

export const SettingSchema = settingSchema;
export const SettingModel =
  mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export default SettingModel;
