import cartRepository from "../repository/CartRepository.js";
import { variantSchema } from "../models/Variant.js";
import mongoose from "mongoose";
import { CouponModel } from "../models/Coupon.js";
import { ProductSchema } from "../models/Product.js";

class CartService {
  async getCart(userId, conn) {
    //console.log('Fetching cart for user:', userId, 'Connection:', conn.name || 'global mongoose');
    return cartRepository.getCartByUser(userId, conn);
  }

  async addItem(userId, { product, variant, quantity, price }, conn) {
    //console.log('[CartService.addItem] Validating product:', product, 'variant:', variant, 'quantity:', quantity, 'price:', price, 'Connection:', conn.name || 'global mongoose');
    const ProductModel =
      conn.models.Product || conn.model("Product", ProductSchema);
    const VariantModel =
      conn.models.Variant || conn.model("Variant", variantSchema);
    if (!product) throw new Error("Product is required");
    if (!mongoose.Types.ObjectId.isValid(product))
      throw new Error("Invalid product ID");
    const productIdObj = new mongoose.Types.ObjectId(product);
    const prod = await ProductModel.findOne({
      _id: productIdObj,
      deletedAt: null,
    });
    if (!prod) throw new Error("Product not found or has been deleted");
    let variantDoc = null;
    if (variant) {
      if (!mongoose.Types.ObjectId.isValid(variant))
        throw new Error("Invalid variant ID");
      variantDoc = await VariantModel.findById(variant);
      //console.log('Variant found:', variantDoc ? variantDoc._id.toString() : 'null');
      if (!variantDoc) throw new Error(`Variant ${variant} not found`);
      const variantProduct = variantDoc.product || variantDoc.productId;
      if (!variantProduct)
        throw new Error(
          `Variant ${variant} has no associated product or productId`
        );
      if (variantProduct.toString() !== product.toString())
        throw new Error(
          `Variant ${variant} does not belong to product ${product}`
        );
      if (quantity > variantDoc.stock)
        throw new Error("Not enough stock for this variant");
      const effectivePrice =
        variantDoc.price !== undefined && variantDoc.price !== null
          ? variantDoc.price
          : variantDoc.price;
      if (price !== undefined && price !== effectivePrice)
        throw new Error(
          `Price mismatch for variant ${variant}: expected ${effectivePrice}, got ${price}`
        );
      variantDoc.stock -= quantity;
      await variantDoc.save();
    }
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    return cartRepository.addItem(
      userId,
      { product, variant, quantity, price },
      conn
    );
  }

  async syncGuestCart(userId, guestItems, conn) {
    const CartModel = conn.models.Cart;
    let existingCart = await CartModel.findOne({ user: userId });

    if (!existingCart) {
      existingCart = new CartModel({ user: userId, items: [] });
    }

    // Merge guest and existing cart items (preserve or set addedAt)
    const mergedItems = this.mergeCartItems(existingCart.items, guestItems);

    const total = mergedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    existingCart.items = mergedItems;
    existingCart.total = total;
    existingCart.updatedAt = new Date();

    await existingCart.save();

    return existingCart;
  }

  mergeCartItems(existingItems, guestItems) {
    const merged = [...existingItems];

    for (const guest of guestItems) {
      const match = merged.find(
        (i) =>
          i.product.toString() === guest.product &&
          ((i.variant &&
            guest.variant &&
            i.variant.toString() === guest.variant) ||
            (!i.variant && !guest.variant))
      );

      if (match) {
        match.quantity += guest.quantity;
      } else {
        merged.push({
          product: guest.product,
          variant: guest.variant || null,
          quantity: guest.quantity,
          price: guest.price,
          addedAt: guest.addedAt ? new Date(guest.addedAt) : new Date(),
        });
      }
    }

    return merged;
  }

  async removeItem(userId, productId, variantId, conn) {
    //console.log('[CartService.removeItem] Removing product:', productId, 'variant:', variantId, 'Connection:', conn.name || 'global mongoose');
    const ProductModel =
      conn.models.Product || conn.model("Product", productSchema);
    const VariantModel =
      conn.models.Variant || conn.model("Variant", variantSchema);
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("Invalid product ID");
    const prod = await ProductModel.findById(productId);
    if (!prod) throw new Error("Product not found");
    let removedQty = 0;
    if (variantId) {
      if (!mongoose.Types.ObjectId.isValid(variantId))
        throw new Error("Invalid variant ID");
      const variantDoc = await VariantModel.findById(variantId);
      //console.log('Variant found:', variantDoc ? variantDoc._id.toString() : 'null');
      if (!variantDoc) throw new Error(`Variant ${variantId} not found`);
      const variantProduct = variantDoc.product || variantDoc.productId;
      if (!variantProduct)
        throw new Error(
          `Variant ${variantId} has no associated product or productId`
        );
      if (variantProduct.toString() !== productId.toString())
        throw new Error(
          `Variant ${variantId} does not belong to product ${productId}`
        );
      const cart = await cartRepository.getCartByUser(userId, conn);
      const item = cart?.items.find(
        (i) =>
          i.product.equals(productId) &&
          i.variant &&
          i.variant.equals(variantId)
      );
      removedQty = item ? item.quantity : 0;
      if (removedQty > 0) {
        variantDoc.stock += removedQty;
        await variantDoc.save();
      }
    }
    return cartRepository.removeItem(userId, productId, variantId, conn);
  }

