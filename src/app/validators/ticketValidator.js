import Joi from 'joi';

export const ticketCreateValidator = Joi.object({
  subject: Joi.string().required().trim().min(3).max(200),
  description: Joi.string().required().trim().min(10).max(2000),
  orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null), // ObjectId validation
  attachments: Joi.array().items(Joi.string().trim()).optional(), // Array of image names
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  customer: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/), // ObjectId validation
 assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null), // ObjectId validation
  createdBy: Joi.string().hex().length(24).optional() 
});

export const ticketUpdateValidator = Joi.object({
  subject: Joi.string().trim().min(3).max(200),
  description: Joi.string().trim().min(10).max(2000),
  orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null), // ObjectId validation
  attachments: Joi.array().items(Joi.string().trim()).optional(), // Array of image names
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null), // ObjectId validation
  customer: Joi.string().pattern(/^[0-9a-fA-F]{24}$/), 
  createdBy: Joi.string().hex().length(24).optional() 
});

export const ticketReplyValidator = Joi.object({
  message: Joi.string().required().trim().min(1).max(2000),
  attachments: Joi.array().items(Joi.string()).optional(), // Array of image names
  repliedBy: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/), 
  repliedAt: Joi.date(), 
  isStaff: Joi.boolean().default(false),

});
