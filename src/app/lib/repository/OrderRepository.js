import mongoose from "mongoose";
import CrudRepository from "./CrudRepository";
import { ProductSchema } from "../models/Product";
import { VariantSchema } from "../models/Variant";
import { OrderSchema } from "../models/Order";

class OrderRepository extends CrudRepository {
  constructor(model, connection) {
    super(model);
    this.model = model;
    this.connection = connection || mongoose;
    //consolle.log(
    //   "OrderRepository initialized with connection:",
    //   this.connection
    //     ? this.connection.name || "global mongoose"
    //     : "no connection"
    // );
  }

  async create(data) {
    try {
      //consolle.log("Creating order with data:", JSON.stringify(data, null, 2));
      // Runtime guard: ensure the model schema contains address fields; if not, re-register using canonical OrderSchema
      try {
        if (
          !this.model.schema.path("shippingAddress") ||
          !this.model.schema.path("billingAddress") ||
          !this.model.schema.path("gstRate")
        ) {
          //consolle.warn(
          //   "Order model on connection is missing address fields. Re-registering Order model with canonical OrderSchema."
          // );
          try {
            if (
              this.connection &&
              this.connection.models &&
              this.connection.models.Order
            ) {
              // remove existing model reference so we can re-register
              delete this.connection.models.Order;
            }
            this.model = this.connection.model("Order", OrderSchema);
            //consolle.log(
            //   "Re-registered Order model on connection:",
            //   this.connection.name || "global mongoose"
            // );
          } catch (regErr) {
            //consolle.error("Failed to re-register Order model:", regErr.message);
          }
        }
      } catch (guardErr) {
        //consolle.warn("Order model guard check failed:", guardErr.message);
      }

      // Debug: log schema paths so we can confirm the model actually contains address fields
      try {
        const schemaPaths = Object.keys(this.model.schema.paths || {}).slice(
          0,
          200
        );
        //consolle.log("Order model schema paths:", schemaPaths);
      } catch (e) {
        //consolle.warn("Could not enumerate model.schema.paths:", e.message);
      }

      const res = await this.model.create(data);
      //consolle.log("order created successfully:", res);
      return res;
    } catch (error) {
      //consolle.error("OrderRepository Create Error:", error.message);
      throw error;
    }
  }

