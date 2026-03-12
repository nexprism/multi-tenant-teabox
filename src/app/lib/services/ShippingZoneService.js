import shippingZoneRepository from '../repository/ShippingZoneRepository.js';
import mongoose from 'mongoose';
import { shippingSchema } from '../models/Shipping.js'; // Import the schema

class ShippingZoneService {
  async createShippingZone(data, conn) {
    //console.log('[ShippingZoneService.createShippingZone] Creating shipping zone:', JSON.stringify(data, null, 2), 'Connection:', conn.name || 'global mongoose');
    const existing = await this.getShippingZoneByShippingId(data.shippingId, conn);
    if (existing) {
      throw new Error('Shipping zone already exists for this shipping ID');
    }
    await this.validateShippingZoneData(data, false, conn);
    return await shippingZoneRepository.createShippingZone(data, conn);
  }

  async getShippingZoneByShippingId(shippingId, conn) {
    //console.log('[ShippingZoneService.getShippingZoneByShippingId] Fetching shipping zone for shippingId:', shippingId, 'Connection:', conn.name || 'global mongoose');
    return await shippingZoneRepository.getShippingZoneByShippingId(shippingId, conn);
  }

  async getAllShippingZones(conn, { page = 1, limit = 10, search = '' }) {
    //console.log('[ShippingZoneService.getAllShippingZones] Fetching all shipping zones', 'Connection:', conn.name || 'global mongoose', 'Page:', page, 'Limit:', limit, 'Search:', search);
    return await shippingZoneRepository.getAllShippingZones(conn, { page, limit, search });
  }

  async getShippingZonesByShippingId(shippingId, conn) {
    //console.log('[ShippingZoneService.getShippingZonesByShippingId] Fetching shipping zones for shippingId:', shippingId, 'Connection:', conn.name || 'global mongoose');
    return await shippingZoneRepository.getShippingZonesByShippingId(shippingId, conn);
  }

  async updateShippingZone(shippingId, data, conn) {
    //console.log('[ShippingZoneService.updateShippingZone] Updating shipping zone for shippingId:', shippingId, 'Data:', JSON.stringify(data, null, 2), 'Connection:', conn.name || 'global mongoose');
    const existing = await this.getShippingZoneByShippingId(shippingId, conn);
    if (existing) {
      await this.validateShippingZoneData(data, true, conn);
      return await shippingZoneRepository.updateShippingZone(existing._id, data, conn);
    } else {
      data.shippingId = shippingId;
      await this.validateShippingZoneData(data, false, conn);
      return await this.createShippingZone(data, conn);
    }
  }

  async deleteShippingZone(shippingId, conn) {
    //console.log('[ShippingZoneService.deleteShippingZone] Deleting shipping zone for shippingId:', shippingId, 'Connection:', conn.name || 'global mongoose');
    return await shippingZoneRepository.deleteShippingZone(shippingId, conn);
  }

  async validateShippingZoneData(data, isUpdate = false, conn) {
    if (!isUpdate) {
      if (!data.shippingId || !mongoose.Types.ObjectId.isValid(data.shippingId)) {
        throw new Error('Valid shipping ID is required');
      }
      if (!data.postalCodes || !Array.isArray(data.postalCodes) || data.postalCodes.length === 0) {
        throw new Error('At least one postal code with price is required');
      }
    } else {
      if (data.shippingId && !mongoose.Types.ObjectId.isValid(data.shippingId)) {
        throw new Error('Valid shipping ID is required');
      }
      if (data.postalCodes && (!Array.isArray(data.postalCodes) || data.postalCodes.length === 0)) {
        throw new Error('At least one postal code with price is required if updating postal codes');
      }
    }

    // Validate postalCodes structure
    if (data.postalCodes) {
      data.postalCodes.forEach((item, index) => {
        if (!item.code || typeof item.code !== 'string' || item.code.trim() === '') {
          throw new Error(`Postal code at index ${index} is invalid`);
        }
        if (item.price == null || typeof item.price !== 'number' || item.price < 0) {
          throw new Error(`Price at index ${index} must be a non-negative number`);
        }
      });
    }

    // Check if shippingId exists in the Shipping collection
    if (data.shippingId) {
      const Shipping = conn.models.Shipping || conn.model('Shipping', shippingSchema);
      const shipping = await Shipping.findById(data.shippingId);
      if (!shipping) {
        throw new Error('Shipping ID does not exist');
      }
    }
  }
}

const shippingZoneService = new ShippingZoneService();
export default shippingZoneService;