import { NextResponse } from "next/server";
import dbConnect from "@/app/connection/dbConnect";
import { getSubdomain } from "@/app/lib/tenantDb";
import { fetchMetaMetrics } from "@/app/lib/services/metaService";
import { getMetaSettings, isMetaTokenExpired } from "@/app/lib/repository/metaRepository";
import {
    getAggregatedMetrics,
    saveMetaMetrics,
    getMissingDates,
} from "@/app/lib/repository/metaMetricsRepository";

/**
 * GET: Fetch Meta metrics for configured account
 * HYBRID APPROACH: Uses cached DB data + real-time API
 * 
 * Query params:
 *  - tenant: Tenant identifier (default: 'bharat')
 *  - since: Start date YYYY-MM-DD (default: 7 days ago)
 *  - until: End date YYYY-MM-DD (default: today)
 *  - forceRefresh: Force fetch from API (default: false)
 */
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const tenant = searchParams.get("tenant") || getSubdomain(request);
        const forceRefresh = searchParams.get("forceRefresh") === "true";

        // Default date range: last 7 days
        const until = searchParams.get("until") ||
            new Date().toISOString().split("T")[0];

        const since = searchParams.get("since") ||
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Get Meta settings from database
        const settingsResult = await getMetaSettings(tenant);

        if (!settingsResult.success) {
            return NextResponse.json(
                { error: "Meta integration not configured" },
                { status: 404 }
            );
        }

        const { adAccountId, pixelId, pageId, accessToken, isConnected } = settingsResult.data;

        if (!isConnected || !accessToken) {
            return NextResponse.json(
                { error: "Meta integration is not connected" },
                { status: 400 }
            );
        }

        // Check if token is expired
        const tokenExpired = await isMetaTokenExpired(tenant);
        if (tokenExpired) {
            return NextResponse.json(
                {
                    error: "Access token has expired. Please reconnect your Meta account.",
                    code: "TOKEN_EXPIRED",
                },
                { status: 401 }
            );
        }

        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // HYBRID STRATEGY:
        // 1. If forceRefresh=true OR requesting today's data -> fetch from API
        // 2. Otherwise, try to get aggregated data from DB first
        // 3. If missing dates found, fetch those from API and cache them

        if (forceRefresh || until === today) {
            // Real-time fetch from Meta API
            console.log("📡 Fetching real-time data from Meta API...");

            const metricsResult = await fetchMetaMetrics(
                adAccountId,
                pixelId,
                pageId || null,
                accessToken,
                since,
                until
            );

            if (!metricsResult.success) {
                return NextResponse.json(
                    { error: "Failed to fetch metrics: " + metricsResult.error },
                    { status: 400 }
                );
            }

            // Cache the data if it's yesterday or older (today's data is still changing)
            if (until !== today && until <= yesterday) {
                console.log(`💾 Caching metrics for ${until}...`);
                await saveMetaMetrics(tenant, until, metricsResult.data);
            }

            return NextResponse.json({
                success: true,
                data: {
                    dateRange: { since, until },
                    metrics: metricsResult.data,
                    source: "real-time",
                    cached: false,
                },
            });
        }

        // Try to get cached aggregated data
        console.log("🗄️ Checking database cache...");
        const cachedResult = await getAggregatedMetrics(tenant, since, until);

        if (cachedResult.success && cachedResult.data) {
            console.log(`✅ Found cached data (${cachedResult.daysCount} days)`);

            // Check for missing dates
            const missingDates = await getMissingDates(tenant, since, until);

            if (missingDates.length === 0) {
                // Complete cache hit
                return NextResponse.json({
                    success: true,
                    data: {
                        dateRange: { since, until },
                        metrics: cachedResult.data,
                        source: "cache",
                        cached: true,
                        daysCount: cachedResult.daysCount,
                    },
                });
            }

            console.log(`⚠️ Missing ${missingDates.length} dates`);

            // If ANY dates are missing, fetch from Meta API directly
            // This ensures complete data instead of partial cache
            console.log(`📡 Fetching complete data from Meta API (cache incomplete)...`);

            const metricsResult = await fetchMetaMetrics(
                adAccountId,
                pixelId,
                pageId || null,
                accessToken,
                since,
                until
            );

            if (!metricsResult.success) {
                return NextResponse.json(
                    { error: "Failed to fetch metrics: " + metricsResult.error },
                    { status: 400 }
                );
            }

            // Cache the data (for completed days only)
            if (until !== today) {
                console.log(`💾 Caching metrics for ${until}...`);
                await saveMetaMetrics(tenant, until, metricsResult.data);
            }

            return NextResponse.json({
                success: true,
                data: {
                    dateRange: { since, until },
                    metrics: metricsResult.data,
                    source: "live-api",
                    cached: false,
                    hadMissingDates: missingDates.length,
                },
                message: `Fetched from Meta API because ${missingDates.length} dates were missing in cache.`,
            });
        }

        // No cache available, fetch from API
        console.log("📡 No cache found, fetching from Meta API...");
        const metricsResult = await fetchMetaMetrics(
            adAccountId,
            pixelId,
            pageId || null,
            accessToken,
            since,
            until
        );

        if (!metricsResult.success) {
            return NextResponse.json(
                { error: "Failed to fetch metrics: " + metricsResult.error },
                { status: 400 }
            );
        }

        // Cache the data (for completed days only)
        if (until !== today) {
            console.log(`💾 Caching metrics for date range ${since} to ${until}...`);
            await saveMetaMetrics(tenant, until, metricsResult.data);
        }

        return NextResponse.json({
            success: true,
            data: {
                dateRange: { since, until },
                metrics: metricsResult.data,
                source: "real-time",
                cached: false,
            },
        });

    } catch (error) {
        console.error("Error in GET /api/meta/metrics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
