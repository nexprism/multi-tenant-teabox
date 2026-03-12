import mongoose from 'mongoose';
import { shippingZoneSchema } from '../models/ShippingZone.js';
import { shippingSchema } from '../models/Shipping.js'; // Import the schema

class ShippingZoneRepository {
  constructor() {
    this.getShippingZoneModel = this.getShippingZoneModel.bind(this);
    this.createShippingZone = this.createShippingZone.bind(this);
    this.getShippingZoneByShippingId = this.getShippingZoneByShippingId.bind(this);
    this.getAllShippingZones = this.getAllShippingZones.bind(this);
    this.updateShippingZone = this.updateShippingZone.bind(this);
    this.deleteShippingZone = this.deleteShippingZone.bind(this);
    this.getShippingZonesByShippingId = this.getShippingZonesByShippingId.bind(this);
  }

  getShippingZoneModel(conn) {
    if (!conn) {
      throw new Error('Database connection is required');
    }
    console.log('ShippingZoneRepository using connection:', conn.name || 'global mongoose');
    // Clear cached model for this connection to ensure updated schema is used
    delete conn.models.ShippingZone;
    // Ensure Shipping model is registered for the connection
    if (!conn.models.Shipping) {
      conn.model('Shipping', shippingSchema);
    }
    return conn.models.ShippingZone || conn.model('ShippingZone', shippingZoneSchema);
  }

  async createShippingZone(data, conn) {
    const ShippingZone = this.getShippingZoneModel(conn);
    const shippingZone = new ShippingZone(data);
    return await shippingZone.save();
  }

  async getShippingZoneByShippingId(shippingId, conn) {
    const ShippingZone = this.getShippingZoneModel(conn);
    if (!mongoose.Types.ObjectId.isValid(shippingId)) throw new Error('Invalid shipping ID');
    const shippingZone = await ShippingZone.findOne({ shippingId }).populate('shippingId');
    return shippingZone;
  }

  async getAllShippingZones(conn, { page, limit, search }) {
    const ShippingZone = this.getShippingZoneModel(conn);
    const query = search ? { 'postalCodes.code': { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [shippingZones, totalItems] = await Promise.all([
      ShippingZone.find(query)
        .populate('shippingId')
        .skip(skip)
        .limit(limit)
        .lean(),
      ShippingZone.countDocuments(query),
    ]);

    return {
      shippingZones,
      totalItems,
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getShippingZonesByShippingId(shippingId, conn) {
    const ShippingZone = this.getShippingZoneModel(conn);
    const shippingZones = await ShippingZone.find({ shippingId })
      .populate('shippingId')
      .lean();
    return shippingZones;
  }

  async updateShippingZone(id, update, conn) {
    const ShippingZone = this.getShippingZoneModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid shipping zone ID');
    const shippingZone = await ShippingZone.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).populate('shippingId');
    if (!shippingZone) throw new Error('Shipping zone not found');
    return shippingZone;
  }

  async deleteShippingZone(shippingId, conn) {
    const ShippingZone = this.getShippingZoneModel(conn);
    if (!mongoose.Types.ObjectId.isValid(shippingId)) throw new Error('Invalid shipping ID');
    const shippingZone = await ShippingZone.findOneAndDelete({ shippingId });
    if (!shippingZone) throw new Error('Shipping zone not found');
    return shippingZone;
  }
}

export default new ShippingZoneRepository();