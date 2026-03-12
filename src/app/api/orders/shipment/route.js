import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import OrderController from '../../../lib/controllers/orderController.js';
import OrderService from '../../../lib/services/orderService.js';
import OrderRepository from '../../../lib/repository/OrderRepository.js';
import CouponService from '../../../lib/services/CouponService.js';
import CouponRepository from '../../../lib/repository/CouponRepository.js';
import EmailService from '../../../lib/services/EmailService.js';
import { OrderSchema } from '../../../lib/models/Order.js';
import { CouponSchema } from '../../../lib/models/Coupon.js';
import { ProductSchema } from '../../../lib/models/Product.js';
import { VariantSchema } from '../../../lib/models/Variant.js';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';

export async function POST(req) {
  try {
    const tenant = req.headers.get('x-tenant'); 
    const body = await req.json();
    //consolle.log('Route received create order body:', JSON.stringify(body, null, 2));
    const subdomain = getSubdomain(req);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    
    //consolle.log('Connection name in route:', conn.name);
    const Order = conn.models.Order || conn.model('Order', OrderSchema);
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const Product = conn.models.Product || conn.model('Product', ProductSchema);
    const Variant = conn.models.Variant || conn.model('Variant', VariantSchema);
    //consolle.log('Models registered:', { Order: Order.modelName, Coupon: Coupon.modelName, Product: Product.modelName, Variant: Variant.modelName });
    const orderRepo = new OrderRepository(Order, conn);
    const couponRepo = new CouponRepository(Coupon);
    const couponService = new CouponService(couponRepo);
    const emailService = new EmailService();
    const orderService = new OrderService(orderRepo, couponService, emailService);
    const orderController = new OrderController(orderService);
    const result = await orderController.serviceList({ body }, conn, tenant);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    //consolle.error('Route POST order error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
