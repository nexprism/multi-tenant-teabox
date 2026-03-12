// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import attributeReducer from "./slices/attributeSlice";
import brandReducer from "./slices/brandSlice";
import categoryReducer from "./slices/categorySlice";
import planReducer from "./slices/planSlice";
import productReducer from "./slices/productSlice";
import subCategoryReducer from "./slices/subCategorySlice";
import tenantReducer from "./slices/tenantSlice";
import variantReducer from "./slices/variantSlice";
import cartReducer from "./slices/cartSlice";
import couponReducer from "./slices/couponSlice";
import blogSlice from "./slices/blogSclie";
import checkoutSlice from "./slices/checkOutSlice";
import orderSlice from "./slices/orderSlice";
import supportTicketSlice from "./slices/supportTicketSlice";
import orderReducer from "./slices/orderSlice";
import contentReducer from "./slices/contentSlice";
import wishlistReducer from "./slices/wishlistSlice";
import faq from "./slices/faqSlice";
import settingSlice from "./slices/settingSlice";
import reviewsSlice from "./slices/Reviews";
import pagesSlice from "./slices/pagesSlice";
import certificateReducer from "./slices/certificateSlice";
import influencerVideoReducer from "./slices/influencerVideoSlice";
// Attempt to synchronously hydrate cart state from localStorage on client
let preloadedState = undefined;
if (typeof window !== "undefined") {
  try {
    const cartRaw = localStorage.getItem("dnd_ecommerce_cart");
    const buyNowRaw = localStorage.getItem("dnd_ecommerce_buy_now");
    if (cartRaw) {
      const parsed = JSON.parse(cartRaw);
      preloadedState = preloadedState || {};
      preloadedState.cart = {
        cartId: parsed.cartId || null,
        cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : [],
        total: parsed.total || 0,
        buyNowProduct: buyNowRaw ? JSON.parse(buyNowRaw) : null,
        loading: false,
        error: null,
        isCartOpen: false,
      };
    } else if (buyNowRaw) {
      // no cart data but buy-now exists
      const parsedBuyNow = JSON.parse(buyNowRaw);
      preloadedState = preloadedState || {};
      preloadedState.cart = {
        cartId: null,
        cartItems: [],
        total: 0,
        buyNowProduct: parsedBuyNow,
        loading: false,
        error: null,
        isCartOpen: false,
      };
    }
  } catch (e) {
    // ignore parse errors and fall back to default initial state
  }
}

const store = configureStore({
  reducer: {
    auth: authReducer,
    attribute: attributeReducer,
    brand: brandReducer,
    cart: cartReducer, // Assuming you have a cartSlice
    category: categoryReducer,
    plan: planReducer,
    product: productReducer,
    subCategory: subCategoryReducer,
    tenant: tenantReducer,
    variant: variantReducer,
    coupon: couponReducer,
    blogs: blogSlice,
    checkout: checkoutSlice,
    order: orderSlice,
    supportTicket: supportTicketSlice,
    orders: orderReducer,
    wishlist: wishlistReducer,
    content: contentReducer,
    faq: faq,
    setting: settingSlice,
    reviews: reviewsSlice,
    pages: pagesSlice, // Import and add pagesSlice here
    certificate: certificateReducer,
    influencerVideo: influencerVideoReducer,
  },
  preloadedState,
});

export default store;
