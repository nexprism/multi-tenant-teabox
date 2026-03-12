import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { ReviewSchema } from '../../../lib/models/Review.js';
import UserSchema from '../../../lib/models/User.js';
import { ProductSchema } from '../../../lib/models/Product.js';

export async function GET(req) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const User = conn.models.User || conn.model('User', UserSchema);
    const Review = conn.models.Review || conn.model('Review', ReviewSchema);
    const Product = conn.models.Product || conn.model('Product', ProductSchema);

    // Get URL search params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    // Filters - example: filter by productId, userId, rating
    const productId = url.searchParams.get('productId');
    const userId = url.searchParams.get('userId');
    const rating = url.searchParams.get('rating') ? parseInt(url.searchParams.get('rating')) : null;

    // Search text on comment field
    const search = url.searchParams.get('search');

    // Build query object dynamically
    const query = {};

    // Optional isActive filter (for public endpoints)
    const isActiveParam = url.searchParams.get('isActive');
    if (isActiveParam !== null) {
      // interpret "true"/"false"
      query.isActive = isActiveParam === 'true';
    }

    if (productId) query.productId = productId;
    if (userId) query.userId = userId;
    if (rating) query.rating = rating;
    if (search) query.comment = { $regex: search, $options: 'i' }; // case-insensitive search

    // Count total matching docs for pagination info
    const total = await Review.countDocuments(query);

    // Fetch reviews with pagination and populate
    const reviews = await Review.find(query)
      .populate('userId productId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest first

    return NextResponse.json({
      success: true,
      message: 'Reviews fetched',
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
