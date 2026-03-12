import { MetaMetricsSchema } from "../models/MetaMetrics.js";
import { getDbConnection } from "@/app/lib/tenantDb";

/**
 * MetaMetrics Repository
 * Handles database operations for storing and retrieving Meta metrics
 */

/**
 * Save or update metrics for a specific date
 * @param {string} tenant - Tenant identifier
 * @param {Date|string} date - Date for the metrics (YYYY-MM-DD or Date object)
 * @param {Object} metrics - Metrics data
 * @returns {Promise<Object>} Saved metrics
 */
export async function saveMetaMetrics(tenant, date, metrics) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        // Normalize date to start of day (UTC)
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const result = await MetaMetricsModel.findOneAndUpdate(
            {
                tenant,
                date: normalizedDate,
            },
            {
                $set: {
                    tenant,
                    date: normalizedDate,
                    metrics,
                    syncedAt: new Date(),
                    source: "meta-api",
                },
            },
            {
                new: true,
                upsert: true,
            }
        );

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error saving Meta metrics:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Get metrics for a specific date range
 * @param {string} tenant - Tenant identifier
 * @param {string} since - Start date (YYYY-MM-DD)
 * @param {string} until - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Metrics data grouped by date
 */
export async function getMetaMetrics(tenant, since, until) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        const sinceDate = new Date(since);
        sinceDate.setUTCHours(0, 0, 0, 0);

        const untilDate = new Date(until);
        untilDate.setUTCHours(23, 59, 59, 999);

        const metrics = await MetaMetricsModel.find({
            tenant,
            date: {
                $gte: sinceDate,
                $lte: untilDate,
            },
        })
            .sort({ date: 1 })
            .lean();

        return {
            success: true,
            data: metrics,
        };
    } catch (error) {
        console.error("Error fetching Meta metrics:", error);
        return {
            success: false,
            error: error.message,
            data: [],
        };
    }
}

/**
 * Get aggregated metrics for a date range
 * @param {string} tenant - Tenant identifier
 * @param {string} since - Start date (YYYY-MM-DD)
 * @param {string} until - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Aggregated metrics
 */
export async function getAggregatedMetrics(tenant, since, until) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        const sinceDate = new Date(since);
        sinceDate.setUTCHours(0, 0, 0, 0);

        const untilDate = new Date(until);
        untilDate.setUTCHours(23, 59, 59, 999);

        const result = await MetaMetricsModel.aggregate([
            {
                $match: {
                    tenant,
                    date: {
                        $gte: sinceDate,
                        $lte: untilDate,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSpend: { $sum: "$metrics.spend" },
                    totalClicks: { $sum: "$metrics.clicks" },
                    totalImpressions: { $sum: "$metrics.impressions" },
                    totalPurchases: { $sum: "$metrics.purchases" },
                    totalPurchaseValue: { $sum: "$metrics.purchaseValue" },
                    totalLeads: { $sum: "$metrics.totalLeads" },
                    avgCTR: { $avg: "$metrics.ctr" },
                    avgCPC: { $avg: "$metrics.cpc" },
                    avgCPM: { $avg: "$metrics.cpm" },
                    avgROAS: { $avg: "$metrics.ROAS" },
                    avgCPL: { $avg: "$metrics.CPL" },
                    daysCount: { $sum: 1 },
                },
            },
        ]);

        if (result.length === 0) {
            return {
                success: true,
                data: null,
                cached: false,
            };
        }

        const aggregated = result[0];

        // Calculate overall metrics
        const spend = aggregated.totalSpend || 0;
        const clicks = aggregated.totalClicks || 0;
        const impressions = aggregated.totalImpressions || 0;
        const purchases = aggregated.totalPurchases || 0;
        const purchaseValue = aggregated.totalPurchaseValue || 0;
        const totalLeads = aggregated.totalLeads || 0;

        const metrics = {
            spend,
            clicks,
            impressions,
            ctr: clicks > 0 && impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
            purchases,
            purchaseValue,
            totalLeads,
            ROAS: spend > 0 ? purchaseValue / spend : 0,
            RPV: clicks > 0 ? purchaseValue / clicks : 0,
            conversionRate: clicks > 0 ? (totalLeads / clicks) * 100 : 0,
            CPL: totalLeads > 0 ? spend / totalLeads : 0,
            MER: spend > 0 ? purchaseValue / spend : 0,
            CPP: purchases > 0 ? spend / purchases : 0,
            PCR: clicks > 0 ? (purchases / clicks) * 100 : 0,
            RPI: impressions > 0 ? purchaseValue / impressions : 0,
            RPL: totalLeads > 0 ? purchaseValue / totalLeads : 0,
            CPML: totalLeads > 0 ? spend / (totalLeads / 1000) : 0,
        };

        return {
            success: true,
            data: metrics,
            cached: true,
            daysCount: aggregated.daysCount,
        };
    } catch (error) {
        console.error("Error aggregating Meta metrics:", error);
        return {
            success: false,
            error: error.message,
            data: null,
            cached: false,
        };
    }
}

/**
 * Check if metrics exist for a specific date
 * @param {string} tenant - Tenant identifier
 * @param {Date|string} date - Date to check
 * @returns {Promise<boolean>} True if metrics exist
 */
export async function hasMetricsForDate(tenant, date) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const count = await MetaMetricsModel.countDocuments({
            tenant,
            date: normalizedDate,
        });

        return count > 0;
    } catch (error) {
        console.error("Error checking metrics existence:", error);
        return false;
    }
}

/**
 * Get missing dates in a date range
 * @param {string} tenant - Tenant identifier
 * @param {string} since - Start date (YYYY-MM-DD)
 * @param {string} until - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of missing dates
 */
export async function getMissingDates(tenant, since, until) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        // Get all dates with metrics
        const existingMetrics = await MetaMetricsModel.find(
            {
                tenant,
                date: {
                    $gte: new Date(since),
                    $lte: new Date(until),
                },
            },
            { date: 1 }
        ).lean();

        const existingDates = new Set(
            existingMetrics.map((m) => m.date.toISOString().split("T")[0])
        );

        // Generate all dates in range
        const allDates = [];
        const currentDate = new Date(since);
        const endDate = new Date(until);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split("T")[0];
            if (!existingDates.has(dateStr)) {
                allDates.push(dateStr);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return allDates;
    } catch (error) {
        console.error("Error getting missing dates:", error);
        return [];
    }
}

/**
 * Delete metrics for a specific date range (for re-syncing)
 * @param {string} tenant - Tenant identifier
 * @param {string} since - Start date (YYYY-MM-DD)
 * @param {string} until - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteMetricsInRange(tenant, since, until) {
    try {
        const conn = await getDbConnection(tenant);
        const MetaMetricsModel =
            conn.models.MetaMetrics ||
            conn.model("MetaMetrics", MetaMetricsSchema);

        const result = await MetaMetricsModel.deleteMany({
            tenant,
            date: {
                $gte: new Date(since),
                $lte: new Date(until),
            },
        });

        return {
            success: true,
            deletedCount: result.deletedCount,
        };
    } catch (error) {
        console.error("Error deleting metrics:", error);
        return {
            success: false,
            error: error.message,
            deletedCount: 0,
        };
    }
}
