import shippingZoneService from '../services/ShippingZoneService.js';
import { NextResponse } from 'next/server';

class ShippingZoneController {
  async createShippingZone(req, _res, body, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('[ShippingZoneController.createShippingZone] Creating shipping zone for user:', userId, 'Body:', JSON.stringify(body, null, 2), 'Connection:', conn.name || 'global mongoose');
      const shippingZone = await shippingZoneService.createShippingZone(body, conn);
      return NextResponse.json({ status: 'success', message: 'Shipping zone created successfully', shippingZone }, { status: 201 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.createShippingZone] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getShippingZoneByShippingId(req, _res, shippingId, conn) {
    try {
      //consolle.log('[ShippingZoneController.getShippingZoneByShippingId] Fetching shipping zone for shippingId:', shippingId, 'Connection:', conn.name || 'global mongoose');
      const shippingZone = await shippingZoneService.getShippingZoneByShippingId(shippingId, conn);
      return NextResponse.json({ status: 'success', message: 'Shipping zone fetched successfully', shippingZone }, { status: 200 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.getShippingZoneByShippingId] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getAllShippingZones(req, _res, conn) {
    try {
      //consolle.log('[ShippingZoneController.getAllShippingZones] Fetching all shipping zones', 'Connection:', conn.name || 'global mongoose');
      const { searchParams } = new URL(req.url);
      const page = searchParams.get('page') || 1;
      const limit = searchParams.get('limit') || 10;
      const search = searchParams.get('search') || '';
      
      const result = await shippingZoneService.getAllShippingZones(conn, { page, limit, search });
      return NextResponse.json({ 
        status: 'success', 
        message: 'Shipping zones fetched successfully', 
        shippingZones: result.shippingZones,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          itemsPerPage: result.itemsPerPage,
        }
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.getAllShippingZones] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getShippingZonesByShippingId(req, _res, shippingId, conn) {
    try {
      //consolle.log('[ShippingZoneController.getShippingZonesByShippingId] Fetching shipping zones for shippingId:', shippingId, 'Connection:', conn.name || 'global mongoose');
      const shippingZones = await shippingZoneService.getShippingZonesByShippingId(shippingId, conn);
      return NextResponse.json({
        status: 'success',
        message: 'Shipping zones fetched successfully',
        shippingZones,
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.getShippingZonesByShippingId] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async updateShippingZone(req, _res, body, shippingId, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('[ShippingZoneController.updateShippingZone] Updating shipping zone for shippingId:', shippingId, 'for user:', userId, 'Body:', JSON.stringify(body, null, 2), 'Connection:', conn.name || 'global mongoose');
      const shippingZone = await shippingZoneService.updateShippingZone(shippingId, body, conn);
      return NextResponse.json({ status: 'success', message: shippingZone._id ? 'Shipping zone updated successfully' : 'Shipping zone created successfully', shippingZone }, { status: shippingZone._id ? 200 : 201 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.updateShippingZone] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async deleteShippingZone(req, _res, shippingId, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('[ShippingZoneController.deleteShippingZone] Deleting shipping zone for shippingId:', shippingId, 'for user:', userId, 'Connection:', conn.name || 'global mongoose');
      const shippingZone = await shippingZoneService.deleteShippingZone(shippingId, conn);
      return NextResponse.json({ status: 'success', message: 'Shipping zone deleted successfully', shippingZone }, { status: 200 });
    } catch (err) {
      //consolle.error('[ShippingZoneController.deleteShippingZone] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }
}

const shippingZoneController = new ShippingZoneController();
export default shippingZoneController;