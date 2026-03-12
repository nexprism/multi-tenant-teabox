import mongoose from "mongoose";
import { cartSchema } from "../models/Cart.js";

class CartRepository {
  constructor() {
    // Bind methods to ensure they are available on the instance
    this.getCartModel = this.getCartModel.bind(this);
    this.getCartByUser = this.getCartByUser.bind(this);
    this.getCartById = this.getCartById.bind(this);
    this.createCart = this.createCart.bind(this);
    this.updateCart = this.updateCart.bind(this);
    this.updateCartById = this.updateCartById.bind(this);
    this.addItem = this.addItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.clearCart = this.clearCart.bind(this);
  }

  getCartModel(conn) {
    if (!conn) {
      throw new Error("Database connection is required");
    }
    console.log(
      "CartRepository using connection:",
      conn.name || "global mongoose"
    );
    return conn.models.Cart || conn.model("Cart", cartSchema);
  }

  async getCartByUser(userId, conn) {
    console.log(
      "Fetching cart for user:",
      userId,
      "Connection:",
      conn.name || "global mongoose"
    );
    const Cart = this.getCartModel(conn);
    if (!userId) throw new Error("User ID is required to fetch cart");
    return Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant");
  }

  async getCartById(cartId, userId, conn) {
    console.log(
      "Fetching cart by ID:",
      cartId,
      "for user:",
      userId,
      "Connection:",
      conn.name || "global mongoose"
    );
    const Cart = this.getCartModel(conn);
    if (!mongoose.Types.ObjectId.isValid(cartId))
      throw new Error("Invalid cart ID");
    const cart = await Cart.findOne({ _id: cartId, user: userId })
      .populate("items.product")
      .populate("items.variant");
    if (!cart) throw new Error("Cart not found or does not belong to user");
    return cart;
  }

  async createCart(userId, conn) {
    const Cart = this.getCartModel(conn);
    return Cart.create({
      user: userId,
      items: [],
      total: 0,
      coupon: null,
      discount: 0,
    });
  }

  async updateCart(userId, update, conn) {
    const Cart = this.getCartModel(conn);
    return Cart.findOneAndUpdate({ user: userId }, update, { new: true });
  }

  async updateCartById(cartId, userId, update, conn) {
    console.log(
      "Updating cart by ID:",
      cartId,
      "for user:",
      userId,
      "Connection:",
      conn.name || "global mongoose"
    );
    const Cart = this.getCartModel(conn);
    if (!mongoose.Types.ObjectId.isValid(cartId))
      throw new Error("Invalid cart ID");
    const cart = await Cart.findOneAndUpdate(
      { _id: cartId, user: userId },
      update,
      { new: true }
    )
      .populate("items.product")
      .populate("items.variant");
    if (!cart) throw new Error("Cart not found or does not belong to user");
    return cart;
  }

  async addItem(userId, item, conn) {
    let cart = await this.getCartByUser(userId, conn);
    if (!cart) cart = await this.createCart(userId, conn);
    const existingItem = cart.items.find(
      (i) =>
        i.product.equals(item.product) &&
        (!item.variant || (i.variant && i.variant.equals(item.variant)))
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.price = item.price;
      // keep original addedAt when updating quantity
    } else {
      cart.items.push({
        product: item.product,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      });
    }
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();
    return cart;
  }

  async removeItem(userId, productId, variantId, conn) {
    const cart = await this.getCartByUser(userId, conn);
    if (!cart) return null;
    cart.items = cart.items.filter(
      (i) =>
        !(
          i.product.equals(productId) &&
          (!variantId || (i.variant && i.variant.equals(variantId)))
        )
    );
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();
    return cart;
  }

  async clearCart(userId, conn) {
    return this.updateCart(
      userId,
      { items: [], total: 0, coupon: null, discount: 0 },
      conn
    );
  }
}

export default new CartRepository();
