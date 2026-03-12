import Joi from 'joi';

const baseCategorySchema = {
  name: Joi.string().min(2).max(50).messages({
    'string.empty': 'Category name is required.',
    'string.min': 'Category name must be at least 2 characters.',
    'string.max': 'Category name must be at most 50 characters.'
  }),

  slug: Joi.string().min(2).max(100).lowercase().required(),

  description: Joi.string().allow('', null),

  image: Joi.string().allow('', null).messages({
    'string.uri': 'Image must be a valid URL.'
  }),

  thumbnail: Joi.string().allow('', null),

  seoTitle: Joi.string().allow('', null),

  seoDescription: Joi.string().allow('', null),

  status: Joi.string().valid('Active', 'Inactive').default('Active').messages({
    'any.only': 'Status must be either Active or Inactive.'
  }),

  sortOrder: Joi.number().integer().min(0).default(0),

  isFeatured: Joi.boolean().default(false),

  allowPrepaidOnly: Joi.boolean().optional(),

  disableCOD: Joi.boolean().optional()
};

// ✅ Create Validator
export const categoryCreateValidator = Joi.object({
  name: baseCategorySchema.name.required(),
  slug: baseCategorySchema.slug.required(),
  description: baseCategorySchema.description.optional(),
  image: baseCategorySchema.image.optional(),
  thumbnail: baseCategorySchema.thumbnail.optional(),
  seoTitle: baseCategorySchema.seoTitle.optional(),
  seoDescription: baseCategorySchema.seoDescription.optional(),
  status: baseCategorySchema.status.optional(),
  sortOrder: baseCategorySchema.sortOrder.optional(),
  isFeatured: baseCategorySchema.isFeatured.optional(),
  allowPrepaidOnly: baseCategorySchema.allowPrepaidOnly.optional(),
  disableCOD: baseCategorySchema.disableCOD.optional()
});

// ✅ Update Validator
export const categoryUpdateValidator = Joi.object({
  name: baseCategorySchema.name.optional(),
  slug: baseCategorySchema.slug.optional(),
  description: baseCategorySchema.description.optional(),
  image: baseCategorySchema.image.optional(),
  thumbnail: baseCategorySchema.thumbnail.optional(),
  seoTitle: baseCategorySchema.seoTitle.optional(),
  seoDescription: baseCategorySchema.seoDescription.optional(),
  status: baseCategorySchema.status.optional(),
  sortOrder: baseCategorySchema.sortOrder.optional(),
  isFeatured: baseCategorySchema.isFeatured.optional(),
  allowPrepaidOnly: baseCategorySchema.allowPrepaidOnly.optional(),
  disableCOD: baseCategorySchema.disableCOD.optional()
});
