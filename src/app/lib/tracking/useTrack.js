import { trackEvent } from "./trackEvent";

export function useTrack() {
  return {
    trackView: (productId) => trackEvent("PRODUCT_VIEW", { productId }),
    trackAddToCart: (productId) => trackEvent("ADD_TO_CART", { productId }),
    trackRemoveFromCart: (productId) => trackEvent("REMOVE_FROM_CART", { productId }),
    trackWishlist: (productId) => trackEvent("ADD_TO_WISHLIST", { productId }),
    trackRemoveWishlist: (productId) => trackEvent("REMOVE_FROM_WISHLIST", { productId }),
    trackCheckout: (cart) => trackEvent("CHECKOUT_STARTED", { cart }),
    trackSearch: (searchQuery, productIds = []) => trackEvent("SEARCH", { searchQuery, productIds }),
    trackFilter: (filter) => trackEvent("FILTER_APPLIED", { filter }),
    trackSort: (sort) => trackEvent("SORT_APPLIED", { sort }),
    trackPageView: (url, title) => trackEvent("PAGE_VIEW", { url, title }),
    trackSignup: (user) => trackEvent("SIGNUP", { user, userId: user && (user._id || user.id) }),
    trackLogin: (user) => trackEvent("LOGIN", { user, userId: user && (user._id || user.id) }),
  };
}
