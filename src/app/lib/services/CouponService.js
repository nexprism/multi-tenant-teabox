import CouponRepository from '../repository/CouponRepository.js';
import mongoose from 'mongoose';


class CouponService {
  constructor(couponRepository) {
    this.couponRepository = couponRepository;
  }

  async getByIdCoupon(id, conn) {
    try {
      if (!id) throw new Error('Coupon id is required');
      const coupon = await this.couponRepository.model.findOne({ _id: id, deletedAt: null });
      if (!coupon) {
        return { success: false, message: 'Coupon not found', data: null };
      }
      return { success: true, message: 'Coupon fetched successfully', data: coupon };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  async updateCoupon(id, data, conn) {
    try {
      if (!id) throw new Error('Coupon id is required');
      const coupon = await this.couponRepository.model.findById(id);
      if (!coupon) {
        return { success: false, message: 'Coupon not found', data: null };
      }
      
      // Clean date fields - convert empty strings to undefined/null
      const cleanData = { ...data };
      if (cleanData.startAt === '' || cleanData.startAt === null) {
        cleanData.startAt = undefined; // Set to undefined to remove the field
      } else if (cleanData.startAt) {
        const startDate = new Date(cleanData.startAt);
        if (isNaN(startDate.getTime())) {
          cleanData.startAt = undefined; // Invalid date, remove it
        } else {
          cleanData.startAt = startDate;
        }
      }

      if (cleanData.endAt === '' || cleanData.endAt === null) {
        cleanData.endAt = undefined; // Set to undefined to remove the field
      } else if (cleanData.endAt) {
        const endDate = new Date(cleanData.endAt);
        if (isNaN(endDate.getTime())) {
          cleanData.endAt = undefined; // Invalid date, remove it
        } else {
          cleanData.endAt = endDate;
        }
      }

      // Validate start/end dates (only if both are provided)
      if (cleanData.startAt && cleanData.endAt && cleanData.startAt > cleanData.endAt) {
        throw new Error('startAt must be before endAt');
      }

      Object.assign(coupon, cleanData);
      await coupon.save();
      return { success: true, message: 'Coupon updated', data: coupon };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  async deleteCoupon(id, conn) {
    try {
      if (!id) throw new Error('Coupon id is required');
      const coupon = await this.couponRepository.model.findById(id);
      if (!coupon) {
        return { success: false, message: 'Coupon not found', data: null };
      }
      await this.couponRepository.softDelete(id);
      return { success: true, message: 'Coupon deleted' };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  async createCoupon(data, conn) {
    try {
      // Validate required fields
      if (!data.code || !data.type || (data.value === undefined)) {
        throw new Error('Code, type, and value are required');
      }

      // Ensure type is valid
      if (!['percent', 'flat','special'].includes(data.type)) {
        throw new Error('Invalid coupon type. Must be "percent", "flat", or "special"');
      }

      // Validate value
      if (data.value <= 0) {
        throw new Error('Value must be greater than 0');
      }

      if (data.minCartValue && data.minCartValue < 0) {
        throw new Error('Minimum cart value cannot be negative');
      }

      if (data.usageLimit && data.usageLimit <= 0) {
        throw new Error('Usage limit must be greater than 0');
      }

      // Clean date fields - convert empty strings to undefined/null
      const cleanData = { ...data };
      if (cleanData.startAt === '' || cleanData.startAt === null) {
        delete cleanData.startAt;
      } else if (cleanData.startAt) {
        const startDate = new Date(cleanData.startAt);
        if (isNaN(startDate.getTime())) {
          delete cleanData.startAt; // Invalid date, don't include it
        } else {
          cleanData.startAt = startDate;
        }
      }

      if (cleanData.endAt === '' || cleanData.endAt === null) {
        delete cleanData.endAt;
      } else if (cleanData.endAt) {
        const endDate = new Date(cleanData.endAt);
        if (isNaN(endDate.getTime())) {
          delete cleanData.endAt; // Invalid date, don't include it
        } else {
          cleanData.endAt = endDate;
        }
      }

      // Validate start/end dates (only if both are provided)
      if (cleanData.startAt && cleanData.endAt && cleanData.startAt > cleanData.endAt) {
        throw new Error('startAt must be before endAt');
      }

      // If products provided ensure it's an array
      if (cleanData.products && !Array.isArray(cleanData.products)) {
        throw new Error('products must be an array of product ids');
      }

      // Create coupon with cleaned data
      const coupon = await this.couponRepository.create(cleanData);
      return {
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  async getAllCoupons(query = {}, conn) {
    try {
      const {
        page = 1,
        limit = 10,
        filters = '{}',
        sort = '{}',
        populateFields = [],
        selectFields = {},
        isActive
      } = query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      const parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;

      // Build filter conditions
      const filterConditions = { ...parsedFilters };
      if (isActive !== undefined) {
        filterConditions.isActive = isActive === 'true' || isActive === true;
      }

      filterConditions.deletedAt = null;

      // Build sort conditions
      const sortConditions = {};
      for (const [field, direction] of Object.entries(parsedSort)) {
        sortConditions[field] = direction === 'asc' ? 1 : -1;
      }

      // Fetch coupons with pagination
      const { results, totalCount, currentPage, pageSize } = await this.couponRepository.getAll(
        filterConditions,
        sortConditions,
        pageNum,
        limitNum,
        populateFields,
        selectFields
      );

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      return {
        success: true,
        message: 'Coupons fetched successfully',
        data: results,
        currentPage,
        totalPages,
        totalCount
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }


  async applyCoupon(data, conn,req) {
    try {
      // Accept either { code, cartValue, cartItems, customerId, paymentMethod } 
      const { code, cartValue, cartItems, paymentMethod = 'prepaid' } = data;
      if (!code) throw new Error('Coupon code is required');
      console.log('Applying coupon code:', req);
const customerId=req?.user?._id || req?.user?.id || data.customerId || null;

      // Normalize cartItems and cartValue; use actualPrice if present (apply on actual price)
      let items = [];
      let totalCartValue = 0;
      if (Array.isArray(cartItems) && cartItems.length > 0) {
        // each item expected: { productId, variantId?, price, actualPrice?, quantity }
        items = cartItems.map(i => ({
          productId: i.productId,
          price: Number(i.price || 0), // sale price
          actualPrice: i.actualPrice !== undefined ? Number(i.actualPrice) : undefined,
          quantity: Number(i.quantity || 1)
        }));
        // Use actualPrice when coupon.applyOnActualPrice is true; we'll decide per-coupon below.
        totalCartValue = items.reduce((s, it) => s + ((it.actualPrice !== undefined ? it.actualPrice : it.price) * it.quantity), 0);
      } else {
        if (cartValue === undefined) throw new Error('cartValue or cartItems are required');
        if (typeof cartValue !== 'number' || cartValue < 0) {
          throw new Error('Cart value must be a non-negative number');
        }
        totalCartValue = cartValue;
      }

      const coupon = await this.couponRepository.findByCode(code);
      if (!coupon) {
        throw new Error('Invalid Coupon');
      }

      const now = new Date();

      // Check active flag and deletion
      if (!coupon.isActive || coupon.deletedAt) throw new Error('Coupon is not active');

      // Check start/end window
      console.log('Coupon validity period:', coupon.startAt, coupon.endAt, now);
      if (coupon.startAt && new Date(coupon.startAt) > now) {
        throw new Error('Coupon is not active yet');
      }
      if (coupon.endAt && new Date(coupon.endAt) < now) {
        throw new Error('Coupon has expired');
      }

      // Check usageLimit (global)
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new Error('Coupon usage limit exceeded');
      }

      // Validate customer eligibility using coupon.eligibility
      if (coupon.eligibility && !coupon.eligibility.allCustomers) {
        if (!customerId) throw new Error('Customer required for this coupon');
        // direct inclusion check
        const specific = (coupon.eligibility.specificCustomers || []).map(String);
        if (specific.length > 0 && specific.includes(String(customerId))) {
          // allowed
        } else if ((coupon.eligibility.specificSegments || []).length > 0) {
          // evaluate segments; be defensive if conn/models missing
          const segments = coupon.eligibility.specificSegments || [];
          let matchedSegment = false;
          // safe model getter: prefer connection models (if provided) else mongoose.models, never call conn.model(name)
          const getModel = (name) => {
            try {
              return (conn && conn.models && conn.models[name]) || mongoose.models[name] || null;
            } catch (e) {
              return mongoose.models[name] || null;
            }
          };

          // Try to get models safely without triggering "Schema hasn't been registered" errors
          const OrderModel = getModel('Order');
          const CheckoutModel = getModel('Checkout');
          const CustomerModel = getModel('Customer');

          // fetch minimal customer/order info if needed
          let orderCount = null;
          if (OrderModel) {
            try {
              orderCount = await OrderModel.countDocuments({ customerId: customerId });
            } catch (e) { /* ignore */ }
          }

          for (const seg of segments) {
            if (seg === 'neverPurchased') {
              if (orderCount === null && OrderModel) orderCount = await OrderModel.countDocuments({ customerId });
              if (orderCount !== null && orderCount === 0) matchedSegment = true;
            } else if (seg === 'purchasedMoreThanOnce') {
              if (orderCount === null && OrderModel) orderCount = await OrderModel.countDocuments({ customerId });
              if (orderCount !== null && orderCount > 1) matchedSegment = true;
            } else if (seg === 'purchasedAtLeastOnce') {
              if (orderCount === null && OrderModel) orderCount = await OrderModel.countDocuments({ customerId });
              if (orderCount !== null && orderCount >= 1) matchedSegment = true;
            } else if (seg === 'purchasedMoreThan3Times') {
              if (orderCount === null && OrderModel) orderCount = await OrderModel.countDocuments({ customerId });
              if (orderCount !== null && orderCount > 3) matchedSegment = true;
            } else if (seg === 'abandonedCart30Days') {
              if (CheckoutModel) {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                try {
                  const abandoned = await CheckoutModel.findOne({
                    customerId,
                    updatedAt: { $gte: thirtyDaysAgo },
                    $or: [{ status: 'abandoned' }, { completed: false }]
                  }).lean();
                  if (abandoned) matchedSegment = true;
                } catch (e) { /* ignore */ }
              }
            } else if (seg === 'emailSubscribers') {
              if (CustomerModel) {
                try {
                  const cust = await CustomerModel.findById(customerId).select('isEmailSubscriber subscribed emailSubscribed').lean();
                  if (cust && (cust.isEmailSubscriber || cust.subscribed || cust.emailSubscribed)) matchedSegment = true;
                } catch (e) { /* ignore */ }
              }
            }
            if (matchedSegment) break;
          }

          if (!matchedSegment) {
            throw new Error('Customer is not eligible for this coupon');
          }
        } else {
          // If specificCustomers provided but did not match
          throw new Error('Customer is not eligible for this coupon');
        }
      }

      // Check per-customer limit
      if (coupon.limitToOnePerCustomer && customerId) {
        const usageEntry = (coupon.usageByCustomer || []).find(u => String(u.customerId) === String(customerId));
        if (usageEntry && usageEntry.count >= 1) {
          throw new Error('Coupon limited to one use per customer');
        }
      }

      // Determine eligible amount based on product targeting and quantity rules
      let eligibleAmount = totalCartValue;
      let totalEligibleQuantity = 0;
      let hasEligibleItems = true;

      if (coupon.products && coupon.products.length > 0) {
        if (!items.length) throw new Error('Cart items are required for product-specific coupons');
        const productSet = new Set(coupon.products.map(String));
        const eligibleItems = items.filter(it => productSet.has(String(it.productId)));
        totalEligibleQuantity = eligibleItems.reduce((s, it) => s + (it.quantity || 0), 0);
        // decide price field based on coupon.applyOnActualPrice flag
        eligibleAmount = eligibleItems.reduce((s, it) => {
          const priceToUse = (coupon.applyOnActualPrice && it.actualPrice !== undefined) ? it.actualPrice : it.price;
          return s + (priceToUse * it.quantity);
        }, 0);
        hasEligibleItems = eligibleItems.length > 0;
        if (!hasEligibleItems) throw new Error('No eligible items in cart for this coupon');

        // minQuantity enforcement scoped to selected products if configured
        if (coupon.minQuantity && coupon.minQuantity > 0) {
          const compareQty = coupon.minQuantityAppliesToSelectedProducts ? totalEligibleQuantity : items.reduce((s, it) => s + (it.quantity || 0), 0);
          if (compareQty < coupon.minQuantity) throw new Error(`Minimum quantity of ${coupon.minQuantity} required`);
        }
      } else {
        // no product scoping, still enforce minQuantity if present
        if (coupon.minQuantity && coupon.minQuantity > 0) {
          const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
          if (totalQty < coupon.minQuantity) throw new Error(`Minimum quantity of ${coupon.minQuantity} required`);
        }
        // determine eligibleAmount using applyOnActualPrice flag
        // if no cart items were provided, fall back to totalCartValue (so cartValue-only requests work)
        if (!items || items.length === 0) {
          eligibleAmount = totalCartValue;
        } else {
          eligibleAmount = items.reduce((s, it) => {
            const priceToUse = (coupon.applyOnActualPrice && it.actualPrice !== undefined) ? it.actualPrice : it.price;
            return s + (priceToUse * it.quantity);
          }, 0);
        }
      }

      // Minimum cart value check (may apply to selected products)
      if (coupon.minCartValue && coupon.minCartValue > 0) {
        const compareAmount = coupon.minCartAppliesToSelectedProducts ? eligibleAmount : totalCartValue;
        if (compareAmount < coupon.minCartValue) {
          throw new Error(`Cart value must be at least ${coupon.minCartValue}`);
        }
      }

      // Payment-specific rules: COD maximum order value / enforce outstanding COD order
      const defaultMaxCOD = 1500; // as per requirement #10
      if (paymentMethod === 'cod') {
        const maxCod = coupon.codMaxOrderValue || defaultMaxCOD;
        if (totalCartValue > maxCod) {
          throw new Error(`Maximum order value for COD is ${maxCod}`);
        }
        if (coupon.enforceSingleOutstandingCOD && customerId) {
          const OrderModelForCOD = getModel('Order');
          if (OrderModelForCOD) {
            const outstanding = await OrderModelForCOD.findOne({
              customerId,
              paymentMethod: 'cod',
              status: { $nin: ['delivered', 'cancelled'] }
            }).lean();
            if (outstanding) {
              throw new Error('You have an outstanding COD order that is not yet delivered. Please use prepaid payment until delivery is complete.');
            }
          }
        }
      }

      // Determine which discount rule to apply: payment-specific or top-level
      let effectiveType = coupon.type;
      let effectiveValue = coupon.value;
      let effectiveSpecialAmount = coupon.specialAmount;

      if (coupon.paymentSpecific && coupon.paymentDiscounts && paymentMethod) {
        const pdisc = coupon.paymentDiscounts[paymentMethod];
        if (pdisc && pdisc.type) {
          effectiveType = pdisc.type;
          effectiveValue = pdisc.value;
          effectiveSpecialAmount = pdisc.specialAmount;
        }
      }

      // Calculate discount
      let discount = 0;
      if (effectiveType === 'flat') {
        if (coupon.products && coupon.products.length > 0 && !coupon.oncePerOrder) {
          discount = (effectiveValue || 0) * (totalEligibleQuantity || 0);
        } else {
          discount = effectiveValue || 0;
        }
        if (discount > eligibleAmount) discount = eligibleAmount;
      } else if (effectiveType === 'percent') {
        discount = ((effectiveValue || 0) / 100) * eligibleAmount;
      } else if (effectiveType === 'special') {
        // apply specialAmount if provided, else fallback to value
        discount = effectiveSpecialAmount !== undefined ? effectiveSpecialAmount : (effectiveValue || 0);
        // if product-scoped and not oncePerOrder, apply per eligible qty
        if (coupon.products && coupon.products.length > 0 && !coupon.oncePerOrder) {
          discount = discount * (totalEligibleQuantity || 0);
        }
        if (discount > eligibleAmount) discount = eligibleAmount;
      }

      if (discount <= 0) {
        throw new Error('Calculated discount is zero');
      }

      // Shipping charge suggestion per requirement #9
      let shippingCharge = 0;
      try {
        if (paymentMethod === 'cod') {
          shippingCharge = totalCartValue <= 500 ? 80 : 0;
        } else {
          shippingCharge = totalCartValue <= 500 ? 40 : 0;
        }
      } catch (e) { shippingCharge = 0; }

      // Increment used counts (global and per customer if provided)
      await this.couponRepository.incrementUsedCount(coupon._id, customerId);

      return {
        success: true,
        message: 'Coupon applied successfully',
        data: {
          discount,
          coupon,
          shippingCharge
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

}

export default CouponService;