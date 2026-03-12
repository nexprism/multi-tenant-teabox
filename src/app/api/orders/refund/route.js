import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { NextResponse } from 'next/server';
import { verifyTokenAndUser } from '../../../middleware/commonAuth';
import { OrderSchema } from '../../../lib/models/Order';
import roleSchema from '../../../lib/models/role';

// GET - Get all return requests
export async function GET(request) {
    try {
        // Authenticate user
        const authResult = await verifyTokenAndUser(request);
        if (authResult.error) return authResult.error;

        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            return NextResponse.json(
                { success: false, message: 'DB not found' },
                { status: 404 }
            );
        }

        // Check if user is admin
        const user = authResult.user;
        let isAdmin = false;

        if (user.isSuperAdmin) {
            isAdmin = true;
        } else if (user.role) {
            const RoleModel = conn.models.Role || conn.model('Role', roleSchema);
            const roleDoc = await RoleModel.findById(user.role).lean();
            if (roleDoc && (roleDoc.name === 'admin' || roleDoc.slug === 'admin')) {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const OrderModel = conn.models.Order || conn.model('Order', OrderSchema);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';

        let query = { 'return_details.is_return_requested': true };

        if (status !== 'all') {
            query['return_details.return_status'] = status;
        }

        const returnRequests = await OrderModel.find(query)
            .populate('user', 'name email phone')
            .populate('return_details.return_approved_by', 'name email')
            .populate('return_details.refund_initiated_by', 'name email')
            .sort({ 'return_details.return_requested_at': -1 })
            .lean();

        // Calculate days remaining for each request
        const requestsWithDeadline = returnRequests.map(order => {
            if (order.return_details?.refund_deadline) {
                const deadline = new Date(order.return_details.refund_deadline);
                const now = new Date();
                const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                order.return_details.days_remaining = daysRemaining;
            }
            return order;
        });

        return NextResponse.json(
            {
                success: true,
                data: requestsWithDeadline,
                count: requestsWithDeadline.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get return requests error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}

// POST - Approve/Reject return request
export async function POST(request) {
    try {
        // Authenticate user
        const authResult = await verifyTokenAndUser(request);
        if (authResult.error) return authResult.error;

        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            return NextResponse.json(
                { success: false, message: 'DB not found' },
                { status: 404 }
            );
        }

        // Check if user is admin
        const user = authResult.user;
        let isAdmin = false;

        if (user.isSuperAdmin) {
            isAdmin = true;
        } else if (user.role) {
            const RoleModel = conn.models.Role || conn.model('Role', roleSchema);
            const roleDoc = await RoleModel.findById(user.role).lean();
            if (roleDoc && (roleDoc.name === 'admin' || roleDoc.slug === 'admin')) {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { orderId, action, refund_amount, refund_notes } = body;

        if (!orderId || !action) {
            return NextResponse.json(
                { success: false, message: 'Order ID and action are required' },
                { status: 400 }
            );
        }

        const OrderModel = conn.models.Order || conn.model('Order', OrderSchema);
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        if (action === 'approve') {
            // Calculate refund deadline (7 days from approval)
            const refundDeadline = new Date();
            refundDeadline.setDate(refundDeadline.getDate() + 7);

            order.return_details.return_status = 'approved';
            order.return_details.return_approved_at = new Date();
            order.return_details.return_approved_by = user._id;
            order.return_details.refund_status = 'pending';
            order.return_details.refund_amount = refund_amount || order.total;
            order.return_details.refund_deadline = refundDeadline;
            order.return_details.refund_notes = refund_notes || null;
            order.status = 'returned';

            await order.save();

            return NextResponse.json(
                {
                    success: true,
                    message: `Return approved. Refund of ₹${order.return_details.refund_amount} must be processed within 7 days.`,
                    data: order,
                    refund_deadline: refundDeadline,
                },
                { status: 200 }
            );
        } else if (action === 'reject') {
            order.return_details.return_status = 'rejected';
            order.return_details.return_approved_at = new Date();
            order.return_details.return_approved_by = user._id;
            order.return_details.refund_notes = refund_notes || null;
            order.status = 'completed'; // Revert to completed

            await order.save();

            return NextResponse.json(
                {
                    success: true,
                    message: 'Return request rejected',
                    data: order,
                },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid action. Use "approve" or "reject"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Process return request error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}

// PUT - Process refund (mark as completed)
export async function PUT(request) {
    try {
        // Authenticate user
        const authResult = await verifyTokenAndUser(request);
        if (authResult.error) return authResult.error;

        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            return NextResponse.json(
                { success: false, message: 'DB not found' },
                { status: 404 }
            );
        }

        // Check if user is admin
        const user = authResult.user;
        let isAdmin = false;

        if (user.isSuperAdmin) {
            isAdmin = true;
        } else if (user.role) {
            const RoleModel = conn.models.Role || conn.model('Role', roleSchema);
            const roleDoc = await RoleModel.findById(user.role).lean();
            if (roleDoc && (roleDoc.name === 'admin' || roleDoc.slug === 'admin')) {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { orderId, refund_transaction_id, refund_method, refund_notes } = body;

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        const OrderModel = conn.models.Order || conn.model('Order', OrderSchema);
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.return_details?.return_status !== 'approved') {
            return NextResponse.json(
                { success: false, message: 'Return must be approved before processing refund' },
                { status: 400 }
            );
        }

        // Mark refund as processing first
        order.return_details.refund_status = 'processing';
        order.return_details.refund_initiated_at = new Date();
        order.return_details.refund_initiated_by = user._id;

        if (refund_method) {
            order.return_details.refund_method = refund_method;
        }

        if (refund_transaction_id) {
            order.return_details.refund_transaction_id = refund_transaction_id;
            // If transaction ID is provided, mark as completed
            order.return_details.refund_status = 'completed';
            order.return_details.refund_completed_at = new Date();
            order.return_details.return_status = 'completed';
            order.status = 'refunded';
        }

        if (refund_notes) {
            order.return_details.refund_notes = refund_notes;
        }

        await order.save();

        const message = refund_transaction_id
            ? 'Refund processed successfully'
            : 'Refund initiated. Please complete the transaction and update with transaction ID';

        return NextResponse.json(
            {
                success: true,
                message,
                data: order,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Process refund error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
