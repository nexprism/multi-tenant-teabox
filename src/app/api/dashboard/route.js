import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import DashboardController from '../../lib/controllers/dashboardController';
import DashboardService from '../../lib/services/dashboardService';
import OrderRepository from '../../lib/repository/OrderRepository';
import TicketRepository from '../../lib/repository/ticketRepository';
import CouponRepository from '../../lib/repository/CouponRepository';
import OrderService from '../../lib/services/orderService';
import TicketService from '../../lib/services/ticketService';
import CouponService from '../../lib/services/CouponService';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb';
import { withUserAuth } from '../../middleware/commonAuth';
import { OrderSchema } from '../../lib/models/Order';
import { CouponSchema } from '../../lib/models/Coupon';
import { ProductSchema } from '../../lib/models/Product';
import { VariantSchema } from '../../lib/models/Variant';
import TicketSchema from '../../lib/models/Ticket';
import UserSchema from '../../lib/models/User';
import RoleSchema from '../../lib/models/role';
import leadSchema from '../../lib/models/Lead';

export const GET = withUserAuth(async function (request) {
  try {
    // Check if user is authenticated
    if (!request.user?._id) {
      return NextResponse.json({ success: false, message: 'User authentication required' }, { status: 401 });
    }

    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established for subdomain:', subdomain);
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connected to database:', conn.name);

    // Register models
    const User = conn.models.User || conn.model('User', UserSchema);
    const Role = conn.models.Role || conn.model('Role', RoleSchema);
    const Order = conn.models.Order || conn.model('Order', OrderSchema);
    const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);
    const Product = conn.models.Product || conn.model('Product', ProductSchema);
    const Variant = conn.models.Variant || conn.model('Variant', VariantSchema);
    const Ticket = conn.models.Ticket || conn.model('Ticket', TicketSchema);
    const Lead = conn.models.Lead || conn.model('Lead', leadSchema);

    // console.log('Models registered:', {
    //   User: User.modelName,
    //   Role: Role.modelName,
    //   Order: Order.modelName,
    //   Coupon: Coupon.modelName,
    //   Product: Product.modelName,
    //   Variant: Variant.modelName,
    //   Ticket: Ticket.modelName,
    //   Lead: Lead.modelName,
    // });

    // Check if user has admin role
    const user = await User.findById(request.user._id).select('role').exec();
    if (!user || !user.role) {
      return NextResponse.json({ success: false, message: 'User or role not found' }, { status: 403 });
    }
    const role = await Role.findById(user.role).select('name').exec();
    if (!role || role.name !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    // Initialize repositories
    const orderRepo = new OrderRepository(Order, conn);
    const ticketRepo = new TicketRepository(conn);
    const couponRepo = new CouponRepository(Coupon);

    // Initialize services
    const couponService = new CouponService(couponRepo);
    const orderService = new OrderService(orderRepo, couponService);
    const ticketService = new TicketService(conn);
    const dashboardService = new DashboardService(orderService, ticketService);

    // Initialize controller
    const dashboardController = new DashboardController(dashboardService);

    // Fetch dashboard data
    const result = await dashboardController.getDashboardData(request, conn);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    //console.error('Route GET dashboard error:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});