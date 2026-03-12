import mongoose from 'mongoose';
import Attribute from '../lib/models/Attribute.js';
import Product from '../lib/models/Product.js';

export const validateVariantInput = async (variantData) => {
  const errors = [];

  // Basic field checks
  if (!variantData.productId || !mongoose.Types.ObjectId.isValid(variantData.productId)) {
    errors.push('Invalid or missing productId.');
  }
  if (!variantData.title || typeof variantData.title !== 'string') {
    errors.push('Title is required and must be a string.');
  }
  if (typeof variantData.price !== 'number' || variantData.price < 0) {
    errors.push('Price must be a valid number.');
  }
  if (typeof variantData.stock !== 'number' || variantData.stock < 0) {
    errors.push('Stock must be a valid number.');
  }

  // Attribute validation
  if (!Array.isArray(variantData.attributes) || variantData.attributes.length === 0) {
    errors.push('At least one attribute is required.');
  } else {
    const product = await Product.findById(variantData.productId);
    if (!product) {
      errors.push('Product not found.');
    } else {
      const allowedAttributeIds = product.attributeSet.map(attr => attr.attributeId.toString());

      for (const attr of variantData.attributes) {
        if (
          !attr.attributeId ||
          !mongoose.Types.ObjectId.isValid(attr.attributeId) ||
          !allowedAttributeIds.includes(attr.attributeId)
        ) {
          errors.push(`Attribute ${attr.attributeId} is not allowed for this product.`);
          continue;
        }

        const attribute = await Attribute.findById(attr.attributeId);
        if (!attribute) {
          errors.push(`Attribute not found: ${attr.attributeId}`);
          continue;
        }

        if (!attribute.values.includes(attr.value)) {
          errors.push(`Invalid value '${attr.value}' for attribute '${attribute.name}'.`);
        }
      }
    }
  }

  return errors;
};