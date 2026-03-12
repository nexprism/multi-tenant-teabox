

import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../../lib/tenantDb';
import CouponController from '../../../lib/controllers/CouponController';
import CouponService from '../../../lib/services/CouponService';
import CouponRepository from '../../../lib/repository/CouponRepository';
import { NextResponse } from 'next/server';

// PATCH /api/coupon/[id] - edit coupon
export async function PATCH(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    const data = await request.json();
    // Setup controller
    const couponRepo = new CouponRepository(conn.models.Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    // Call update method in controller/service
    const result = await couponController.update({ id, body: data }, conn);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error updating coupon' }, { status: 500 });
  }
}

// DELETE /api/coupon/[id] - delete coupon
export async function DELETE(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    // Setup controller
    const couponRepo = new CouponRepository(conn.models.Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    // Call delete method in controller/service
    const result = await couponController.delete({ id }, conn);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error deleting coupon' }, { status: 500 });
  }
}



// GET /api/coupon/[id] - get coupon by id
export async function GET(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    // Setup controller
    const couponRepo = new CouponRepository(conn.models.Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    // Call getByIdCoupon method in controller/service
    const result = await couponService.getByIdCoupon(id, conn);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error fetching coupon' }, { status: 500 });
  }
}