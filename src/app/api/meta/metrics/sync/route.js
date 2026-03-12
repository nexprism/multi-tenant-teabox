import { NextResponse } from "next/server";
import dbConnect from "@/app/connection/dbConnect";
import { getSubdomain } from "@/app/lib/tenantDb";
import { fetchMetaMetrics } from "@/app/lib/services/metaService";
import { getMetaSettings, isMetaTokenExpired } from "@/app/lib/repository/metaRepository";
import {
    saveMetaMetrics,
    getMissingDates,
} from "@/app/lib/repository/metaMetricsRepository";

/**
 * POST: Sync Meta metrics to database (manual or scheduled)
 * 
 * Body:
 *  - tenant: Tenant identifier (default: 'bharat')
 *  - since: Start date YYYY-MM-DD (required)
 *  - until: End date YYYY-MM-DD (required)
 *  - syncMissingOnly: Only sync dates not in DB (default: true)
 * 
 * This endpoint fetches data from Meta API and stores it in the database
 * for historical analysis and faster future queries.
 */
export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            tenant = getSubdomain(request) || "default",
            since,
            until,
            syncMissingOnly = true,
        } = body;

        if (!since || !until) {
            return NextResponse.json(
                { error: "since and until dates are required (YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        // Validate date format
        const sinceDate = new Date(since);
        const untilDate = new Date(until);

        if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD" },
                { status: 400 }
            );
        }

        if (sinceDate > untilDate) {
            return NextResponse.json(
                { error: "'since' date must be before or equal to 'until' date" },
                { status: 400 }
            );
        }

        // Get Meta settings
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

        // Determine which dates to sync
        let datesToSync = [];

        if (syncMissingOnly) {
            // Only sync missing dates
            datesToSync = await getMissingDates(tenant, since, until);

            if (datesToSync.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: "All dates already synced",
                    dateRange: { since, until },
                    syncedDates: 0,
                    skippedDates: 0,
                });
            }

            console.log(`📥 Syncing ${datesToSync.length} missing dates...`);
        } else {
            // Sync all dates in range (overwrite existing)
            datesToSync = [];
            const currentDate = new Date(since);
            const endDate = new Date(until);

            while (currentDate <= endDate) {
                datesToSync.push(currentDate.toISOString().split("T")[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log(`📥 Syncing ${datesToSync.length} dates (overwrite mode)...`);
        }

        // Today's date shouldn't be synced (data still changing)
        const today = new Date().toISOString().split("T")[0];
        datesToSync = datesToSync.filter(date => date !== today);

        if (datesToSync.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No dates to sync (excluding today)",
                dateRange: { since, until },
                syncedDates: 0,
                skippedDates: 1,
                note: "Today's data is excluded as it's still changing",
            });
        }

        // Fetch and save metrics for each date
        const syncResults = {
            success: [],
            failed: [],
        };

        // Note: For large date ranges, consider batching or using a job queue
        // For now, we'll process sequentially with a limit
        const MAX_DATES_PER_SYNC = 30;

        if (datesToSync.length > MAX_DATES_PER_SYNC) {
            return NextResponse.json(
                {
                    error: `Too many dates to sync (${datesToSync.length}). Maximum is ${MAX_DATES_PER_SYNC} per request. Please use smaller date ranges.`,
                },
                { status: 400 }
            );
        }

        for (const date of datesToSync) {
            try {
                console.log(`Fetching metrics for ${date}...`);

                const metricsResult = await fetchMetaMetrics(
                    adAccountId,
                    pixelId,
                    pageId || null,
                    accessToken,
                    date, // single day
                    date  // single day
                );

                if (!metricsResult.success) {
                    syncResults.failed.push({
                        date,
                        error: metricsResult.error,
                    });
                    continue;
                }

                // Save to database
                const saveResult = await saveMetaMetrics(tenant, date, metricsResult.data);

                if (saveResult.success) {
                    syncResults.success.push({
                        date,
                        metrics: metricsResult.data,
                    });
                } else {
                    syncResults.failed.push({
                        date,
                        error: saveResult.error,
                    });
                }

                // Small delay to avoid rate limiting (Meta API allows ~200 requests/hour)
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`Error syncing ${date}:`, error);
                syncResults.failed.push({
                    date,
                    error: error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncResults.success.length} of ${datesToSync.length} dates`,
            dateRange: { since, until },
            syncedDates: syncResults.success.length,
            failedDates: syncResults.failed.length,
            results: {
                success: syncResults.success.map(r => r.date),
                failed: syncResults.failed,
            },
        });

    } catch (error) {
        console.error("Error in POST /api/meta/metrics/sync:", error);
        return NextResponse.json(
            { error: "Internal server error: " + error.message },
            { status: 500 }
        );
    }
}
