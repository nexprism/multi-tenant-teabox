import mongoose from 'mongoose';
import ProductSchema from '../models/Product.js';
import UserSchema from '../models/User.js';
import ticketSchema from '../models/Ticket.js';
import leadSchema from '../models/Lead.js';

class DashboardService {
  constructor(orderService, ticketService) {
    this.orderService = orderService;
    this.ticketService = ticketService;
  }

  async getDashboardMetrics(conn) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Register models on the tenant connection using local schemas
      const Product = conn.models.Product || conn.model('Product', ProductSchema);
      const User = conn.models.User || conn.model('User', UserSchema);
      const Ticket = conn.models.Ticket || conn.model('Ticket', ticketSchema);
      const Lead = conn.models.Lead || conn.model('Lead', leadSchema);

      // Fetch counts
      const totalOrders = await this.orderService.getTotalOrders(conn);
      const totalProducts = await Product.countDocuments().exec();
      const totalUsers = await User.countDocuments().exec();
      const totalTickets = await Ticket.countDocuments().exec();
      const totalLeads = await Lead.countDocuments().exec();

      // Fetch recent items
      const recentOrders = await this.orderService.getRecentOrders(conn);
      const recentTickets = await this.ticketService.getRecentTickets(conn);
      const recentProducts = await Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      // Calculate income for different periods
      const todayIncome = await this.orderService.calculateIncome({ createdAt: { $gte: startOfToday } }, conn);
      const weekIncome = await this.orderService.calculateIncome({ createdAt: { $gte: startOfWeek } }, conn);
      const monthIncome = await this.orderService.calculateIncome({ createdAt: { $gte: startOfMonth } }, conn);
      const yearIncome = await this.orderService.calculateIncome({ createdAt: { $gte: startOfYear } }, conn);

      return {
        totalOrders,
        totalProducts,
        totalUsers,
        totalTickets,
        totalLeads,
        recentOrders,
        recentProducts,
        recentTickets,
        income: {
          today: todayIncome,
          week: weekIncome,
          month: monthIncome,
          year: yearIncome
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
    }
  }
}

export default DashboardService;