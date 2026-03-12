import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { NextResponse } from 'next/server';
import { verifyTokenAndUser } from '../../../middleware/commonAuth';
import { OrderSchema } from '../../../lib/models/Order';

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

        const body = await request.json();
        const { orderId, return_reason, return_comments, return_images, bank_details } = body;

        if (!orderId || !return_reason) {
            return NextResponse.json(
                { success: false, message: 'Order ID and return reason are required' },
                { status: 400 }
            );
        }

        const OrderModel = conn.models.Order || conn.model('Order', OrderSchema);

        // Find the order
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify the order belongs to the user
        if (order.user.toString() !== authResult.user._id.toString()) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access to this order' },
                { status: 403 }
            );
        }

        // Check if order is eligible for return (must be completed or shipped)
        if (!['completed', 'shipped'].includes(order.status)) {
            return NextResponse.json(
                { success: false, message: 'Order is not eligible for return' },
                { status: 400 }
            );
        }

        // Check if return already requested
        if (order.return_details?.is_return_requested) {
            return NextResponse.json(
                { success: false, message: 'Return already requested for this order' },
                { status: 400 }
            );
        }

        // Update order with return request
        order.status = 'return_requested';
        order.return_details = {
            is_return_requested: true,
            return_status: 'requested',
            return_reason,
            return_comments: return_comments || null,
            return_requested_at: new Date(),
            return_images: return_images || [],
            bank_details: bank_details || {},
            refund_status: 'none',
            refund_amount: 0,
            refund_method: 'original_payment',
        };

        await order.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Return request submitted successfully. We will review and process within 24 hours.',
                data: order,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Return request error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
