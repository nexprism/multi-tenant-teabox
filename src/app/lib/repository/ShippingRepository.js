import mongoose from "mongoose";
import { shippingSchema } from "../models/Shipping.js";

class ShippingRepository {
  constructor() {
    this.getShippingModel = this.getShippingModel.bind(this);
    this.createShipping = this.createShipping.bind(this);
    this.getShippingById = this.getShippingById.bind(this);
    this.getAllShipping = this.getAllShipping.bind(this);
    this.updateShipping = this.updateShipping.bind(this);
    this.deleteShipping = this.deleteShipping.bind(this);
  }

  getShippingModel(conn) {
    if (!conn) {
      throw new Error("Database connection is required");
    }
    //consolle.log(
    //   "ShippingRepository using connection:",
    //   conn.name || "global mongoose"
    // );
    return conn.models.Shipping || conn.model("Shipping", shippingSchema);
  }

  async createShipping(data, conn) {
    const Shipping = this.getShippingModel(conn);
    const shipping = new Shipping(data);
    return await shipping.save();
  }

  async getShippingById(id, conn) {
    const Shipping = this.getShippingModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error("Invalid shipping ID");
    const shipping = await Shipping.findOne({ _id: id, deletedAt: null });
    if (!shipping)
      throw new Error("Shipping method not found or has been deleted");
    return shipping;
  }

  async getAllShipping(filters = {}, conn) {
    const Shipping = this.getShippingModel(conn);

    // Build base query
    const query = { deletedAt: null };

    // If a JSON 'filters' param was passed (e.g. filters=%7B%22status%22%3A%22inactive%22%7D)
    if (filters.filters) {
      try {
        const parsed =
          typeof filters.filters === "string"
            ? JSON.parse(filters.filters)
            : filters.filters;
        if (parsed.status) {
          query.status = parsed.status;
        }
        // add more parsed filters mapping here if needed
      } catch (err) {
        //consolle.warn("Invalid JSON in filters param, ignoring:", err.message);
      }
    }

    // If explicit status query param provided (overrides default behavior)
    if (filters.status) {
      query.status = filters.status;
    }

    // If no status is specified, do not filter by status and return all shippings
    // (previous behavior forced `status: "active"` here; removed per requirement)

    // Handle searchFields JSON param (e.g. searchFields={"name":"del"})
    if (filters.searchFields) {
      try {
        const sf =
          typeof filters.searchFields === "string"
            ? JSON.parse(filters.searchFields)
            : filters.searchFields;
        if (sf.name) {
          query.name = { $regex: sf.name, $options: "i" };
        }
        // extend mapping for other searchable fields here
      } catch (err) {
        //consolle.warn(
        //   "Invalid JSON in searchFields param, ignoring:",
        //   err.message
        // );
      }
    }

    // Paging
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = (
      filters.sortOrder ||
      filters.order ||
      "asc"
    ).toLowerCase();
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination + sorting
    const results = await Shipping.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    return results;
  }

  async updateShipping(id, update, conn) {
    //consolle.log("Updating shipping method:", id, update);
    const Shipping = this.getShippingModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error("Invalid shipping ID");
    const shipping = await Shipping.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: update },
      { new: true }
    );
    if (!shipping)
      throw new Error("Shipping method not found or has been deleted");
    return shipping;
  }

  async deleteShipping(id, conn) {
    const Shipping = this.getShippingModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error("Invalid shipping ID");
    const shipping = await Shipping.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), status: "inactive" } },
      { new: true }
    );
    if (!shipping)
      throw new Error("Shipping method not found or has been deleted");
    return shipping;
  }
}

const shippingRepository = new ShippingRepository();
export default shippingRepository;
