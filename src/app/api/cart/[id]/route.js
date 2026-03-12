import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import cartController from '../../../lib/controllers/cartContoller.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';
import mongoose from 'mongoose';

function validateCartItem(item) {
  if (!item || typeof item !== 'object') return 'Invalid item payload';
  if (!item.product) return 'Product is required';
  if (item.quantity == null || isNaN(item.quantity) || item.quantity < 1) return 'Quantity must be at least 1';
  if (item.price == null || isNaN(item.price) || item.price < 0) return 'Price must be a non-negative number';
  return null;
}

export const PUT = withUserAuth(async function(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connection name in route:', conn.name);
    const resolvedParams = await params;
    const cartId = resolvedParams.id;
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return NextResponse.json({ success: false, message: 'Invalid cart ID' }, { status: 400 });
    }
    const body = await request.json();
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ success: false, message: 'Items array is required' }, { status: 400 });
    }
    for (const item of body.items) {
      const error = validateCartItem(item);
      if (error) {
        return NextResponse.json({ success: false, message: error }, { status: 400 });
      }
    }
    request.user = request.user || {};
    return await cartController.updateCartById(request, null, body, cartId, conn);
  } catch (err) {
    //console.error('Cart PUT error:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});