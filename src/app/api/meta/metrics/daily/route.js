import { NextResponse } from "next/server";
import dbConnect from "@/app/connection/dbConnect";
import { getMetaMetrics } from "@/app/lib/repository/metaMetricsRepository";
import { getSubdomain } from "@/app/lib/tenantDb";

/**
 * GET: Fetch daily breakdown of Meta metrics
 * 
 * Query params:
 *  - tenant: Tenant identifier (default: 'bharat')
 *  - since: Start date YYYY-MM-DD (default: 7 days ago)
 *  - until: End date YYYY-MM-DD (default: yesterday)
 * 
 * Returns day-by-day metrics for trend analysis
 */
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const tenant = searchParams.get("tenant") || getSubdomain(request);

        // Default: last 7 days (excluding today)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const until = searchParams.get("until") || yesterday;

        const since = searchParams.get("since") ||
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Fetch daily metrics from database
        const result = await getMetaMetrics(tenant, since, until);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Format response with daily breakdown
        const dailyMetrics = result.data.map(item => ({
            date: item.date.toISOString().split("T")[0],
            metrics: item.metrics,
            syncedAt: item.syncedAt,
        }));

        // Calculate totals and averages
        const totals = {
            spend: 0,
            clicks: 0,
            impressions: 0,
            purchases: 0,
            purchaseValue: 0,
            totalLeads: 0,
        };

        dailyMetrics.forEach(day => {
            totals.spend += day.metrics.spend || 0;
            totals.clicks += day.metrics.clicks || 0;
            totals.impressions += day.metrics.impressions || 0;
            totals.purchases += day.metrics.purchases || 0;
            totals.purchaseValue += day.metrics.purchaseValue || 0;
            totals.totalLeads += day.metrics.totalLeads || 0;
        });

        const daysCount = dailyMetrics.length;

        return NextResponse.json({
            success: true,
            data: {
                dateRange: { since, until },
                daysCount,
                daily: dailyMetrics,
                totals,
                averages: {
                    dailySpend: daysCount > 0 ? totals.spend / daysCount : 0,
                    dailyClicks: daysCount > 0 ? totals.clicks / daysCount : 0,
                    dailyLeads: daysCount > 0 ? totals.totalLeads / daysCount : 0,
                    dailyRevenue: daysCount > 0 ? totals.purchaseValue / daysCount : 0,
                },
            },
        });

    } catch (error) {
        console.error("Error in GET /api/meta/metrics/daily:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
