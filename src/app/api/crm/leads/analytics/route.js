import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSubdomain, getDbConnection } from '@/app/lib/tenantDb.js';
import leadSchema from '@/app/lib/models/Lead.js';
import userSchema from '@/app/lib/models/User.js';

const getModel = (conn, name, schema) => {
    return conn.models[name] || conn.model(name, schema);
};

export async function GET(request) {
    try {
        let subdomain = getSubdomain(request);

        // Removed temporary fix for forcing subdomain to 'bharat'

        const conn = await getDbConnection(subdomain);
        const { searchParams } = new URL(request.url);

        // Date Filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const assignedTo = searchParams.get('assignedTo');

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }

        // Additional filters
        let additionalFilter = {};
        if (assignedTo) {
            // Check if assignedTo is a valid ObjectId string
            if (mongoose.Types.ObjectId.isValid(assignedTo)) {
                additionalFilter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
            } else {
                // If not a valid ObjectId, maybe it's a string match or we should ignore it/return empty
                // For now, let's keep it as string if it's not a valid ObjectId, though likely it won't match
                additionalFilter.assignedTo = assignedTo;
            }
        }

        const combinedFilter = { ...dateFilter, ...additionalFilter };

        // Debug logging
        console.log('=== LEAD ANALYTICS DEBUG ===');
        console.log('Subdomain:', subdomain);
        console.log('Database Name:', conn.name);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        console.log('Assigned To:', assignedTo);
        console.log('Combined Filter:', JSON.stringify(combinedFilter));
        console.log('===========================');

        const Lead = getModel(conn, 'Lead', leadSchema);
        const User = getModel(conn, 'User', userSchema);

        // Log the collection name being queried
        console.log('Lead Collection Name:', Lead.collection.name);
        console.log('Lead Collection DB:', Lead.collection.conn.name);

        // Verify actual count in database
        const actualDbCount = await Lead.countDocuments({});
        console.log('Actual DB Count (no filter):', actualDbCount);
        console.log('Filtered Count will use:', JSON.stringify(combinedFilter));

        // Get current date for today's filters
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Parallel queries for all metrics
        const [
            // Basic counts
            totalLeads,
            callNotAnswered,
            numberNotReachable,
            dealDone,
            callBack,
            interested,
            numberNotConnected,
            orderEnquiry,
            notInterested,
            switchOff,

            // Status-based counts
            newLeads,
            contactedLeads,
            assignedLeads,
            qualifiedLeads,
            convertedLeads,
            lostLeads,

            // Source-based counts
            leadsBySource,

            // Time-based metrics
            followupMissed,
            untouchedLeads,
            salesDoneThisMonth,
            closedLeads,
            missedCalls,
            followupForToday,
            followupDoneToday,

            // All leads for additional processing
            allLeads,

            // User assignment stats
            assignmentStats,
        ] = await Promise.all([
            // Total leads count (all leads matching filter)
            Lead.countDocuments(combinedFilter),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'call_not_answered' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'number_not_reachable' }),
            Lead.countDocuments({ ...combinedFilter, status: 'converted', converted: true }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'call_back' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'interested' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'number_not_connected' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'order_enquiry' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'not_interested' }),
            Lead.countDocuments({ ...combinedFilter, lastCallStatus: 'switch_off' }),

            // Status-based counts
            Lead.countDocuments({ ...combinedFilter, status: 'new' }),
            Lead.countDocuments({ ...combinedFilter, status: 'contacted' }),
            Lead.countDocuments({ ...combinedFilter, status: 'assigned' }),
            Lead.countDocuments({ ...combinedFilter, status: 'qualified' }),
            Lead.countDocuments({ ...combinedFilter, status: 'converted' }),
            Lead.countDocuments({ ...combinedFilter, status: 'lost' }),

            // Source breakdown
            Lead.aggregate([
                { $match: combinedFilter },
                { $group: { _id: '$source', count: { $sum: 1 } } },
            ]),

            // Time-based metrics
            Lead.countDocuments({
                ...combinedFilter,
                nextFollowUpAt: { $lt: new Date() },
                status: { $nin: ['converted', 'lost'] },
            }),
            Lead.countDocuments({
                ...combinedFilter,
                lastContactedAt: null,
                status: 'new',
            }),
            Lead.countDocuments({
                ...combinedFilter,
                status: 'converted',
                converted: true,
                createdAt: {
                    $gte: new Date(today.getFullYear(), today.getMonth(), 1),
                    $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
                },
            }),
            Lead.countDocuments({
                ...combinedFilter,
                status: 'lost',
            }),
            Lead.countDocuments({
                ...combinedFilter,
                lastCallStatus: 'missed_call',
            }),
            Lead.countDocuments({
                ...combinedFilter,
                nextFollowUpAt: { $gte: today, $lt: tomorrow },
            }),
            Lead.countDocuments({
                ...combinedFilter,
                lastContactedAt: { $gte: today, $lt: tomorrow },
            }),

            // Get all leads for conversion rate calculation
            Lead.find(combinedFilter).select('status converted expectedPrice createdAt'),

            // Assignment statistics
            Lead.aggregate([
                { $match: combinedFilter },
                {
                    $group: {
                        _id: '$assignedTo',
                        count: { $sum: 1 },
                        converted: {
                            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
                        },
                        totalValue: { $sum: '$expectedPrice' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            ]),
        ]);

        // Use the totalLeads count from the query
        const totalLeadsCount = totalLeads;

        // Debug logging for counts
        console.log('=== LEAD COUNTS DEBUG ===');
        console.log('Total Leads:', totalLeadsCount);
        console.log('New:', newLeads);
        console.log('Contacted:', contactedLeads);
        console.log('Assigned:', assignedLeads);
        console.log('Qualified:', qualifiedLeads);
        console.log('Converted:', convertedLeads);
        console.log('Lost:', lostLeads);
        console.log('Sum of statuses:', newLeads + contactedLeads + assignedLeads + qualifiedLeads + convertedLeads + lostLeads);
        console.log('========================');

        // Calculate conversion metrics
        const conversionRate = totalLeadsCount > 0
            ? ((convertedLeads / totalLeadsCount) * 100).toFixed(2)
            : 0;

        // Calculate total expected revenue
        const totalExpectedRevenue = allLeads.reduce((sum, lead) => sum + (lead.expectedPrice || 0), 0);
        const convertedRevenue = allLeads
            .filter(lead => lead.status === 'converted')
            .reduce((sum, lead) => sum + (lead.expectedPrice || 0), 0);

        // Format source breakdown
        const sourceBreakdown = {};
        if (Array.isArray(leadsBySource)) {
            leadsBySource.forEach(item => {
                sourceBreakdown[item._id || 'unknown'] = item.count;
            });
        }

        // Format assignment stats
        const topPerformers = Array.isArray(assignmentStats)
            ? assignmentStats
                .filter(stat => stat._id !== null)
                .map(stat => ({
                    userId: stat._id,
                    userName: stat.user ? `${stat.user.firstName || ''} ${stat.user.lastName || ''}`.trim() : 'Unknown',
                    totalLeads: stat.count,
                    convertedLeads: stat.converted,
                    conversionRate: stat.count > 0 ? ((stat.converted / stat.count) * 100).toFixed(2) : 0,
                    totalValue: stat.totalValue || 0,
                }))
                .sort((a, b) => b.convertedLeads - a.convertedLeads)
                .slice(0, 10)
            : [];

        // Calculate response metrics
        const responseTime = await Lead.aggregate([
            {
                $match: {
                    ...combinedFilter,
                    lastContactedAt: { $ne: null },
                },
            },
            {
                $project: {
                    responseTime: {
                        $subtract: ['$lastContactedAt', '$createdAt'],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    avgResponseTime: { $avg: '$responseTime' },
                },
            },
        ]);

        const avgResponseTimeHours = responseTime[0]?.avgResponseTime
            ? (responseTime[0].avgResponseTime / (1000 * 60 * 60)).toFixed(2)
            : 0;

        // Build response object
        const analytics = {
            // Overview metrics
            overview: {
                totalLeads: totalLeadsCount,
                newLeads,
                contactedLeads,
                assignedLeads,
                qualifiedLeads,
                convertedLeads,
                lostLeads,
                conversionRate: `${conversionRate}%`,
                avgResponseTime: `${avgResponseTimeHours} hours`,
            },

            // Call status metrics (matching your image)
            callMetrics: {
                callNotAnswered,
                numberNotReachable,
                dealDone,
                callBack,
                interested,
                numberNotConnected,
                orderEnquiry,
                notInterested,
                switchOff,
                missedCalls,
            },

            // Follow-up metrics
            followUpMetrics: {
                followupMissed,
                untouchedLeads,
                followupForToday,
                followupDoneToday,
                salesDoneThisMonth,
                closedLeads,
            },

            // Revenue metrics
            revenueMetrics: {
                totalExpectedRevenue,
                convertedRevenue,
                potentialRevenue: totalExpectedRevenue - convertedRevenue,
                averageDealSize: convertedLeads > 0 ? (convertedRevenue / convertedLeads).toFixed(2) : 0,
            },

            // Source breakdown
            sourceBreakdown,

            // Team performance
            teamPerformance: {
                topPerformers,
                totalAssigned: Array.isArray(assignmentStats)
                    ? assignmentStats.reduce((sum, stat) => sum + stat.count, 0)
                    : 0,
                unassignedLeads: totalLeadsCount - (Array.isArray(assignmentStats)
                    ? assignmentStats.reduce((sum, stat) => sum + stat.count, 0)
                    : 0),
            },

            // Status distribution
            statusDistribution: {
                new: newLeads,
                contacted: contactedLeads,
                assigned: assignedLeads,
                qualified: qualifiedLeads,
                converted: convertedLeads,
                lost: lostLeads,
            },

            // Time-based metrics
            timeMetrics: {
                today: {
                    followUps: followupForToday,
                    contacted: followupDoneToday,
                },
                thisMonth: {
                    conversions: salesDoneThisMonth,
                },
            },
        };

        return NextResponse.json({
            success: true,
            message: 'Lead analytics fetched successfully',
            data: analytics,
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching lead analytics:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            success: false,
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }, { status: 500 });
    }
}
