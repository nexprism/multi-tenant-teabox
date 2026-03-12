// src/lib/redux/slices/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// localStorage utility functions
const CART_STORAGE_KEY = "dnd_ecommerce_cart";
const BUY_NOW_STORAGE_KEY = "dnd_ecommerce_buy_now";

const getBuyNowFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(BUY_NOW_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const saveBuyNowToLocalStorage = (data) => {
  try {
    localStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {}
};

const clearBuyNowFromLocalStorage = () => {
  try {
    localStorage.removeItem(BUY_NOW_STORAGE_KEY);
  } catch (error) {}
};

const saveCartToLocalStorage = (cartData) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  } catch (error) {
    // console.error("Failed to save cart to localStorage:", error);
  }
};

const getCartFromLocalStorage = () => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : null;
  } catch (error) {
    // console.error("Failed to get cart from localStorage:", error);
    return null;
  }
};

const clearCartFromLocalStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    // console.error("Failed to clear cart from localStorage:", error);
  }
};

// Map server cart format to local cart storage format
function mapServerCartToLocal(serverCart) {
  if (!serverCart) return { cartId: null, cartItems: [], total: 0 };
  const cartId =
    serverCart._id ||
    serverCart.id ||
    (serverCart.userIsGestId
      ? `guest:${serverCart.userIsGestId}`
      : Date.now().toString());
  const items = (serverCart.items || []).map((it) => {
    const productId =
      it.product && (it.product._id || it.product)
        ? it.product._id || it.product
        : null;
    const variantId =
      it.variant && (it.variant._id || it.variant)
        ? it.variant._id || it.variant
        : null;
    // Defensive price/quantity derivation: server payloads vary.
    // Try explicit price, then variant price, then product fallback, otherwise 0.
    const derivedPrice = (() => {
      if (typeof it.price === "number") return it.price;
      if (it.price && !isNaN(Number(it.price))) return Number(it.price);
      if (it.variant && typeof it.variant === "object" && (it.variant.price || it.variant.salePrice)) {
        return Number(it.variant.salePrice || it.variant.price || 0);
      }
      if (it.product && typeof it.product === "object") {
        // product may contain variants array
        if (Array.isArray(it.product.variants) && it.product.variants.length > 0) {
          const v = it.product.variants[0];
          return Number(v.salePrice || v.price || 0);
        }
        if (it.product.price) return Number(it.product.price);
      }
      return 0;
    })();

    const derivedQuantity = Number(it.quantity) > 0 ? Number(it.quantity) : 1;

    const id = `${productId}:${variantId || ""}`;
    return {
      id,
      product: it.product,
      variant: variantId,
      quantity: derivedQuantity,
      price: derivedPrice,
      addedAt: it.addedAt
        ? new Date(it.addedAt).toISOString()
        : new Date().toISOString(),
    };
  });
  const total =
    (typeof serverCart.total === "number" && !isNaN(serverCart.total))
      ? serverCart.total
      : items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  return { cartId, cartItems: items, total };
}

