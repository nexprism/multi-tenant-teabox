import wishlistRepository from '../repository/wishlistRepository.js';
import { ProductSchema } from '../models/Product.js'; // Changed from productSchema to ProductSchema
import { variantSchema } from '../models/Variant.js';
import mongoose from 'mongoose';

class WishlistService {
  async getWishlist(userId, conn) {
    //console.log('Fetching wishlist for user:', userId, 'Connection:', conn.name || 'global mongoose');
    return wishlistRepository.getWishlistByUser(userId, conn);
  }

  async addItem(userId, { product, variant }, conn) {
    //console.log('[WishlistService.addItem] Validating product:', product, 'variant:', variant, 'Connection:', conn.name || 'global mongoose');
    const ProductModel = conn.models.Product || conn.model('Product', ProductSchema); // Updated to use ProductSchema
    const VariantModel = conn.models.Variant || conn.model('Variant', variantSchema);
    if (!product) throw new Error('Product is required');
    if (!mongoose.Types.ObjectId.isValid(product)) throw new Error('Invalid product ID');
    const productIdObj = new mongoose.Types.ObjectId(product);
    const prod = await ProductModel.findOne({ _id: productIdObj, deletedAt: null });
    if (!prod) throw new Error('Product not found or has been deleted');
    if (variant) {
      if (!mongoose.Types.ObjectId.isValid(variant)) throw new Error('Invalid variant ID');
      const variantDoc = await VariantModel.findById(variant);
      //console.log('Variant found:', variantDoc ? variantDoc._id.toString() : 'null', 'Product in variant:', variantDoc ? (variantDoc.product || variantDoc.productId)?.toString() : 'null');
      if (!variantDoc) throw new Error(`Variant ${variant} not found`);
      const variantProduct = variantDoc.product || variantDoc.productId;
      if (!variantProduct) throw new Error(`Variant ${variant} has no associated product or productId`);
      if (variantProduct.toString() !== product.toString()) throw new Error(`Variant ${variant} does not belong to product ${product}`);
    }
    return wishlistRepository.addItem(userId, { product, variant }, conn);
  }

  async removeItem(userId, productId, variantId, conn) {
    //console.log('[WishlistService.removeItem] Removing product:', productId, 'variant:', variantId, 'Connection:', conn.name || 'global mongoose');
    const ProductModel = conn.models.Product || conn.model('Product', ProductSchema); // Updated to use ProductSchema
    const VariantModel = conn.models.Variant || conn.model('Variant', variantSchema);
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error('Invalid product ID');
    const prod = await ProductModel.findById(productId);
    if (!prod) throw new Error('Product not found');
    if (variantId) {
      if (!mongoose.Types.ObjectId.isValid(variantId)) throw new Error('Invalid variant ID');
      const variantDoc = await VariantModel.findById(variantId);
      //console.log('Variant found:', variantDoc ? variantDoc._id.toString() : 'null', 'Product in variant:', variantDoc ? (variantDoc.product || variantDoc.productId)?.toString() : 'null');
      if (!variantDoc) throw new Error(`Variant ${variantId} not found`);
      const variantProduct = variantDoc.product || variantDoc.productId;
      if (!variantProduct) throw new Error(`Variant ${variantId} has no associated product or productId`);
      if (variantProduct.toString() !== productId.toString()) throw new Error(`Variant ${variantId} does not belong to product ${productId}`);
    }
    return wishlistRepository.removeItem(userId, productId, variantId, conn);
  }

  async updateWishlistById(wishlistId, userId, items, conn) {
    //console.log('[WishlistService.updateWishlistById] Updating wishlist:', wishlistId, 'for user:', userId, 'Items:', JSON.stringify(items, null, 2), 'Connection:', conn.name || 'global mongoose');
    const ProductModel = conn.models.Product || conn.model('Product', ProductSchema); // Updated to use ProductSchema
    const VariantModel = conn.models.Variant || conn.model('Variant', variantSchema);

    // Validate new items
    for (const item of items) {
      if (!item.product) throw new Error('Product is required');
      if (!mongoose.Types.ObjectId.isValid(item.product)) throw new Error(`Invalid product ID: ${item.product}`);
      const productIdObj = new mongoose.Types.ObjectId(item.product);
      const prod = await ProductModel.findOne({ _id: productIdObj, deletedAt: null });
      if (!prod) throw new Error(`Product ${item.product} not found or has been deleted`);
      if (item.variant) {
        if (!mongoose.Types.ObjectId.isValid(item.variant)) throw new Error(`Invalid variant ID: ${item.variant}`);
        const variantDoc = await VariantModel.findById(item.variant);
        //console.log('Validating variant:', item.variant, 'Found:', variantDoc ? variantDoc._id.toString() : 'null', 'Product in variant:', variantDoc ? (variantDoc.product || variantDoc.productId)?.toString() : 'null');
        if (!variantDoc) throw new Error(`Variant ${item.variant} not found`);
        const variantProduct = variantDoc.product || variantDoc.productId;
        if (!variantProduct) throw new Error(`Variant ${item.variant} has no associated product or productId`);
        if (variantProduct.toString() !== item.product.toString()) throw new Error(`Variant ${item.variant} does not belong to product ${item.product}`);
      }
    }

    // Update wishlist
    const update = {
      items: items.map(item => ({
        product: item.product,
        variant: item.variant || null,
        addedAt: new Date()
      }))
    };

    return wishlistRepository.updateWishlistById(wishlistId, userId, update, conn);
  }

  async clearWishlist(userId, conn) {
    //console.log('[WishlistService.clearWishlist] Clearing wishlist for user:', userId, 'Connection:', conn.name || 'global mongoose');
    return wishlistRepository.clearWishlist(userId, conn);
  }
}

const wishlistService = new WishlistService();
export default wishlistService;