import Joi from 'joi';

export const attributeCreateValidator = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Attribute name is required',
    'any.required': 'Attribute name is required'
  }),
  description: Joi.string().allow('').optional(),
  values: Joi.array().items(Joi.string().trim()).min(0).required().messages({
    'array.base': 'Values must be an array',
    'any.required': 'Values field is required'
  }),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

export const attributeUpdateValidator = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(''),
  values: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive'),
});


