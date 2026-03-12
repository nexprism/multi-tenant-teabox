import wishlistService from '../services/wishlistService.js';
import { NextResponse } from 'next/server';

class WishlistController {
  async getWishlist(req, _res, _body, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('Fetching wishlist for user:', userId, 'Connection:', conn.name || 'global mongoose');
      const wishlist = await wishlistService.getWishlist(userId, conn);
      if (!wishlist) {
        return NextResponse.json({ user: userId, items: [] }, { status: 200 });
      }
      return NextResponse.json({status : 'true', message: 'Item added to wishlist successfully', wishlist});
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  async addItem(req, _res, body, conn) {
    try {
      const userId = req.user._id;
      const { product, variant } = body;
      //consolle.log('Adding item for user:', userId, 'Item:', { product, variant }, 'Connection:', conn.name || 'global mongoose');
      const wishlist = await wishlistService.addItem(userId, { product, variant }, conn);
      return NextResponse.json({ status : 'true', message: 'Item added to wishlist successfully', wishlist });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  async removeItem(req, _res, body, conn) {
    try {
      const userId = req.user._id;
      const { productId, variantId } = body;
      //consolle.log('Removing item for user:', userId, 'Product:', productId, 'Variant:', variantId, 'Connection:', conn.name || 'global mongoose');
      const wishlist = await wishlistService.removeItem(userId, productId, variantId, conn);
      return NextResponse.json({ message: 'Item removed from wishlist successfully', wishlist });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  async updateWishlistById(req, _res, body, wishlistId, conn) {
    try {
      const userId = req.user._id;
      const { items } = body;
      //consolle.log('Updating wishlist:', wishlistId, 'for user:', userId, 'Items:', JSON.stringify(items, null, 2), 'Connection:', conn.name || 'global mongoose');
      const wishlist = await wishlistService.updateWishlistById(wishlistId, userId, items, conn);
      return NextResponse.json({ message: 'Wishlist updated successfully', wishlist });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  async clearWishlist(req, _res, _body, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('Clearing wishlist for user:', userId, 'Connection:', conn.name || 'global mongoose');
      const wishlist = await wishlistService.clearWishlist(userId, conn);
      return NextResponse.json({ message: 'Wishlist cleared successfully', wishlist });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}

const wishlistController = new WishlistController();
export default wishlistController;