/**
 * Meta Metrics Service - Frontend Integration
 * Usage examples for the Meta Metrics caching API
 */

const API_BASE = '/api/meta';

/**
 * Fetch aggregated metrics for a date range
 * Uses cache when available, fetches from API when needed
 */
export async function getMetrics(options = {}) {
    const {
        tenant = 'bharat',
        since = getDefaultSinceDate(),
        until = getDefaultUntilDate(),
        forceRefresh = false,
    } = options;

    const params = new URLSearchParams({
        tenant,
        since,
        until,
        ...(forceRefresh && { forceRefresh: 'true' }),
    });

    const response = await fetch(`${API_BASE}/metrics?${params}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics');
    }

    return {
        metrics: data.data.metrics,
        dateRange: data.data.dateRange,
        source: data.data.source,
        cached: data.data.cached,
        warning: data.warning,
    };
}

/**
 * Fetch daily breakdown for trend charts
 * Always uses cached data
 */
export async function getDailyMetrics(options = {}) {
    const {
        tenant = 'bharat',
        since = getDefaultSinceDate(30), // Last 30 days
        until = getYesterdayDate(),      // Exclude today
    } = options;

    const params = new URLSearchParams({ tenant, since, until });

    const response = await fetch(`${API_BASE}/metrics/daily?${params}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch daily metrics');
    }

    return {
        daily: data.data.daily,
        totals: data.data.totals,
        averages: data.data.averages,
        daysCount: data.data.daysCount,
        dateRange: data.data.dateRange,
    };
}

/**
 * Sync metrics to database (manual trigger or scheduled job)
 */
