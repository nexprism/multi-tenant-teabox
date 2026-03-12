import { body } from "express-validator";

export const brandCreateValidator = [
  body("name")
    .notEmpty()
    .withMessage("Brand name is required")
    .isString()
    .withMessage("Brand name must be a string"),

  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a string"),

  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string or URL"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),

  body("website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("country")
    .optional()
    .isString()
    .withMessage("Country must be a string"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false")
];

export const brandUpdateValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Brand name must be a string"),

  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a string"),

  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),

  body("website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("country")
    .optional()
    .isString()
    .withMessage("Country must be a string"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false")
];