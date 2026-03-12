import CouponService from '../services/CouponService.js';

class CouponController {
  constructor(couponService) {
    this.couponService = couponService;
  }

  async create(req, conn) {
    //console.log('Controller received create data:', req.body);
    try {
      const result = await this.couponService.createCoupon(req.body, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  async getAll(query, conn) {
    //console.log('Controller received query:', query);
    try {
      const result = await this.couponService.getAllCoupons(query, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  async update(req, conn) {
    // req: { id, body }
    try {
      const result = await this.couponService.updateCoupon(req.id, req.body, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  async delete(req, conn) {
    // req: { id }
    try {
      const result = await this.couponService.deleteCoupon(req.id, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  async apply(req, conn) {
    //console.log('Controller received apply data:', req.body);
    try {
      const result = await this.couponService.applyCoupon(req.body, conn,req);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

export default CouponController;