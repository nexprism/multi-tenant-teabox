// lib/repository/productRepository.js
import CrudRepository from "./CrudRepository.js";
import mongoose from "mongoose";
import { attributeSchema } from "../models/Attribute.js";
import { variantSchema } from "../models/Variant.js";
import { influencerVideoSchema } from "../models/InfluencerVideo.js";
import { OrderSchema } from "../models/Order.js";
import { BrandSchema } from "../models/Brand.js";

class ProductRepository extends CrudRepository {
  // Fetch all products and attach variants with attributes to each
  async getAll(
    filter = {},
    sortConditions = {},
    pageNum = 1,
    limitNum = 10,
    populateFields = [],
    selectFields = {},
    conn
  ) {
    try {
      const connection = conn || this.model.db;

      // Register Attribute model if not already registered
      if (!connection.models.Attribute) {
        const Attribute =
          mongoose.models.Attribute ||
          mongoose.model("Attribute", attributeSchema);
        connection.model("Attribute", attributeSchema);
      }

      // Register Order model if not already registered using canonical OrderSchema
      let Order;
      if (!connection.models.Order) {
        Order = connection.model("Order", OrderSchema);
      } else {
        Order = connection.models.Order;
      }

      // Register Wishlist model with your schema if not already registered
      let Wishlist;
      if (!connection.models.Wishlist) {
        // Import your wishlist schema
        const wishlistItemSchema = new mongoose.Schema(
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
              required: true,
            },
            variant: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Variant",
              required: false,
            },
            addedAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: false }
        );

