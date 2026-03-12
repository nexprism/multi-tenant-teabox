import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null, // optional, if ticket is related to an order
    },
    attachments: [ 
      {
        type: String, // Store only the image name or path
        required: false,
      }
    ],
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // support staff
    },
    replies: [
      {
        message: {
          type: String,
          required: true,
          trim: true,
        },
        attachments: [ 
          {
            type: String, // Store only the image name or path
            required: false,
          }
        ],
        repliedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        repliedAt: {
          type: Date,
          default: Date.now,
        },
        isStaff: {
          type: Boolean,
          default: false,
        },
      }
    ],
   
     isDeleted: {
      type: Boolean,
      default: false,
      index: true, // helps with filtering out soft-deleted tickets
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  
  },
  {
    timestamps: true,
  }
);

export default ticketSchema;