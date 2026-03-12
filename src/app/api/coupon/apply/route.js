import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CouponController from '../../../lib/controllers/CouponController.js';
import CouponService from '../../../lib/services/CouponService.js';
import CouponRepository from '../../../lib/repository/CouponRepository.js';
import { CouponSchema } from '../../../lib/models/Coupon.js';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';

export async function POST(req) {
  try {
    const body = await req.json();
    //consolle.log('Route received apply body:', body);
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    const result = await couponController.apply({ body }, conn, req);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    //consolle.error('Route POST apply error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}