  async findProductById(productId) {
    //consolle.log("Finding product by ID:", productId);
    try {
      if (!this.connection) {
        throw new Error("Database connection is not provided");
      }
      //consolle.log(
      //   "Connection name:",
      //   this.connection.name || "global mongoose"
      // );
      const Product =
        this.connection.models.Product ||
        this.connection.model("Product", ProductSchema);
      //consolle.log("Using Product model:", Product.modelName);
      //consolle.log("Database:", this.connection.name || "global mongoose");

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid productId: ${productId}`);
      }

      const found = await Product.findById(productId).select("price");
      if (!found) {
        throw new Error(`Product ${productId} not found`);
      }
      //consolle.log("Found product:", found);
      return found;
    } catch (error) {
      //consolle.error("OrderRepository findProductById Error:", error.message);
      throw error;
    }
  }

  //getShipmentDashboardData
  async getShipmentDashboardData(connOrFilters = null, maybeFilters = {}) {
    try {
      // Flexible args: service may call getShipmentDashboardData(conn) or getShipmentDashboardData(filters)
      let conn = this.connection || mongoose;
      let filters = {};

      if (connOrFilters) {
        // If a mongoose connection (has .models), treat as conn
        if (connOrFilters.models && typeof connOrFilters.model === "function") {
          conn = connOrFilters;
          filters = maybeFilters || {};
        } else if (typeof connOrFilters === "object") {
          // treat as filters
          filters = connOrFilters || {};
        }
      }

      const Order = conn.models.Order || conn.model("Order", OrderSchema);

      // Build match stage
      const matchStage = { "shipping_details.platform": { $ne: null } };
      if (filters.platform) {
        matchStage["shipping_details.platform"] = filters.platform;
      }
      // Optional date range filter (based on shipping_details.last_updated if provided)
      if (filters.from || filters.to) {
        matchStage["shipping_details.last_updated"] = {};
        if (filters.from) matchStage["shipping_details.last_updated"].$gte = new Date(filters.from);
        if (filters.to) matchStage["shipping_details.last_updated"].$lte = new Date(filters.to);
      }

      const pipeline = [
        { $match: matchStage },

        // Use normalized_status from shipping_details only
        {
          $addFields: {
            platform_field: { $ifNull: ["$shipping_details.platform", null] },
            normalized_status: { $ifNull: ["$shipping_details.normalized_status", "UNKNOWN"] },
          },
        },

        // Uppercase normalized_status to make comparisons safe (enum already uppercase)
        {
          $addFields: {
            normalized_status: { $toUpper: "$normalized_status" },
          },
        },

        // Produce both overall totals and per-platform breakdowns
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  totalParcels: { $sum: 1 },
                  delivered: {
                    $sum: { $cond: [{ $eq: ["$normalized_status", "DELIVERED"] }, 1, 0] },
                  },
                  cancelled: {
                    $sum: { $cond: [{ $eq: ["$normalized_status", "CANCELLED"] }, 1, 0] },
                  },
                  rto: {
                    $sum: {
                      $cond: [
                        { $in: ["$normalized_status", ["RTO_IN_TRANSIT", "RTO_DELIVERED"]] },
                        1,
                        0,
                      ],
                    },
                  },
                  dispatched: {
                    $sum: {
                      $cond: [
                        { $in: ["$normalized_status", ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            byPlatform: [
              {
                $group: {
                  _id: "$platform_field",
                  totalParcels: { $sum: 1 },
                  delivered: { $sum: { $cond: [{ $eq: ["$normalized_status", "DELIVERED"] }, 1, 0] } },
                  cancelled: { $sum: { $cond: [{ $eq: ["$normalized_status", "CANCELLED"] }, 1, 0] } },
                  rto: { $sum: { $cond: [{ $in: ["$normalized_status", ["RTO_IN_TRANSIT", "RTO_DELIVERED"]] }, 1, 0] } },
                  dispatched: { $sum: { $cond: [{ $in: ["$normalized_status", ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]] }, 1, 0] } },
                },
              },
              { $project: { _id: 0, platform: "$_id", totalParcels: 1, delivered: 1, cancelled: 1, rto: 1, dispatched: 1 } },
            ],
          },
        },
      ];

      const agg = await Order.aggregate(pipeline).allowDiskUse(true).exec();

      const overall = (agg[0] && agg[0].overall && agg[0].overall[0]) || {
        totalParcels: 0,
        delivered: 0,
        cancelled: 0,
        rto: 0,
        dispatched: 0,
      };

      const byPlatform = (agg[0] && agg[0].byPlatform) || [];

      return { overall, byPlatform };
    } catch (error) {
      //consolle.error("OrderRepository getShipmentDashboardData Error:", error.message);
      throw error;
    }
  }
  
  

  //getAllOrdersForTracking
  async getAllOrdersForTracking(populateFields = []) {
    try {
      //order which status not delivered and which have set shipping_details.tracking_number
      let query = this.model.find({
        status: { $ne: "delivered" },
        "shipping_details.reference_number": { $exists: true, $ne: null },
      });

      if (populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      const orders = await query.exec();

      // //consolle.log("Orders for tracking:", orders);
      return orders;
    } catch (error) {
      //consolle.error("OrderRepository getAllOrdersForTracking Error:", error.message);
      throw error;
    }
  }

  async findVariantById(variantId) {
    //consolle.log("Finding variant by ID:", variantId);
    try {
      if (!this.connection) {
        throw new Error("Database connection is not provided");
      }
      //consolle.log(
      //   "Connection name:",
      //   this.connection.name || "global mongoose"
      // );
      const Variant =
        this.connection.models.Variant ||
        this.connection.model("Variant", VariantSchema);
      //consolle.log("Using Variant model:", Variant.modelName);
      //consolle.log("Database:", this.connection.name || "global mongoose");

      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        throw new Error(`Invalid variantId: ${variantId}`);
      }

      const variant = await Variant.findById(variantId).select("price");
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }
      //consolle.log("Found variant:", variant);
      return variant;
    } catch (error) {
      //consolle.error("OrderRepository findVariantById Error:", error.message);
      throw error;
    }
  }

  async getUserOrders(
    userId,
    filterConditions = {},
    sortConditions = {},
    page,
    limit,
    populateFields = [],
    selectFields = {}
  ) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid userId: ${userId}`);
      }

      const queryFilters = { ...filterConditions, user: userId };
      let query = this.model.find(queryFilters).select(selectFields);

