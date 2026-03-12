import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb';
import mongoose from 'mongoose';
import CouponController from '../../lib/controllers/CouponController.js';
import CouponService from '../../lib/services/CouponService.js';
import CouponRepository from '../../lib/repository/CouponRepository.js';
import { CouponSchema } from '../../lib/models/Coupon.js';
import dbConnect from '../../connection/dbConnect';


export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());
  //consolle.log('Route received query:', query);

  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    const coupons = await couponController.getAll(query, conn);
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    //consolle.error('Route GET error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    //consolle.log('Route received body:', body);
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const couponController = new CouponController(couponService);
    const result = await couponController.create({ body }, conn);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ success: true, coupon: result.data }, { status: 201 });
  } catch (error) {
    //consolle.error('Route POST error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}