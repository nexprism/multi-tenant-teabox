import { attributeSchema } from '../models/Attribute.js';
import { ProductSchema } from '../models/Product.js';
import CrudRepository from './CrudRepository.js';

class AttributeRepository extends CrudRepository {
  constructor(conn) {
    const connection = conn || require('mongoose');

    const AttributeModel = connection.models.Attribute || connection.model('Attribute', attributeSchema);

    const ProductModel = connection.models.Product || connection.model('Product', ProductSchema);

    super(AttributeModel);
    this.Attribute = AttributeModel;
    this.Product = ProductModel;
  }

  // Custom method for attribute search - exact whole name match (case-insensitive)
  // Only returns attributes that are NOT soft-deleted (deletedAt must be null or not exist)
  async searchByName(name) {
    if (!name || typeof name !== 'string') {
      return [];
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return [];
    }
    // Use case-insensitive exact match for the whole name only
    // This ensures we match the complete name, not partial matches
    // IMPORTANT: Only check non-deleted attributes - exclude any with deletedAt set
    return await this.Attribute.find({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ],
    }).lean(); // Use lean() for better performance
  }

  // Search including soft-deleted attributes (for error handling)
  async searchByNameIncludingDeleted(name) {
    if (!name || typeof name !== 'string') {
      return [];
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return [];
    }
    return await this.Attribute.find({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();
  }

  //findByProductId
  async findByProductId(productId) {
    if (!productId) {
      throw new Error('Product ID is required to find attributes');
    }

    const product = await this.Product.findOne({ _id: productId, deletedAt: null });
    
    if (!product) {
      return []; // Return empty array if product not found
    }

    // If product exists but has no attributeSet or empty attributeSet, return empty array
    if (!product.attributeSet || !Array.isArray(product.attributeSet) || product.attributeSet.length === 0) {
      return []; // Return empty array instead of throwing error
    }

    // Extract attributeIds from attributeSet array
    const attributeIds = product.attributeSet.map(item => item.attributeId).filter(id => id); // Filter out any null/undefined IDs

    if (attributeIds.length === 0) {
      return []; // Return empty array if no valid attributeIds
    }

    // Populate attributes for dropdown
    const attributes = await this.Attribute.find({
      _id: { $in: attributeIds },
      deletedAt: null,
    });

    return attributes || []; // Ensure we always return an array
  }

  // Custom soft delete (status inactive)
  async delete(id) {
    return await this.Attribute.findByIdAndUpdate(id, { deletedAt: new Date(), status: 'inactive' }, { new: true });
  }

  // Permanently delete an attribute (hard delete)
  async permanentDelete(id) {
    return await this.Attribute.findByIdAndDelete(id);
  }

  // Permanently delete attributes by name (for recreating deleted attributes)
  async permanentDeleteByName(name) {
    if (!name || typeof name !== 'string') {
      return null;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }
    // Find and permanently delete soft-deleted attributes with this name
    const deletedAttributes = await this.Attribute.find({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      deletedAt: { $ne: null }
    });
    
    if (deletedAttributes.length > 0) {
      // Permanently delete all soft-deleted attributes with this name
      const ids = deletedAttributes.map(attr => attr._id);
      return await this.Attribute.deleteMany({ _id: { $in: ids } });
    }
    return null;
  }
}

export default AttributeRepository;