      // Only populate fields that actually exist on the model schema or as virtuals
      if (populateFields.length > 0) {
        const validPopulateFields = populateFields.filter((field) => {
          let root;
          if (typeof field === "string") {
            root = field.split(".")[0];
          } else if (field && typeof field === "object") {
            root = (field.path || "").split(".")[0];
          } else {
            return false;
          }
          const hasPath =
            !!this.model.schema.path(root) ||
            !!(this.model.schema.virtuals && this.model.schema.virtuals[root]);
          if (!hasPath) {
            //consolle.warn(`Skipping populate for missing field: ${root}`);
          }
          return hasPath;
        });

        validPopulateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      if (Object.keys(sortConditions).length > 0) {
        query = query.sort(sortConditions);
      }

      const totalCount = await this.model.countDocuments(queryFilters);

      if (page && limit) {
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
      }

      const results = await query.exec();

      return {
        results,
        totalCount,
        currentPage: page || 1,
        pageSize: limit || 10,
      };
    } catch (error) {
      //consolle.error("OrderRepository getUserOrders Error:", error.message);
      throw error;
    }
  }

  //findById
  async findById(orderId) {
    try {
      //consolle.log("Finding order by ID:", orderId);
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error(`Invalid orderId: ${orderId}`);
      }
      const order = await this.model.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      return order;
    } catch (error) {
      //consolle.error("OrderRepository findById Error:", error.message);
      throw error;
    }
  }

  async getOrderById(orderId, userId, populateFields = [], selectFields = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error(`Invalid orderId: ${orderId}`);
      }

      const queryFilters = { _id: orderId };
      // if (userId) {
      //   if (!mongoose.Types.ObjectId.isValid(userId)) {
      //     throw new Error(`Invalid userId: ${userId}`);
      //   }
      //   queryFilters.user = userId;
      // }

      let query = this.model.findOne(queryFilters).select(selectFields);

      if (populateFields.length > 0) {
        const validPopulateFields = populateFields.filter((field) => {
          let root;
          if (typeof field === "string") {
            root = field.split(".")[0];
          } else if (field && typeof field === "object") {
            root = (field.path || "").split(".")[0];
          } else {
            return false;
          }
          const hasPath =
            !!this.model.schema.path(root) ||
            !!(this.model.schema.virtuals && this.model.schema.virtuals[root]);
          if (!hasPath) {
            //consolle.warn(`Skipping populate for missing field: ${root}`);
          }
          return hasPath;
        });

        validPopulateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      // //consolle.log("query ===>  ", query);

      const order = await query.exec();
      if (!order) {
        throw new Error("Order not found or you do not have access");
      }

      return order;
    } catch (error) {
      //consolle.error("OrderRepository getOrderById Error:", error.message);
      throw error;
    }
  }

  async getRecentOrders(limit = 5, populateFields = []) {
    try {
      let query = this.model.find({}).sort({ createdAt: -1 }).limit(limit);

      if (populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      const orders = await query.exec();
      return orders;
    } catch (error) {
      //consolle.error("OrderRepository getRecentOrders Error:", error.message);
      throw error;
    }
  }

  async calculateIncome(filterConditions = {}) {
    try {
      const orders = await this.model.find(filterConditions).select("total");
      const totalIncome = orders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
      return totalIncome;
    } catch (error) {
      //consolle.error("OrderRepository calculateIncome Error:", error.message);
      throw error;
    }
  }

  //updateOrder
  async updateOrder(orderId, updateData) {
    try {
      // //consolle.log('Updating order:', orderId, 'with data:', updateData);
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error(`Invalid orderId: ${orderId}`);
      }

      const updatedOrder = await this.model.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );
      if (!updatedOrder) {
        throw new Error("Order not found");
      }
      // //consolle.log('Order updated successfully:', updatedOrder);
      return updatedOrder;
    } catch (error) {
      //consolle.error("OrderRepository updateOrder Error:", error.message);
      throw error;
    }
  }

  async getAllOrders(
    filterConditions = {},
    sortConditions = {},
    page,
    limit,
    populateFields = [],
    selectFields = {}
  ) {
    try {
      const queryFilters = { ...filterConditions };
      let query = this.model
        .find(queryFilters)
        .select(selectFields)
        .sort({ createdAt: -1 });

      if (populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      if (Object.keys(sortConditions).length > 0) {
        query = query.sort(sortConditions);
      }

      const totalCount = await this.model.countDocuments(queryFilters);

      if (page && limit) {
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
      }

      const results = await query.exec();

      return {
        results,
        totalCount,
        currentPage: page || 1,
        pageSize: limit || 10,
      };
    } catch (error) {
      //consolle.error("OrderRepository getAllOrders Error:", error.message);
      throw error;
    }
  }

  async findOrders(query = {}, conn) {
    return await this.Order.find(query).exec();
  }
}

export default OrderRepository;
