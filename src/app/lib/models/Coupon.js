import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percent', 'flat', 'special'], // added 'special'
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
 // expiresAt: {
  //  type: Date
  //},
  usageLimit: {
    type: Number
  },
  usedCount: {
    type: Number,
    default: 0
  },
  minCartValue: {
    type: Number,
    default: 0
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deleted:{
    type: Boolean,
    default: false
  },
  products: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  ],
  oncePerOrder: {
    type: Boolean,
    default: false
  },
  minCartAppliesToSelectedProducts: {
    type: Boolean,
    default: false
  },
  limitToOnePerCustomer: {
    type: Boolean,
    default: false
  },
  usageByCustomer: [
    {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      count: { type: Number, default: 0 }
    }
  ],
  startAt: {
    type: Date
  },
  endAt: {
    type: Date
  },
  combinations: {
    productDiscounts: { type: Boolean, default: false },
    orderDiscounts: { type: Boolean, default: false },
    shippingDiscounts: { type: Boolean, default: false }
  },
  eligibility: {
    allCustomers: { type: Boolean, default: true },
    specificCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
    specificSegments: [{ type: String }] // allowed strings: 'neverPurchased','purchasedMoreThanOnce','purchasedAtLeastOnce','abandonedCart30Days','emailSubscribers','purchasedMoreThan3Times'
  },

  // New: payment-specific discount configuration (optional). If paymentSpecific = true, the paymentDiscounts entry is used.
  paymentSpecific: {
    type: Boolean,
    default: false
  },
  paymentDiscounts: {
    prepaid: {
      type: {
        type: String,
        enum: ['percent', 'flat', 'special']
      },
      value: { type: Number },
      specialAmount: { type: Number } // for any 'special' mode
    },
    cod: {
      type: {
        type: String,
        enum: ['percent', 'flat', 'special']
      },
      value: { type: Number },
      specialAmount: { type: Number }
    }
  },
  // New: product quantity rules
  minQuantity: { type: Number, default: 0 },
  minQuantityAppliesToSelectedProducts: { type: Boolean, default: false },

  // New: shipping discount metadata
  shippingDiscount: {
    type: {
      type: String,
      enum: ['none', 'free', 'flat', 'percent']
    },
    value: { type: Number, default: 0 }
  },

  // New: COD rules
  codMaxOrderValue: { type: Number }, // maximum allowed order value for COD (coupon-specific)
  enforceSingleOutstandingCOD: { type: Boolean, default: false }, // if true, prevent new COD until previous COD order delivered

  // New: ensure discounts apply on actual price (not sale price)
  applyOnActualPrice: { type: Boolean, default: true }

}, {
  timestamps: true
});

export const CouponSchema = couponSchema;
export const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default CouponModel;