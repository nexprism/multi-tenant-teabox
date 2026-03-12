import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import wishlistController from '../../../lib/controllers/wishlistController.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';
import mongoose from 'mongoose';

function validateWishlistItem(item) {
  if (!item || typeof item !== 'object') return 'Invalid item payload';
  if (!item.product) return 'Product is required';
  return null;
}

export const PUT = withUserAuth(async function(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const resolvedParams = await params;
    const wishlistId = resolvedParams.id;
    if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
      return NextResponse.json({ success: false, message: 'Invalid wishlist ID' }, { status: 400 });
    }
    const body = await request.json();
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ success: false, message: 'Items array is required' }, { status: 400 });
    }
    for (const item of body.items) {
      const error = validateWishlistItem(item);
      if (error) {
        return NextResponse.json({ success: false, message: error }, { status: 400 });
      }
    }
    request.user = request.user || {};
    return await wishlistController.updateWishlistById(request, null, body, wishlistId, conn);
  } catch (err) {
    //consolle.error('Wishlist PUT error:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});