  async updateCartById(cartId, userId, items, couponCode, conn) {
    //console.log('[CartService.updateCartById] Updating cart:', cartId, 'for user:', userId, 'Items:', JSON.stringify(items, null, 2), 'Coupon:', couponCode, 'Connection:', conn.name || 'global mongoose');
    const ProductModel =
      conn.models.Product || conn.model("Product", productSchema);
    const VariantModel =
      conn.models.Variant || conn.model("Variant", variantSchema);
    const Coupon =
      conn.models.Coupon || conn.model("Coupon", CouponModel.schema);

    //console.log('cartRepository.getCartById:', typeof cartRepository.getCartById);

    // Fetch existing cart to restore stock
    const existingCart = await cartRepository.getCartById(cartId, userId, conn);
    for (const item of existingCart.items) {
      if (item.variant) {
        const variantDoc = await VariantModel.findById(item.variant);
        //console.log('Restoring stock for variant:', variantDoc ? variantDoc._id.toString() : 'null');
        if (variantDoc) {
          const variantProduct = variantDoc.product || variantDoc.productId;
          if (!variantProduct) {
            //console.warn(`Variant ${item.variant} has no associated product or productId; skipping stock restoration`);
            continue;
          }
          variantDoc.stock += item.quantity;
          await variantDoc.save();
        }
      }
    }

    // Validate new items
    for (const item of items) {
      if (!item.product) throw new Error("Product is required");
      if (!mongoose.Types.ObjectId.isValid(item.product))
        throw new Error(`Invalid product ID: ${item.product}`);
      const productIdObj = new mongoose.Types.ObjectId(item.product);
      const prod = await ProductModel.findOne({
        _id: productIdObj,
        deletedAt: null,
      });
      if (!prod)
        throw new Error(
          `Product ${item.product} not found or has been deleted`
        );
      if (item.variant) {
        if (!mongoose.Types.ObjectId.isValid(item.variant))
          throw new Error(`Invalid variant ID: ${item.variant}`);
        const variantDoc = await VariantModel.findById(item.variant);
        //console.log('Validating variant:', item.variant, 'Found:', variantDoc ? variantDoc._id.toString() : 'null');
        if (!variantDoc) throw new Error(`Variant ${item.variant} not found`);
        const variantProduct = variantDoc.product || variantDoc.productId;
        if (!variantProduct)
          throw new Error(
            `Variant ${item.variant} has no associated product or productId`
          );
        if (variantProduct.toString() !== item.product.toString())
          throw new Error(
            `Variant ${item.variant} does not belong to product ${item.product}`
          );
        if (item.quantity > variantDoc.stock)
          throw new Error(`Not enough stock for variant ${item.variant}`);
        const effectivePrice =
          variantDoc.salePrice !== undefined && variantDoc.salePrice !== null
            ? variantDoc.salePrice
            : variantDoc.price;
        if (item.price !== undefined && item.price !== effectivePrice)
          throw new Error(
            `Price mismatch for variant ${item.variant}: expected ${effectivePrice}, got ${item.price}`
          );
        variantDoc.stock -= item.quantity;
        await variantDoc.save();
      }
      if (item.quantity < 1) throw new Error("Quantity must be at least 1");
      if (item.price == null || isNaN(item.price) || item.price < 0)
        throw new Error("Price must be a non-negative number");
    }

    // Update cart
    const update = {
      items: items.map((item) => ({
        product: item.product,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      })),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      coupon: null,
      discount: 0,
    };

    let cart = await cartRepository.updateCartById(
      cartId,
      userId,
      update,
      conn
    );

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      //console.log('Coupon found:', coupon ? coupon._id.toString() : 'null');
      if (!coupon) throw new Error("Invalid or expired coupon");
      let discount = 0;
      if (coupon.type === "percent") {
        discount = cart.total * (coupon.value / 100);
      } else if (coupon.type === "flat") {
        discount = coupon.value;
      }
      cart.total = Math.max(0, cart.total - discount);
      cart.coupon = coupon._id;
      cart.discount = discount;
      await cart.save();
    }
    return cart;
  }

  async clearCart(userId, conn) {
    //console.log('[CartService.clearCart] Clearing cart for user:', userId, 'Connection:', conn.name || 'global mongoose');
    const VariantModel =
      conn.models.Variant || conn.model("Variant", variantSchema);
    const cart = await cartRepository.getCartByUser(userId, conn);
    if (cart && cart.items) {
      for (const item of cart.items) {
        if (item.variant) {
          const variantDoc = await VariantModel.findById(item.variant);
          //console.log('Restoring stock for variant:', variantDoc ? variantDoc._id.toString() : 'null');
          if (variantDoc) {
            const variantProduct = variantDoc.product || variantDoc.productId;
            if (!variantProduct) {
              //console.warn(`Variant ${item.variant} has no associated product or productId; skipping stock restoration`);
              continue;
            }
            variantDoc.stock += item.quantity;
            await variantDoc.save();
          }
        }
      }
    }
    return cartRepository.clearCart(userId, conn);
  }
}

const cartService = new CartService();
export default cartService;
