import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import { NextResponse } from 'next/server';
import cartController from '../../lib/controllers/cartContoller.js';
import { withUserAuth } from '../../middleware/commonAuth.js';

// Advanced validation helpers
function validateCartItem(item) {
    if (!item || typeof item !== 'object') return 'Invalid item payload';
    if (!item.product) return 'Product is required';
    if (item.quantity == null || isNaN(item.quantity) || item.quantity < 1) return 'Quantity must be at least 1';
    if (item.price == null || isNaN(item.price) || item.price < 0) return 'Price must be a non-negative number';
    return null;
}

export const GET = withUserAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        request.user = request.user || {};
        return await cartController.getCart(request, null, null, conn);
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});

export const POST = withUserAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const body = await request.json();
        const error = validateCartItem(body);
        if (error) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        request.user = request.user || {};
        return await cartController.addItem(request, null, body, conn);
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
});

export const DELETE = withUserAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const body = await request.json();
        if (!body.productId) {
            return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
        }
        request.user = request.user || {};
        return await cartController.removeItem(request, null, body, conn);
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
});

export const PUT = withUserAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const { action } = Object.fromEntries(new URL(request.url).searchParams.entries());
        if (action === 'clear') {
            request.user = request.user || {};
            return await cartController.clearCart(request, null, null, conn);
        }
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
});