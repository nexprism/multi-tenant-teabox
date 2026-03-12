"use client";
import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  getCartItems,
  removeBuyNowProduct,
  removeItemFromCart,
  toggleCart,
  updateCartItemQuantity,
  closeCart,
} from "@/app/store/slices/cartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { setCheckoutOpen } from "@/app/store/slices/checkOutSlice";
import { fetchProducts, fetchAddons } from "@/app/store/slices/productSlice";
import Link from "next/link";
import { trackEvent } from "@/app/lib/tracking/trackEvent";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

const CartSidebar = () => {
  const dispatch = useDispatch();
  const {
    loading,
    isCartOpen = false,
    cartItems,
    cartId,
    total = 0,
  } = useSelector((state) => state.cart);

  const route = useRouter();
  const { products, addons } = useSelector((state) => state.product);
  const [SelectedProduct, setSelectedProduct] = useState(null);
  const hasClosedRef = useRef(false);
  const shipping = 65;

  // Close cart immediately on mount using useLayoutEffect (runs synchronously before paint)
  useLayoutEffect(() => {
    if (!hasClosedRef.current) {
      dispatch(closeCart());
      hasClosedRef.current = true;
    }
  }, [dispatch]);

  // //console.log("cart is open is : ", isCartOpen);

  const handelCartToggle = () => {
    dispatch(toggleCart());
  };

  const removeItem = async (cartId) => {
    const item = cartItems.find((item) => item.id === cartId);
    await dispatch(removeItemFromCart(cartId));
    dispatch(getCartItems());
    if (item?.product?._id) {
      trackEvent("REMOVE_FROM_CART", { productId: item.product._id });
    }
  };

  const updateQuantity = async (itemId, change) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      // await removeItem(itemId);
      return;
    } else {
      await dispatch(
        updateCartItemQuantity({
          itemId: item.id,
          quantity: newQuantity,
        })
      );
      dispatch(getCartItems());
    }
  };

  const handleSelectVariant = async (productId, variantId, quantity, price) => {
    await dispatch(
      addToCart({ product: productId, variant: variantId, quantity, price })
    );
    setSelectedProduct(null);
  };
  const handelRedirect = (e, item) => {
    e.preventDefault();
    // Use slug for navigation
    if (item?.product?.slug) {
      route.push(`/productDetail/${item.product.slug}`);
    }
  };

  // Fetch cart items whenever the cart sidebar is opened
  useEffect(() => {
    if (isCartOpen) {
      dispatch(getCartItems());
    }
  }, [isCartOpen, dispatch]);

  useEffect(() => {
    // Ensure cart is closed on mount (safety check)
    // Only close if we haven't already closed it via useLayoutEffect
    if (!hasClosedRef.current) {
      dispatch(closeCart());
      hasClosedRef.current = true;
    }

    dispatch(fetchAddons());
  }, [dispatch]);

  // Only show cart if it's explicitly open, regardless of loading state
  if (!isCartOpen) {
    return null;
  }

  //console.log("Cart Items:", cartItems);

  return (
    <div className="fixed top-0  inset-1 z-[999999] flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/5 bg-opacity-50"
        onClick={handelCartToggle}
      />

      {/* Cart Sidebar */}
      <div className="w-full max-w-md bg-white text-black h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="greenOne text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">MY CART</h2>
          <button
            onClick={handelCartToggle}
            className="p-1 hover:greenOne rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Trust Badge */}
        <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-b">
          <span className="text-sm text-gray-700">
            Trusted by 8 Lakh+ Customers
          </span>
          <span className="text-gray-400">▶</span>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Cart Items */}
          <div className="p-6">
            {cartItems?.length > 0 ? (
              cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-6 border-b border-gray-200"
                >

                  <div
                    className="w-16 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden cursor-pointer"
                    onClick={(e) => handelRedirect(e, item)}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <div className="w-12 h-16 bg-white rounded-sm overflow-hidden shadow-sm flex items-center justify-center">
                        {item?.product && (item?.product?.thumbnail?.url || item?.product?.images?.[0]?.url || item?.product?.image?.url) ? (
                          <Image
                            src={getImageUrl(item?.product?.thumbnail || item?.product?.images?.[0] || item?.product?.image)}
                            alt={
                              item?.product?.thumbnail?.alt ||
                              item?.product?.images?.[0]?.alt ||
                              item?.product?.image?.alt ||
                              item?.product?.name ||
                              "Product Image"
                            }
                            width={48}
                            height={64}
                            className="object-cover h-full w-full "
                          />
                        ) : (
                          <Image
                            src="/Image-not-found.png"
                            alt={item?.product?.name || "Product Image"}
                            width={48}
                            height={64}
                            className="object-cover h-full w-full "
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className="text-sm font-medium text-gray-900 leading-tight cursor-pointer"
                          onClick={(e) => handelRedirect(e, item)}
                        >

                          {item?.product?.name}
                        </h3>
                        {/* <p className="text-xs text-gray-500 mt-1">
                        {item.weight}
                      </p> */}
                      </div>
                      <button
                        onClick={() => removeItem(item?.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item?.id, -1)}
                          className={`${item?.quantity === 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            } w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item?.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item?.id, 1)}
                          className={`${item?.quantity === item?.product?.stock
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            } w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-lg font-semibold">
                        ₹{item?.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="mt-[40%] w-full flex items-center justify-center">
                <h2 className="text-gray-500/20 font-semibold text-2xl">
                  Your cart is empty
                </h2>
              </div>
            )}
          </div>

          <div className=" rounded-xl bg-white px-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold mb-3">More Products</h3>
            </div>
            <div className="text-sm flex gap-2 overflow-auto">
              {addons?.length > 0 &&
                addons.map((item, index) => (
                  <Link href={`/productDetail/${item?.slug}`} key={index}>
                    <div className="relative w-fit flex flex-col border-[1px] border-black/10 gap-2 rounded-lg p-3">
                      <div className="h-32 w-full   rounded-sm overflow-hidden mb-2 flex items-center justify-center">
                        {(item?.thumbnail?.url && item?.thumbnail?.url.trim() !== "") ||
                          (item?.images?.[0]?.url && item?.images?.[0]?.url.trim() !== "") ? (
                          <Image
                            src={getImageUrl(item?.thumbnail || item?.images?.[0])}
                            alt={item?.thumbnail?.alt || item?.images?.[0]?.alt || "Product"}
                            width={160}
                            height={128}
                            className="object-contain h-full w-full"
                          />
                        ) : (
                          <Image
                            src="/Image-not-found.png"
                            alt={item?.name || "Product Image"}
                            width={160}
                            height={128}
                            className="object-contain h-full w-full"
                          />
                        )}
                      </div>
                      <div className="w-fit h-fit">
                        <div className="text-xs w-40  min-h-7 text-gray-600 mb-1">
                          {item?.name}
                        </div>
                        {(() => {
                          const { salePrice, originalPrice, hasSale } = getDisplayPrice(item);
                          return (
                            <>
                              <span className="font-extrabold text-sm text-black">
                                ₹{salePrice}
                              </span>
                              {hasSale && (
                                <span className="font-extrabold line-through ml-1 opacity-75 text-sm text-black">
                                  ₹{originalPrice}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {SelectedProduct?._id === item._id && (
                        <div className="absolute flex justify-between flex-col transition-all duration-300 bottom-0 h-3/4 left-0 right-0 rounded-t-md bg-green-100 backdrop-blur-sm p-4 z-[999]">
                          <div>
                            <h2 className="mb-1">Select Variant</h2>
                            <div className="flex flex-col gap-1 h-16  overflow-y-auto">
                              {item?.variants?.map((variant, index) => (
                                <div
                                  key={index}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    //console.log(item);
                                    handleSelectVariant(
                                      {
                                        id: item?._id,
                                        image: getImageUrl(item?.thumbnail || item?.images?.[0]),
                                        name: item?.name,
                                        slug: item?.slug,
                                        variant: variant?._id,
                                      },
                                      variant?._id,
                                      1,
                                      variant?.salePrice || variant?.price
                                    );
                                  }}
                                  className="cursor-pointer hover:font-semibold "
                                >
                                  <h2 className="text-xs capitalize">
                                    {variant.title} - {"₹" + (variant.salePrice || variant.price)}{" "}
                                    {variant.salePrice && (
                                      <span className="line-through opacity-75 text-gray-500">
                                        ₹{variant.price}
                                      </span>
                                    )}
                                  </h2>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedProduct(null);
                            }}
                            className="flex mt-1 w-full items-center h-7 rounded-md justify-center border text-green-800 gap-1 text-sm "
                          >
                            Close
                          </button>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedProduct(item);
                        }}
                        className="flex items-center h-7 rounded-md justify-center bg-blue-500 gap-1 text-sm text-white"
                      >
                        <Plus className="h-4 w-4 text-white " />
                        Add Now
                      </button>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${cartItems?.length > 0 ? "" : "opacity-40 cursor-not-allowed"
            } *: border-t bg-white p-6 space-y-4`}
        >
          {/* Shipping */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Shipping</span>
            <div className="text-right">
              <span className="text-gray-500 line-through text-sm">₹65</span>
              <span className="text-green-500 font-semibold ml-2">FREE</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-xl font-semibold">
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => {
              if (cartItems?.length > 0) {
                // track checkout started
                try {
                  trackEvent("CHECKOUT_STARTED", {
                    items: cartItems.map((it) => ({
                      productId: it.product.id,
                      quantity: it.quantity,
                      price: it.price,
                    })),
                    total,
                    timestamp: new Date().toISOString(),
                  });
                } catch (err) {
                  // non-blocking
                }

                dispatch(toggleCart());
                dispatch(removeBuyNowProduct());
                route.push("/checkout-popup");
              }
            }}
            className="w-full greenOne text-white py-4 rounded-lg font-semibold text-lg hover:greenOne transition-colors"
          >
            Proceed to Checkout 🔒
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
