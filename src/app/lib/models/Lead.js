import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: null },
    lastName: { type: String, trim: true, default: null },
    fullName: { type: String, trim: true, default: null },
    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },
    source: {
      type: String,
      enum: ['website', 'newsletter', 'popup', 'referral', 'manual', 'other', 'IVR', 'facebook_lead_ads'],
      default: 'website',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'assigned', 'qualified', 'converted', 'lost','attempted'], default: 'new',
    },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    department: { type: String, default: '' },
    expectedPrice: { type: Number, default: 0 },
    media: { type: String, default: null },
    products: [{ type: String }],
    lastRemark: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    notes: [
      {
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    convertedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    converted: { type: Boolean, default: false },
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    lastCallStatus: {
      type: String,
      enum: [
        'call_not_answered',
        'number_not_reachable',
        'call_back',
        'interested',
        'number_not_connected',
        'order_enquiry',
        'not_interested',
        'switch_off',
        'missed_call',
        'busy',
        'no_response',
        'initiated',
        'attempted',
        'other'
      ],
      default: null
    },
    followUpCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default leadSchema;
