import mongoose from "mongoose";
import { FrequentlyPurchasedProductSchema } from "../models/FrequentlyPurchasedProduct.js";
import { OrderSchema } from "../models/Order.js"; // Import OrderSchema

export default class FrequentlyPurchasedProductRepository {
  constructor(connection) {
    this.connection = connection || mongoose;
    this.FrequentlyPurchasedProduct =
      this.connection.models.FrequentlyPurchasedProduct ||
      this.connection.model("FrequentlyPurchasedProduct", FrequentlyPurchasedProductSchema);
    //consolle.log(
    //   "FrequentlyPurchasedProductRepository initialized with connection:",
    //   this.connection ? this.connection.name || "global mongoose" : "no connection"
    // );
  }

  async create(data) {
    try {
      //consolle.log("Creating frequently purchased product with data:", JSON.stringify(data, null, 2));
      return await this.FrequentlyPurchasedProduct.create(data);
    } catch (error) {
      //consolle.error("FrequentlyPurchasedProductRepository Create Error:", error.message);
      throw error;
    }
  }

  async getAll() {
    try {
      return await this.FrequentlyPurchasedProduct.find()
        .populate("productId")
        .sort({ priority: -1 }) // Sort by priority descending
        .exec();
    } catch (error) {
      //consolle.error("FrequentlyPurchasedProductRepository getAll Error:", error.message);
      throw error;
    }
  }

  async getFrequentlyPurchasedFromOrders(conn, limit = 10) {
    try {
      const Order = conn.models.Order || conn.model("Order", OrderSchema); // Use OrderSchema
      const productCounts = await Order.aggregate([
        { $unwind: "$items" }, // Unwind items array
        {
          $group: {
            _id: "$items.product",
            count: { $sum: "$items.quantity" }, // Sum quantities for each product
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            productId: "$_id",
            count: 1,
            product: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } }, // Sort by purchase count descending
        { $limit: limit },
      ]);
      return productCounts;
    } catch (error) {
      //consolle.error("FrequentlyPurchasedProductRepository getFrequentlyPurchasedFromOrders Error:", error.message);
      throw error;
    }
  }
}