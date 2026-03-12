import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import OrderController from '../../../lib/controllers/orderController.js';
import OrderService from '../../../lib/services/orderService.js';
import OrderRepository from '../../../lib/repository/OrderRepository.js';
import CouponService from '../../../lib/services/CouponService.js';
import CouponRepository from '../../../lib/repository/CouponRepository.js';
import { OrderSchema } from '../../../lib/models/Order.js';
import { CouponSchema } from '../../../lib/models/Coupon.js';
import { ProductSchema } from '../../../lib/models/Product.js';
import { VariantSchema } from '../../../lib/models/Variant.js';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { withUserAuth } from '../../../middleware/commonAuth.js';

export const GET = withUserAuth(async function (request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connection name in route:', conn.name);
    const Order = conn.models.Order || conn.model('Order', OrderSchema);
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const Product = conn.models.Product || conn.model('Product', ProductSchema);
    const Variant = conn.models.Variant || conn.model('Variant', VariantSchema);
    const orderRepo = new OrderRepository(Order, conn);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const orderService = new OrderService(orderRepo, couponService);
    const orderController = new OrderController(orderService);
    const result = await orderController.getOrderDetails(request, conn, params);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    //console.error('Route GET order details error:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
});

export const PUT = withUserAuth(async function (request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const Order = conn.models.Order || conn.model('Order', OrderSchema);
    const orderRepo = new OrderRepository(Order, conn);
    const orderService = new OrderService(orderRepo);
    const orderController = new OrderController(orderService);

    const result = await orderController.update(request, conn, params);
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
});