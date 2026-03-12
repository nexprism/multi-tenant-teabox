import Joi from "joi";

export const contactCreateValidator = Joi.object({
  name: Joi.string().required().trim().min(2).max(200),
  email: Joi.string().required().trim().email().max(254),
  phone: Joi.string().required().trim().min(10).max(15),
  message: Joi.string().required().trim().min(5).max(5000),
});

export const contactQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().optional().allow(""),
  status: Joi.string().valid("new", "read", "closed").optional(),
  // primary keys expected by repository/service
  sort: Joi.string().optional(),
  order: Joi.string().valid("asc", "desc").optional(),
})
  // accept frontend aliases and normalize them to the expected keys
  .rename("sortBy", "sort", { ignoreUndefined: true, override: true })
  .rename("sortOrder", "order", { ignoreUndefined: true, override: true });

export const contactIdValidator = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const contactUpdateValidator = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  email: Joi.string().trim().email().max(254).optional(),
  phone: Joi.string().trim().min(10).max(15).optional(),
  message: Joi.string().trim().min(5).max(5000).optional(),
  status: Joi.string().valid("new", "read", "closed").optional(),
}).or("name", "email", "message", "status");
