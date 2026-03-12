import mongoose from "mongoose";

/**
 * MetaMetrics Schema
 * Stores daily Meta advertising metrics for historical analysis and caching
 */
const metaMetricsSchema = new mongoose.Schema(
    {
        tenant: {
            type: String,
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        metrics: {
            // Core Metrics
            spend: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            impressions: { type: Number, default: 0 },
            ctr: { type: Number, default: 0 },
            cpc: { type: Number, default: 0 },
            cpm: { type: Number, default: 0 },

            // Conversion Metrics
            purchases: { type: Number, default: 0 },
            purchaseValue: { type: Number, default: 0 },
            totalLeads: { type: Number, default: 0 },

            // Calculated Metrics
            ROAS: { type: Number, default: 0 }, // Return on Ad Spend
            RPV: { type: Number, default: 0 },  // Revenue Per Visitor
            conversionRate: { type: Number, default: 0 },
            CPL: { type: Number, default: 0 },  // Cost Per Lead

            // Advanced Metrics
            MER: { type: Number, default: 0 },  // Marketing Efficiency Ratio
            CPP: { type: Number, default: 0 },  // Cost Per Purchase
            PCR: { type: Number, default: 0 },  // Purchase Conversion Rate
            RPI: { type: Number, default: 0 },  // Revenue Per Impression
            RPL: { type: Number, default: 0 },  // Revenue Per Lead
            CPML: { type: Number, default: 0 }, // Cost Per Thousand Leads
        },
        syncedAt: {
            type: Date,
            default: Date.now,
        },
        source: {
            type: String,
            enum: ["meta-api", "manual"],
            default: "meta-api",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries by tenant and date range
metaMetricsSchema.index({ tenant: 1, date: -1 });

// Ensure unique metrics per tenant per date
metaMetricsSchema.index({ tenant: 1, date: 1 }, { unique: true });

export const MetaMetricsSchema = metaMetricsSchema;

// Export model (will be created per-tenant DB in repository)
export default mongoose.models.MetaMetrics ||
    mongoose.model("MetaMetrics", metaMetricsSchema);
