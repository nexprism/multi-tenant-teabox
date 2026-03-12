import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import { withUserAuth } from "../../middleware/commonAuth.js";
import { OrderSchema } from "../../lib/models/Order.js";
import { ProductSchema } from "../../lib/models/Product.js";
import { VariantSchema } from "../../lib/models/Variant.js";
import ticketSchema from "../../lib/models/Ticket.js";
import userSchema from "../../lib/models/User.js";
import { categorySchema } from "../../lib/models/Category.js";
import RoleSchema from "../../lib/models/role.js";

export const GET = withUserAuth(async function (request) {
  try {
    if (!request.user?._id) {
      return NextResponse.json(
        { success: false, message: "User authentication required" },
        { status: 401 }
      );
    }

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    // Models
    const User = conn.models.User || conn.model("User", userSchema);
    const Role = conn.models.Role || conn.model("Role", RoleSchema);
    const Order = conn.models.Order || conn.model("Order", OrderSchema);
    const Ticket = conn.models.Ticket || conn.model("Ticket", ticketSchema);
    const Product = conn.models.Product || conn.model("Product", ProductSchema);
    const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
    const Category =
      conn.models.Category || conn.model("Category", categorySchema);

    // Check admin
    const requestingUser = await User.findById(request.user._id).select("role");
    const role = await Role.findById(requestingUser?.role).select("name");
    if (!role || role.name !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Date Filters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let dateFilter = {};
    let start, end;

    if (startDate) start = new Date(startDate);
    if (endDate) {
      end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
    }

    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = start;
      if (end) dateFilter.createdAt.$lte = end;
    }

    // Previous Period for RoC
    let prevDateFilter = {};
    if (start && end) {
      const diff = end.getTime() - start.getTime();

      prevDateFilter.createdAt = {
        $gte: new Date(start.getTime() - diff - 1),
        $lte: new Date(start.getTime() - 1),
      };
    }

    // SUCCESS LOGIC — E-COMMERCE STANDARD
    const SUCCESS_FILTER = {
      $or: [
        // Prepaid successful = paid + shipped + completed
        {
          paymentMode: "Prepaid",
          status: { $in: ["paid", "shipped", "completed"] },
        },
        // COD successful = completed only
        {
          paymentMode: "COD",
          status: "completed",
        },
      ],
      ...dateFilter,
    };

    const PREV_SUCCESS_FILTER = {
      $or: [
        { paymentMode: "Prepaid", status: { $in: ["paid", "shipped", "completed"] } },
        { paymentMode: "COD", status: "completed" },
      ],
      ...prevDateFilter,
    };

    // PARALLEL QUERIES
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalVariants,

      allOrders,
      tickets,

      successfulOrders,
      totalRevenueAgg,
      prevRevenueAgg,
      discountStats,
      chargesStats,

      newCustomersCount
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Product.countDocuments({ deletedAt: null }),
      Category.countDocuments({ deletedAt: null }),
      Variant.countDocuments({ deletedAt: null }),

      // All operational orders (include shipping cancellation flags)
      Order.find({ ...dateFilter }).select("status total createdAt shipping_details.cancelled shipping_details.normalized_status"),

      // Tickets
      Ticket.find({ ...dateFilter, isDeleted: { $ne: true } }).select("status createdAt"),

      // Successful orders
      Order.find(SUCCESS_FILTER).select("total paymentMode user discount coupon createdAt"),

      // Revenue current
      Order.aggregate([
        { $match: SUCCESS_FILTER },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),

      // Revenue previous period
      Order.aggregate([
        { $match: PREV_SUCCESS_FILTER },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),

      // Discount stats
      Order.aggregate([
        { $match: SUCCESS_FILTER },
        {
          $group: {
            _id: null,
            totalDiscount: { $sum: "$discount" },
            couponCount: {
              $sum: { $cond: [{ $ne: ["$coupon", null] }, 1, 0] },
            },
          },
        },
      ]),

      // GST and Payment Gateway Charges
      Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            totalGst: { $sum: "$gstAmount" },
            totalPaymentGatewayCharges: { $sum: "$paymentGatewayAmount" },
          },
        },
      ]),

      // New customers (first successful order in range)
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentMode: "Prepaid", status: { $in: ["paid", "shipped", "completed"] } },
              { paymentMode: "COD", status: "completed" }
            ]
          }
        },
        { $group: { _id: "$user", firstOrderDate: { $min: "$createdAt" } } },
        {
          $match: {
            firstOrderDate: {
              $gte: startDate ? new Date(startDate) : new Date(0),
              $lte: endDate ? new Date(endDate) : new Date()
            }
          }
        },
        { $count: "count" }
      ])
    ]);

    // CORE METRICS
    const totalRevenue = totalRevenueAgg?.[0]?.totalRevenue || 0;
    const prevRevenue = prevRevenueAgg?.[0]?.totalRevenue || 0;

    const roc =
      prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const totalSuccessfulOrders = successfulOrders.length;

    const aov =
      totalSuccessfulOrders > 0
        ? (totalRevenue / totalSuccessfulOrders).toFixed(2)
        : 0;

    const uniqueCustomerIds = [
      ...new Set(successfulOrders.map((o) => o.user.toString())),
    ];
    const uniqueCustomersCount = uniqueCustomerIds.length;

    const ltv =
      uniqueCustomersCount > 0
        ? (totalRevenue / uniqueCustomersCount).toFixed(2)
        : 0;

    // Repeat customers
    const orderCountMap = {};
    successfulOrders.forEach((o) => {
      const uid = o.user.toString();
      orderCountMap[uid] = (orderCountMap[uid] || 0) + 1;
    });
    const repeatCustomers = Object.values(orderCountMap).filter((c) => c > 1)
      .length;

    const repeatCustomerRatio =
      uniqueCustomersCount > 0
        ? ((repeatCustomers / uniqueCustomersCount) * 100).toFixed(2)
        : 0;

    // COD / Prepaid
    let codCount = 0;
    let prepaidCount = 0;
    successfulOrders.forEach((o) => {
      if (o.paymentMode === "COD") codCount++;
      if (o.paymentMode === "Prepaid") prepaidCount++;
    });

    const codPrepaidRatio =
      prepaidCount > 0
        ? (codCount / prepaidCount).toFixed(2)
        : codCount > 0
          ? "Infinity"
          : "0";

    const totalDiscount = discountStats?.[0]?.totalDiscount || 0;
    const totalCoupons = discountStats?.[0]?.couponCount || 0;
    const totalGst = chargesStats?.[0]?.totalGst || 0;
    const totalPaymentGatewayCharges = chargesStats?.[0]?.totalPaymentGatewayCharges || 0;
    const newCustomers = newCustomersCount?.[0]?.count || 0;

    // Total Buyers
    const totalBuyersAgg = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentMode: "Prepaid", status: { $in: ["paid", "shipped", "completed"] } },
            { paymentMode: "COD", status: "completed" }
          ]
        }
      },
      { $group: { _id: "$user" } }
    ]);

    const totalBuyers = totalBuyersAgg.length;
    const nonBuyingUsers = totalUsers - totalBuyers;

    // OPERATIONS DASHBOARD
    const totalOrders = allOrders.length;
    // Compute operations counts, treating orders as 'cancelled' if either
    // order.status === 'cancelled' OR shipping_details.cancelled flag is true
    let pendingOrders = 0;
    let shippedOrders = 0;
    let cancelledOrders = 0;
    const ordersByStatus = { pending: 0, paid: 0, shipped: 0, completed: 0, cancelled: 0 };

    for (const o of allOrders) {
      const isShippingCancelled = o.shipping_details && (o.shipping_details.cancelled === true || (o.shipping_details.normalized_status || '').toUpperCase() === 'CANCELLED');
      if (o.status === 'cancelled' || isShippingCancelled) {
        cancelledOrders++;
        ordersByStatus['cancelled'] = (ordersByStatus['cancelled'] || 0) + 1;
        continue;
      }

      // otherwise increment by actual status
      const st = o.status || 'pending';
      if (!ordersByStatus[st]) ordersByStatus[st] = 0;
      ordersByStatus[st]++;
      if (st === 'pending') pendingOrders++;
      if (st === 'shipped') shippedOrders++;
    }

    const ticketStatuses = ["open", "in_progress", "resolved", "closed"];
    const ticketsByStatus = {};
    ticketStatuses.forEach(
      (s) => (ticketsByStatus[s] = tickets.filter((t) => t.status === s).length)
    );

    const recentOrders = await Order.find({ ...dateFilter })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("user items total status createdAt placedAt paymentMode")
      .populate("user", "name email phone")
      .lean();

    const recentTickets = await Ticket.find({
      ...dateFilter,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("subject status priority customer orderId createdAt")
      .populate("customer", "name email phone")
      .lean();

    // FINAL RESPONSE
    const data = {
      totalUsers,
      totalProducts,
      totalCategories,
      totalVariants,

      salesDashboard: {
        totalUsers,
        totalBuyers,
        nonBuyingUsers,
        totalRevenue,
        totalSuccessfulOrders,
        aov,
        ltv,
        roc,
        newCustomers,
        repeatCustomers,
        repeatCustomerRatio,
        codPrepaidRatio,
        codCount,
        prepaidCount,
        totalDiscount,
        totalCoupons,
        totalGst,
        totalPaymentGatewayCharges,
      },

      operationsDashboard: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        cancelledOrders,
        ordersByStatus,
        ticketsByStatus,
        totalPendingTickets: ticketsByStatus["open"] || 0,
        recentOrders,
        recentTickets,
      },
    };

    return NextResponse.json(
      { success: true, message: "Analytics fetched", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analytics route error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
});
