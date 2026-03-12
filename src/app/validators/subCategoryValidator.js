import Joi from 'joi';

export const subCategoryCreateValidator = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().allow('', null),
  image: Joi.string().allow('', null),
  thumbnail: Joi.string().allow('', null),
  seoTitle: Joi.string().allow('', null),
  seoDescription: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
  sortOrder: Joi.number().default(0),
  isFeatured: Joi.boolean().default(false),
  parentCategory: Joi.string().required(),
});

export const subCategoryUpdateValidator = Joi.object({
  name: Joi.string(),
  slug: Joi.string(),
  description: Joi.string().allow('', null),
  image: Joi.string().allow('', null),
  thumbnail: Joi.string().allow('', null),
  seoTitle: Joi.string().allow('', null),
  seoDescription: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive'),
  sortOrder: Joi.number(),
  isFeatured: Joi.boolean(),
  parentCategory: Joi.string(),
});