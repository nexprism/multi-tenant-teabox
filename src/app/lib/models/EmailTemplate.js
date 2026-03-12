import mongoose from 'mongoose';

export const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Order Created"
  },
  subject: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
    default: 'no-reply@example.com',
  },
  content: {
    type: String,
    required: true, // Can include variables like {order_id}
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

export default mongoose.models.EmailTemplate ||
  mongoose.model('EmailTemplate', EmailTemplateSchema);
