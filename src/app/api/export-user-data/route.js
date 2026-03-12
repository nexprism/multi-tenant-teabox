import { NextResponse } from "next/server";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import { withUserAuth } from "../../middleware/commonAuth.js";
import { OrderSchema } from "../../lib/models/Order.js";
import ticketSchema from "../../lib/models/Ticket.js";
import userSchema from "../../lib/models/User.js";
import { ReviewSchema } from "../../lib/models/Review.js";
import { ProductSchema } from "../../lib/models/Product.js";
import { VariantSchema } from "../../lib/models/Variant.js";
import RoleSchema from "../../lib/models/role.js";

export const GET = withUserAuth(async function (request) {
    try {
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
        const Order = conn.models.Order || conn.model("Order", OrderSchema);
        const Ticket = conn.models.Ticket || conn.model("Ticket", ticketSchema);
        const Review = conn.models.Review || conn.model("Review", ReviewSchema);
        const Product = conn.models.Product || conn.model("Product", ProductSchema);
        const Variant = conn.models.Variant || conn.model("Variant", VariantSchema);
        const Role = conn.models.Role || conn.model("Role", RoleSchema);

        // Check admin access
        const requestingUser = await User.findById(request.user._id).select("role");
        const role = await Role.findById(requestingUser?.role).select("name");

        if (!role || (role.name !== "admin" && role.name !== "superadmin")) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build date filter
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }

        let userQuery = { isDeleted: { $ne: true } };
        if (targetUserId) {
            userQuery._id = targetUserId;
        } else if (startDate || endDate) {
            // Apply date filter to users when no specific user is targeted
            userQuery.createdAt = {};
            if (startDate) {
                userQuery.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                userQuery.createdAt.$lte = end;
            }
        }

        // Fetch Users
        const users = await User.find(userQuery).populate("role", "name").lean();

        if (!users.length) {
            return NextResponse.json(
                { success: false, message: "No users found" },
                { status: 404 }
            );
        }

        const userIds = users.map(u => u._id);

        // Build queries for related data
        let orderQuery = { user: { $in: userIds } };
        let ticketQuery = { customer: { $in: userIds }, isDeleted: { $ne: true } };
        let reviewQuery = { userId: { $in: userIds } };

        // Apply date filter to related data
        if (startDate || endDate) {
            const dateRangeFilter = {};
            if (startDate) {
                dateRangeFilter.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateRangeFilter.$lte = end;
            }
            orderQuery.createdAt = dateRangeFilter;
            ticketQuery.createdAt = dateRangeFilter;
            reviewQuery.createdAt = dateRangeFilter;
        }

        // Fetch Related Data with Population
        const [orders, tickets, reviews] = await Promise.all([
            Order.find(orderQuery)
                .populate("user", "name email phone")
                .populate("items.product", "name")
                .populate("items.variant", "title")
                .sort({ createdAt: -1 })
                .lean(),
            Ticket.find(ticketQuery)
                .populate("customer", "name email")
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .lean(),
            Review.find(reviewQuery)
                .populate("userId", "name email")
                .populate("productId", "name")
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // Helper to format address
        const formatAddress = (addr) => {
            if (!addr) return "";
            return `${addr.fullName}, ${addr.addressLine1}, ${addr.addressLine2 || ""}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country} (Ph: ${addr.phoneNumber})`;
        };

        // Sheet 1: Users
        const usersData = users.map(u => ({
            "User ID": u._id.toString(),
            "Name": u.name || "",
            "Email": u.email || "",
            "Phone": u.phone || "",
            "Role": u.role?.name || "User",
            "Is Verified": u.isVerified ? "Yes" : "No",
            "Is Active": u.isActive ? "Yes" : "No",
            "Created At": u.createdAt ? new Date(u.createdAt).toISOString() : "",
        }));

        // Sheet 2: Orders
        const ordersData = orders.map(o => {
            const productNames = o.items?.map(i => {
                const pName = i.product?.name || "Unknown Product";
                const vName = i.variant?.title ? ` (${i.variant.title})` : "";
                return `${pName}${vName} x${i.quantity}`;
            }).join(", ");

            return {
                "Order ID": o._id.toString(),
                "User Name": o.user?.name || "Unknown",
                "User Email": o.user?.email || "",
                "User Phone": o.user?.phone || "",
                "Total Amount": o.total,
                "Status": o.status,
                "Payment Mode": o.paymentMode,
                "Payment ID": o.paymentId,
                "Placed At": o.placedAt ? new Date(o.placedAt).toISOString() : "",
                "Items Summary": productNames || "",
                "Items Count": o.items ? o.items.length : 0,
                "Shipping Address": formatAddress(o.shippingAddress),
                "Billing Address": formatAddress(o.billingAddress),
                "Courier": o.shipping_details?.platform || "",
                "Tracking No": o.shipping_details?.reference_number || "",
                "Tracking URL": o.shipping_details?.tracking_url || "",
                "Discount": o.discount || 0,
                "Shipping Charge": o.shippingCharge || 0,
            };
        });

        // Sheet 3: Order Items (Detailed breakdown of each product in each order)
        const orderItemsData = [];
        orders.forEach(o => {
            if (o.items && o.items.length > 0) {
                o.items.forEach(item => {
                    orderItemsData.push({
                        "Order ID": o._id.toString(),
                        "Placed At": o.placedAt ? new Date(o.placedAt).toISOString() : "",
                        "User Name": o.user?.name || "Unknown",
                        "User Email": o.user?.email || "",
                        "Product Name": item.product?.name || "Unknown Product",
                        "Variant": item.variant?.title || "N/A",
                        "SKU": item.variant?.sku || "N/A",
                        "Quantity": item.quantity,
                        "Unit Price": item.price,
                        "Line Total": item.quantity * item.price,
                        "Order Status": o.status,
                        "Payment Mode": o.paymentMode
                    });
                });
            }
        });

        // Sheet 4: Tickets
        const ticketsData = tickets.map(t => ({
            "Ticket ID": t._id.toString(),
            "Customer Name": t.customer?.name || "Unknown",
            "Customer Email": t.customer?.email || "",
            "Subject": t.subject,
            "Description": t.description,
            "Status": t.status,
            "Priority": t.priority,
            "Assigned To": t.assignedTo?.name || "Unassigned",
            "Order ID": t.orderId ? t.orderId.toString() : "",
            "Created At": t.createdAt ? new Date(t.createdAt).toISOString() : "",
        }));

        // Sheet 5: Reviews
        const reviewsData = reviews.map(r => ({
            "Review ID": r._id.toString(),
            "User Name": r.userId?.name || "Unknown",
            "Product Name": r.productId?.name || "Unknown Product",
            "Rating": r.rating,
            "Comment": r.comment,
            "Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        }));

        // Create Workbook
        const wb = XLSX.utils.book_new();

        const wsUsers = XLSX.utils.json_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, wsUsers, "Users");

        const wsOrders = XLSX.utils.json_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

        const wsOrderItems = XLSX.utils.json_to_sheet(orderItemsData);
        XLSX.utils.book_append_sheet(wb, wsOrderItems, "Order Items");

        const wsTickets = XLSX.utils.json_to_sheet(ticketsData);
        XLSX.utils.book_append_sheet(wb, wsTickets, "Tickets");

        const wsReviews = XLSX.utils.json_to_sheet(reviewsData);
        XLSX.utils.book_append_sheet(wb, wsReviews, "Reviews");

        // Generate Buffer
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        // Return Response
        const dateRangeSuffix = startDate || endDate ? `_${startDate || 'start'}_to_${endDate || 'end'}` : '';
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="user_data_export${dateRangeSuffix}_${new Date().toISOString().split('T')[0]}.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
});