        const wishlistSchema = new mongoose.Schema(
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
              unique: true,
            },
            items: [wishlistItemSchema],
            updatedAt: {
              type: Date,
              default: Date.now,
            },
          },
          {
            timestamps: true,
          }
        );

        Wishlist = connection.model("Wishlist", wishlistSchema);
      } else {
        Wishlist = connection.models.Wishlist;
      }

      // Calculate skip value for pagination
      const skip = (pageNum - 1) * limitNum;


      //consolle.log("filter is ====> " , filter)

      // Find products with pagination and sorting
      // Fix: Clean up sortConditions keys if they have quotes
      const cleanedSortConditions = {};
      for (const [field, direction] of Object.entries(sortConditions)) {
        // Remove leading/trailing quotes from field name
        const cleanField = typeof field === "string" ? field.replace(/^"+|"+$/g, "") : field;
        cleanedSortConditions[cleanField] = direction;
      }

      // Try to populate attributeSet, but handle errors gracefully
      // Note: Schema has strictPopulate: false, but if populate still fails, we'll skip it
      let products;
      try {
        const populateOptions = [{ path: "attributeSet.attributeId" }];
        products = await this.model
          .find(filter)
          .populate(populateOptions)
          .sort(cleanedSortConditions)
          .skip(skip)
          .limit(limitNum)
          .select(selectFields);
      } catch (populateError) {
        // If populate fails, fetch without populate
        // This can happen if strictPopulate is enforced at connection level
        console.warn("Failed to populate attributeSet.attributeId, fetching without populate:", populateError.message);
        products = await this.model
          .find(filter)
          .sort(cleanedSortConditions)
          .skip(skip)
          .limit(limitNum)
          .select(selectFields);
      }

      const results = [];

      for (const productDoc of products) {
        const variants = await this.getVariantsWithAttributes(
          productDoc._id,
          connection
        );
        const productObj = productDoc.toObject
          ? productDoc.toObject()
          : productDoc;

        // Get wishlist data for this product using aggregation
        const wishlistUsers = await Wishlist.aggregate([
          {
            $match: {
              "items.product": productDoc._id,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $match: {
              "items.product": productDoc._id,
            },
          },
          {
            $project: {
              userId: "$user",
              variantId: "$items.variant",
              addedAt: "$items.addedAt",
              _id: 0,
            },
          },
        ]);

        // Format wishlist data - only userId
        const uniqueUsers = [
          ...new Set(wishlistUsers.map((item) => item.userId.toString())),
        ];
        productObj.wishlist = uniqueUsers;

        // Add wishlist count for convenience
        productObj.wishlistCount = uniqueUsers.length;

        // Get order count for this product using aggregation
        const orderCountResult = await Order.aggregate([
          {
            $match: {
              "items.product": productDoc._id,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $match: {
              "items.product": productDoc._id,
            },
          },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$items.quantity" },
              totalOrders: { $sum: 1 },
            },
          },
        ]);

        // Add order count to product object
        productObj.orderCount =
          orderCountResult.length > 0 ? orderCountResult[0].totalQuantity : 0;
        productObj.orderInstances =
          orderCountResult.length > 0 ? orderCountResult[0].totalOrders : 0;

        productObj.variants = variants;
        results.push(productObj);
      }

      // Get total count for pagination info
      const totalCount = await this.model.countDocuments(filter);

      return {
        products: results,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPrevPage: pageNum > 1,
        },
      };
    } catch (error) {
      //consolle.error("Repository getAll Error:", error.message);
      throw error;
    }
  }
  constructor(model) {
    super(model);
    this.model = model;
  }

  setModel(model) {
    this.model = model;
  }

  // Optionally override create/findById/update/delete if you need custom logic
  async create(data) {
    try {
      const res = await this.model.create(data);
      return res;
    } catch (error) {
      //consolle.error("Repository Create Error:", error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      const conn = this.model.db;

      if (!conn.models.Attribute) {
        conn.model("Attribute", attributeSchema);
      }
      if (!conn.models.InfluencerVideo) {
        conn.model("InfluencerVideo", influencerVideoSchema);
      }

      // Register Brand model if not already registered
      if (!conn.models.Brand) {
        conn.model("Brand", BrandSchema);
      }

      // Register Order model if not already registered using canonical OrderSchema
      let Order;
      if (!conn.models.Order) {
        Order = conn.model("Order", OrderSchema);
      } else {
        Order = conn.models.Order;
      }

      // Try to populate attributeSet, but handle errors gracefully
      // Note: Schema has strictPopulate: false, but if populate still fails, we'll skip it
      let productDoc;
      try {
        const populateOptions = [
          { path: "attributeSet.attributeId" },
          { path: "brand", select: "name image" }
        ];
        if (mongoose.Types.ObjectId.isValid(id)) {
          productDoc = await this.model.findById(id).populate(populateOptions);
        } else {
          productDoc = await this.model
            .findOne({ slug: id, deletedAt: null })
            .populate(populateOptions);
        }
      } catch (populateError) {
        // If populate fails, try to fetch with just brand populated
        console.warn("Failed to populate with all options, trying with brand only:", populateError.message);
        try {
          if (mongoose.Types.ObjectId.isValid(id)) {
            productDoc = await this.model.findById(id).populate({ path: "brand", select: "name image" });
          } else {
            productDoc = await this.model.findOne({ slug: id, deletedAt: null }).populate({ path: "brand", select: "name image" });
          }
        } catch (brandPopulateError) {
          // If brand populate also fails, fetch without populate
          console.warn("Failed to populate brand, fetching without populate:", brandPopulateError.message);
          if (mongoose.Types.ObjectId.isValid(id)) {
            productDoc = await this.model.findById(id);
          } else {
            productDoc = await this.model.findOne({ slug: id, deletedAt: null });
          }
        }
      }

      if (!productDoc) return null;

      const variants = await this.getVariantsWithAttributes(
        productDoc._id,
        conn
      );

      // Fetch InfluencerVideos where productId matches and type is "product"
      const InfluencerVideo = conn.models.InfluencerVideo;
      const influencerVideos = await InfluencerVideo.find({
        productId: productDoc._id,
        type: "product",
      }).select(
        "title description videoUrl videoType type productId createdAt updatedAt"
      );

      // Get order count for this product using aggregation
      const orderCountResult = await Order.aggregate([
        {
          $match: {
            "items.product": productDoc._id,
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.product": productDoc._id,
          },
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$items.quantity" },
            totalOrders: { $sum: 1 },
          },
        },
      ]);

      // Convert to object with all fields included (minimize: false ensures empty fields are included)
      const productObj = productDoc.toObject
        ? productDoc.toObject({ minimize: false, virtuals: false })
        : productDoc;
      
      // Ensure comparison.rows always have whyExcels field
      if (productObj.comparison && productObj.comparison.rows && Array.isArray(productObj.comparison.rows)) {
        productObj.comparison.rows = productObj.comparison.rows.map(row => ({
          ...row,
          whyExcels: row.whyExcels !== undefined ? row.whyExcels : '',
        }));
      }
      productObj.variants = variants;
      productObj.influencerVideos = influencerVideos;

      // Add order count to product object
      productObj.orderCount =
        orderCountResult.length > 0 ? orderCountResult[0].totalQuantity : 0;
      productObj.orderInstances =
        orderCountResult.length > 0 ? orderCountResult[0].totalOrders : 0;

      return productObj;
    } catch (error) {
      //consolle.error("Repository FindById Error:", error.message);
      throw error;
    }
  }

  // Helper to fetch all variants for a product, with their attributes populated
  async getVariantsWithAttributes(productId, conn) {
    try {
      // Dynamically require Variant schema/model
      const Variant =
        conn.models.Variant || conn.model("Variant", variantSchema);
      if (!conn.models.Attribute) {
        conn.model("Attribute", attributeSchema);
      }
      return Variant.find({ productId, deletedAt: null }).populate(
        "attributes.attributeId"
      );
    } catch (error) {
      //consolle.error("getVariantsWithAttributes error:", error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      //consolle.log("Repo softDelete called with:", id);
      return await this.model.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      );
    } catch (err) {
      //consolle.error("Repo softDelete error:", err);
      throw err;
    }
  }
}

export default ProductRepository;