// Async thunk to add an item to the cart (using localStorage)
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    { product, variant, quantity, price },
    { rejectWithValue, getState }
  ) => {
    try {
      // Try server API first. If it fails, fall back to localStorage.
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      let guestId =
        typeof window !== "undefined" ? localStorage.getItem("guestId") : null;

      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      if (guestId) headers["x-guest-id"] = guestId;

      const payloadProduct =
        product && (product._id || product.id)
          ? product._id || product.id
          : product;
      const payloadVariant =
        variant && (variant._id || variant.id)
          ? variant._id || variant.id
          : variant;
      const resp = await fetch("/api/new-cart/items", {
        method: "POST",
        headers,
        body: JSON.stringify({
          product: payloadProduct,
          variant: payloadVariant,
          quantity,
          price,
          userIsGestId: guestId,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const serverCart = data.cart;
        // Save guestId returned by server if present
        if (serverCart && serverCart.userIsGestId) {
          try {
            localStorage.setItem("guestId", serverCart.userIsGestId);
          } catch (e) { }
        }

        const mapped = mapServerCartToLocal(serverCart);
        saveCartToLocalStorage(mapped);
        return mapped;
      }

      // Fallback to localStorage behavior if server call fails
      const existingCart = getCartFromLocalStorage() || {
        cartId: Date.now().toString(),
        cartItems: [],
        total: 0,
      };

      const existingItemIndex = existingCart.cartItems.findIndex((item) => {
        const productMatch = String(item.product) === String(product);
        const variantMatch = String(item.variant) === String(variant);
        return productMatch && variantMatch;
      });

      let updatedItems;
      if (existingItemIndex !== -1) {
        updatedItems = [...existingCart.cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].price = price;
      } else {
        const payloadProduct =
          product && (product._id || product.id)
            ? product._id || product.id
            : product;
        const payloadVariant =
          variant && (variant._id || variant.id)
            ? variant._id || variant.id
            : variant;
        const newItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          product: product,
          variant: payloadVariant,
          quantity,
          price,
          addedAt: new Date().toISOString(),
        };
        updatedItems = [...existingCart.cartItems, newItem];
      }

      const total = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const updatedCart = { ...existingCart, cartItems: updatedItems, total };
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    } catch (error) {
      console.log("Add to Cart Error:", error);
      return rejectWithValue("Add to cart failed");
    }
  }
);

export const getCartItems = createAsyncThunk(
  "cart/getCartItems",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get current local cart first to preserve any recent additions
      const localCartData = getCartFromLocalStorage();
      
      // Try server first
      try {
        const accessToken =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        const guestId =
          typeof window !== "undefined"
            ? localStorage.getItem("guestId")
            : null;
        const headers = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        if (guestId) headers["x-guest-id"] = guestId;

        const resp = await fetch("/api/new-cart", { method: "GET", headers });
        if (resp.ok) {
          const data = await resp.json();
          const serverMapped = mapServerCartToLocal(data.cart || data);
          
          // If server cart has items, use it (it's the source of truth)
          // But if server cart is empty and local has items, keep local (might be a sync delay)
          if (serverMapped.cartItems && serverMapped.cartItems.length > 0) {
            saveCartToLocalStorage(serverMapped);
            return serverMapped;
          } else if (localCartData && localCartData.cartItems && localCartData.cartItems.length > 0) {
            // Server cart is empty but local has items - keep local (might be sync delay)
            // Don't overwrite with empty server cart
            return {
              cartId: localCartData.cartId,
              cartItems: localCartData.cartItems || [],
              total: localCartData.total || 0,
            };
          } else {
            // Both are empty
            saveCartToLocalStorage(serverMapped);
            return serverMapped;
          }
        }
      } catch (e) {
        // ignore and fallback to local
      }

      // Fallback to local storage
      if (!localCartData) {
        return { cartId: null, cartItems: [], total: 0 };
      }
      return {
        cartId: localCartData.cartId,
        cartItems: localCartData.cartItems || [],
        total: localCartData.total || 0,
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch cart items from localStorage");
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  "cart/removeItemFromCart",
  async (itemId, { rejectWithValue }) => {
    try {
      // Try server API
      const existingCart = getCartFromLocalStorage();
      if (!existingCart) return rejectWithValue("Cart not found");

      // itemId format from server mapping: productId:variantId
      const parts = String(itemId).split(":");
      const productId = parts[0];
      const variantId = parts[1] || null;

      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      const guestId =
        typeof window !== "undefined" ? localStorage.getItem("guestId") : null;
      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      if (guestId) headers["x-guest-id"] = guestId;

      try {
        const resp = await fetch("/api/new-cart/items", {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            product: productId,
            variant: variantId,
            userIsGestId: guestId,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const mapped = mapServerCartToLocal(data.cart);
          saveCartToLocalStorage(mapped);
          return { itemId, updatedCart: mapped };
        }
      } catch (e) {
        // ignore and fallback to local
      }

      // Local fallback
      const updatedItems = existingCart.cartItems.filter(
        (item) => item.id !== itemId
      );
      const total = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const updatedCart = { ...existingCart, cartItems: updatedItems, total };
      saveCartToLocalStorage(updatedCart);
      return { itemId, updatedCart };
    } catch (error) {
      return rejectWithValue("Remove from cart failed");
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const existingCart = getCartFromLocalStorage();
      if (!existingCart) return rejectWithValue("Cart not found");

      const parts = String(itemId).split(":");
      const productId = parts[0];
      const variantId = parts[1] || null;

      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      const guestId =
        typeof window !== "undefined" ? localStorage.getItem("guestId") : null;
      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      if (guestId) headers["x-guest-id"] = guestId;

      try {
        const resp = await fetch("/api/new-cart/items", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            product: productId,
            variant: variantId,
            quantity,
            userIsGestId: guestId,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const mapped = mapServerCartToLocal(data.cart);
          saveCartToLocalStorage(mapped);
          return mapped;
        }
      } catch (e) {
        // fallback to local
      }

      // Local fallback
      const updatedItems = existingCart.cartItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      });
      const total = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const updatedCart = { ...existingCart, cartItems: updatedItems, total };
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    } catch (error) {
      return rejectWithValue("Update quantity failed");
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      clearCartFromLocalStorage();
      return {
        cartId: null,
        cartItems: [],
        total: 0,
      };
    } catch (error) {
      return rejectWithValue("Clear cart failed");
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartId: null,
    cartItems: [],
    buyNowProduct: null,
    total: 0,
    loading: false,
    error: null,
    isCartOpen: false, // sidebar state
  },
  reducers: {
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    setBuyNowProduct: (state, action) => {
      // Normalize buyNow payload to ensure numeric price/quantity before saving
      const payload = action.payload || {};
      const normalized = {
        ...payload,
        quantity: Number(payload.quantity) > 0 ? Number(payload.quantity) : 1,
        price: Number(payload.price === undefined || payload.price === null ? 0 : payload.price) || 0,
      };
      state.buyNowProduct = normalized;
      try {
        saveBuyNowToLocalStorage(normalized);
      } catch (e) {
        // ignore
      }
    },
    removeBuyNowProduct: (state) => {
      state.buyNowProduct = null;
      clearBuyNowFromLocalStorage();
    },
    restoreCartState: (state) => {
      const buyNow = getBuyNowFromLocalStorage();
      if (buyNow) {
        // Ensure stored buyNow is normalized (avoid zero/undefined price or quantity)
        const normalized = {
          ...buyNow,
          quantity: Number(buyNow.quantity) > 0 ? Number(buyNow.quantity) : 1,
          price: Number(buyNow.price === undefined || buyNow.price === null ? 0 : buyNow.price) || 0,
        };
        state.buyNowProduct = normalized;
        try {
          saveBuyNowToLocalStorage(normalized);
        } catch (e) {
          // ignore
        }
      }
      const cart = getCartFromLocalStorage();
      if (cart) {
        state.cartItems = Array.isArray(cart.cartItems) ? cart.cartItems : [];
        state.total = cart.total || 0;
        state.cartId = cart.cartId || null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Ensure cartItems is always an array
          state.cartItems = Array.isArray(action.payload.cartItems) 
            ? action.payload.cartItems 
            : [];
          state.cartId = action.payload.cartId || null;
          state.total = action.payload.total || 0;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartItems.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure cartItems is always an array
        state.cartItems = Array.isArray(action.payload?.cartItems) 
          ? action.payload.cartItems 
          : [];
        state.cartId = action.payload?.cartId || null;
        state.total = action.payload?.total || 0;
      })
      .addCase(getCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeItemFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.updatedCart) {
          state.cartItems = action.payload.updatedCart.cartItems;
          state.total = action.payload.updatedCart.total;
        }
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.cartItems = action.payload.cartItems;
          state.total = action.payload.total;
        }
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload.cartItems;
        state.cartId = action.payload.cartId;
        state.total = action.payload.total;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Thunk to initialize buyNowProduct from query params
export const initializeBuyNowFromQuery = createAsyncThunk(
  "cart/initializeBuyNowFromQuery",
  async ({ productId, variantId, quantity }, { dispatch, getState }) => {
    try {
      const state = getState();
      // If we already have it in Redux, no need to fetch (unless it's different)
      if (state.cart.buyNowProduct && 
          (state.cart.buyNowProduct.product?.id === productId || state.cart.buyNowProduct.product?._id === productId) &&
          state.cart.buyNowProduct.variant === variantId) {
        return;
      }

      // Fetch product details
      const { fetchProductById } = require("./productSlice");
      const action = await dispatch(fetchProductById(productId));
      const product = action.payload;

      if (product) {
        const variant = product.variants?.find((v) => v._id === variantId);
        const price = variant ? (variant.salePrice || variant.price) : 0;
        const productImage = product.thumbnail || product.images?.[0];
        const imageObj = productImage 
          ? (typeof productImage === 'string' 
              ? { url: productImage, alt: product.name } 
              : { url: productImage.url || productImage, alt: productImage.alt || product.name })
          : { url: "/Image-not-found.png", alt: product.name };

        dispatch(setBuyNowProduct({
          product: {
            _id: product._id,
            id: product._id,
            name: product.name,
            image: imageObj,
            category: product.category,
          },
          quantity: Number(quantity) || 1,
          price: price,
          variant: variantId,
        }));
      }
    } catch (error) {
      console.error("Failed to initialize buy now from query:", error);
    }
  }
);

export const {
  toggleCart,
  openCart,
  closeCart,
  setBuyNowProduct,
  removeBuyNowProduct,
  restoreCartState,
} = cartSlice.actions;
export default cartSlice.reducer;