export async function syncMetrics(options = {}) {
    const {
        tenant = 'bharat',
        since,
        until,
        syncMissingOnly = true,
    } = options;

    if (!since || !until) {
        throw new Error('since and until dates are required');
    }

    const response = await fetch(`${API_BASE}/metrics/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tenant,
            since,
            until,
            syncMissingOnly,
        }),
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to sync metrics');
    }

    return {
        message: data.message,
        syncedDates: data.syncedDates,
        failedDates: data.failedDates,
        results: data.results,
    };
}

// Helper Functions

function getDefaultSinceDate(daysAgo = 7) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

function getDefaultUntilDate() {
    return new Date().toISOString().split('T')[0];
}

function getYesterdayDate() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

// =====================================
// USAGE EXAMPLES
// =====================================

/**
 * Example 1: Dashboard Overview (Fast, Cached)
 */
export async function loadDashboard() {
    try {
        // Fetch last 7 days (cached data for fast loading)
        const { metrics, source, cached } = await getMetrics({
            tenant: 'bharat',
            since: getDefaultSinceDate(7),
            until: getYesterdayDate(), // Yesterday's complete data
        });

        console.log(`Loaded from ${source} (cached: ${cached})`);

        return {
            totalSpend: metrics.spend,
            totalLeads: metrics.totalLeads,
            totalRevenue: metrics.purchaseValue,
            ROAS: metrics.ROAS,
            CPL: metrics.CPL,
            conversionRate: metrics.conversionRate,
        };
    } catch (error) {
        console.error('Dashboard loading failed:', error);
        throw error;
    }
}

/**
 * Example 2: Real-time Monitoring (Today's Data)
 */
export async function loadRealTimeMetrics() {
    try {
        // Automatically fetches from API for today's data
        const { metrics } = await getMetrics({
            tenant: 'bharat',
            since: getDefaultUntilDate(), // Today
            until: getDefaultUntilDate(), // Today
            forceRefresh: true, // Force real-time data
        });

        return {
            todaySpend: metrics.spend,
            todayLeads: metrics.totalLeads,
            todayRevenue: metrics.purchaseValue,
            currentROAS: metrics.ROAS,
        };
    } catch (error) {
        console.error('Real-time metrics failed:', error);
        throw error;
    }
}

/**
 * Example 3: Trend Chart (30-Day History)
 */
export async function loadTrendChart() {
    try {
        const { daily, totals, averages } = await getDailyMetrics({
            tenant: 'bharat',
            since: getDefaultSinceDate(30),
            until: getYesterdayDate(),
        });

        // Format for Chart.js or other charting libraries
        const chartData = {
            labels: daily.map(d => d.date),
            datasets: [
                {
                    label: 'Daily Spend',
                    data: daily.map(d => d.metrics.spend),
                },
                {
                    label: 'Daily Leads',
                    data: daily.map(d => d.metrics.totalLeads),
                },
                {
                    label: 'Daily ROAS',
                    data: daily.map(d => d.metrics.ROAS),
                },
            ],
        };

        return {
            chartData,
            totals,
            averages,
        };
    } catch (error) {
        console.error('Trend chart loading failed:', error);
        throw error;
    }
}

/**
 * Example 4: Backfill Missing Data
 */
export async function backfillHistoricalData() {
    try {
        // Sync last 90 days (only missing dates)
        const result = await syncMetrics({
            tenant: 'bharat',
            since: getDefaultSinceDate(90),
            until: getYesterdayDate(),
            syncMissingOnly: true,
        });

        console.log(result.message);
        console.log(`Synced: ${result.syncedDates}, Failed: ${result.failedDates}`);

        if (result.failedDates > 0) {
            console.warn('Some dates failed to sync:', result.results.failed);
        }

        return result;
    } catch (error) {
        console.error('Backfill failed:', error);
        throw error;
    }
}

/**
 * Example 5: Compare This Week vs Last Week
 */
export async function compareWeekOverWeek() {
    try {
        // This week (Monday to Sunday)
        const thisWeekStart = getWeekStart(0);
        const thisWeekEnd = getYesterdayDate();

        // Last week
        const lastWeekStart = getWeekStart(1);
        const lastWeekEnd = getWeekEnd(1);

        const [thisWeek, lastWeek] = await Promise.all([
            getMetrics({ since: thisWeekStart, until: thisWeekEnd }),
            getMetrics({ since: lastWeekStart, until: lastWeekEnd }),
        ]);

        const comparison = {
            spendChange: calculateChange(thisWeek.metrics.spend, lastWeek.metrics.spend),
            leadsChange: calculateChange(thisWeek.metrics.totalLeads, lastWeek.metrics.totalLeads),
            ROASChange: calculateChange(thisWeek.metrics.ROAS, lastWeek.metrics.ROAS),
        };

        return {
            thisWeek: thisWeek.metrics,
            lastWeek: lastWeek.metrics,
            comparison,
        };
    } catch (error) {
        console.error('Week-over-week comparison failed:', error);
        throw error;
    }
}

// Helper: Get week start date
function getWeekStart(weeksAgo = 0) {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) - (weeksAgo * 7);
    date.setDate(diff);
    return date.toISOString().split('T')[0];
}

// Helper: Get week end date
function getWeekEnd(weeksAgo = 0) {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + 7 - (weeksAgo * 7);
    date.setDate(diff);
    return date.toISOString().split('T')[0];
}

// Helper: Calculate percentage change
function calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(2);
}

/**
 * Example 6: React Hook for Metrics
 */
/*
import { useState, useEffect } from 'react';

export function useMetaMetrics(options) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const data = await getMetrics(options);
                setMetrics(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [options.since, options.until, options.forceRefresh]);

    return { metrics, loading, error };
}

// Usage in component:
function MetricsDashboard() {
    const { metrics, loading, error } = useMetaMetrics({
        since: '2025-11-28',
        until: '2025-12-04',
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Meta Metrics</h2>
            <p>Spend: ${metrics.metrics.spend}</p>
            <p>Leads: {metrics.metrics.totalLeads}</p>
            <p>ROAS: {metrics.metrics.ROAS}</p>
        </div>
    );
}
*/
