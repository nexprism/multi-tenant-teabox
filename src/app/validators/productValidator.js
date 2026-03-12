import Joi from 'joi';

export const createProductValidator = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  category: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  attributeSet: Joi.array().items(
    Joi.object({
      attributeId: Joi.string().hex().length(24).required(),
    })
  ).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

export const updateProductValidator = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  attributeSet: Joi.array().items(
    Joi.object({
      attributeId: Joi.string().hex().length(24).required(),
    })
  ).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});