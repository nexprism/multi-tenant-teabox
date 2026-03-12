"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

import Link from "next/link";
import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
  closeCart,
} from "../store/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { setCheckoutOpen } from "../store/slices/checkOutSlice";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import {
  addToWishlist,
  removeFromWishlist,
} from "../store/slices/wishlistSlice";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "react-toastify";

import { trackEvent } from "../lib/tracking/trackEvent";
import { useTrack } from "../lib/tracking/useTrack";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "../utils/priceHelper";

const TrySectionCard = ({ product, showDes, buyNow }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { redirectToLogin, redirectToSignup } = useAuthRedirect();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userId = useSelector((state) => state.auth.user?._id);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [overlayProduct, setOverlayProduct] = useState(null);
  const [localWishlisted, setLocalWishlisted] = useState(null); // For optimistic UI updates
  const { trackView, trackAddToCart, trackWishlist, trackRemoveWishlist } =
    useTrack();

  const { items: wishlistItems, initialized } = useSelector((state) => state.wishlist);

  const isInReduxWishlist = wishlistItems.some((item) => {
    const itemProduct = item.product;
    const itemProductId = String(
      (typeof itemProduct === 'object' ? (itemProduct?._id || itemProduct?.id) : itemProduct) || ''
    );
    const productId = String(product._id || product.id || '');

    if (itemProductId !== productId) return false;

    const variantId = product?.variants?.[0]?._id;
    if (variantId) {
      const itemVariant = item.variant;
      const itemVariantId = String(
        (typeof itemVariant === 'object' ? (itemVariant?._id || itemVariant?.id) : itemVariant) || ''
      );
      return itemVariantId === String(variantId);
    }

    return true;
  });

  const isWishlistedFromProduct =
    isAuthenticated &&
    userId &&
    Array.isArray(product.wishlist) &&
    product.wishlist.some(id => String(id) === String(userId));

  // Combine both checks for reliability. Trust Redux exclusively if it's already initialized.
  // Use localWishlisted for optimistic UI updates (when not null)
  const computedWishlisted = initialized ? isInReduxWishlist : (isInReduxWishlist || isWishlistedFromProduct);
  const isWishlisted = localWishlisted !== null ? localWishlisted : computedWishlisted;

  const handleProductClick = () => {
    if (product?._id) {
      trackView(product._id);
    }
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(closeCart());
    const { salePrice } = getDisplayPrice(product);
    try {
      const productImage = product.thumbnail || product.images?.[0];
      const imageObj = productImage
        ? (typeof productImage === 'string'
          ? { url: productImage, alt: product.name }
          : { url: productImage.url || productImage, alt: productImage.alt || product.name })
        : { url: "/Image-not-found.png", alt: product.name };

      const resultAction = await dispatch(
        setBuyNowProduct({
          product: {
            _id: product._id,
            id: product._id,
            name: product.name,
            image: imageObj,
            category: product.category,
          },
          quantity: 1,
          price: salePrice,
          variant: product.variants[0]._id,
        })
      );
      if (resultAction.error) {
        toast.error(
          resultAction.payload ||
          resultAction.error.message ||
          "Failed to add to cart"
        );
        return;
      }
      setOverlayProduct(null);
      dispatch(setCheckoutOpen());
      // Navigate to checkout-popup page with query params
      router.push(`/checkout-popup?buyNow=true&productId=${product._id}&variantId=${product.variants[0]._id}&quantity=1`);
    } catch (error) {
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    e.preventDefault();


    const { salePrice } = getDisplayPrice(product);

    try {
      const resultAction = await dispatch(
        addToCart({
          product: product._id,
          quantity: 1,
          price: salePrice,
          variant: product?.variants[0]?._id,
        })
      );

      if (!resultAction.error) {
        setTimeout(async () => {
          try {
            await dispatch(getCartItems());
          } catch (err) {
          }
        }, 500);
      }

      trackAddToCart(product._id);
      dispatch(toggleCart());
    } catch (error) {
      console.warn("Add to cart error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated]);

  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  console.log("new code");

  return (
    <>
      <Link
        href={`/productDetail/${product.slug}`}
        className="group cursor-pointer hover:shadow-xl action:scale-90 transition-all w-full h-full"
        prefetch
        onClick={handleProductClick}
      >
        <div
          className={`${showDes ? "h-96 max-sm:h-full" : "h-full sm:h-[420px]"
            } bg-white flex flex-col justify-between border border-[#92BD78] rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-200 w-full max-w-80 lg:w-80 shrink-0`}
        >
          <div className="relative bg-white rounded-t-2xl">
            <div className="absolute top-2 right-2 z-10">
              <button
                type="button"
                className="w-6 h-6 hover:scale-[1.1] bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!isAuthenticated) {
                    setShowAuthModal(true);
                    return;
                  }
                  setHeartAnimating(true);

                  const currentlyWishlisted = isWishlisted;

                  if (!currentlyWishlisted) {
                    setLocalWishlisted(true);
                    const result = await dispatch(
                      addToWishlist({
                        product: product._id,
                        variant: product?.variants[0]?._id,
                      })
                    );
                    if (result.error) {
                      setLocalWishlisted(false);
                      toast.error("Failed to add to wishlist");
                    } else {
                      trackWishlist(product._id);
                    }
                  } else {
                    setLocalWishlisted(false);
                    const result = await dispatch(
                      removeFromWishlist({
                        productId: product._id,
                        variantId: product?.variants[0]?._id,
                      })
                    );
                    if (result.error) {
                      setLocalWishlisted(true);
                      toast.error("Failed to remove from wishlist");
                    } else {
                      trackRemoveWishlist(product._id);
                    }
                  }

                  setTimeout(() => setHeartAnimating(false), 400);
                }}
                aria-label="Add to wishlist"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transition: "stroke 0.4s, fill 0.4s" }}
                >
                  <path
                    d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.3947C21.7563 5.72729 21.351 5.1208 20.84 4.61V4.61Z"
                    stroke={isWishlisted ? "#e63946" : "black"}
                    fill={isWishlisted ? "#e63946" : "none"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex h-56 max-sm:h-44 w-full justify-center items-center overflow-hidden">
              <Image
                src={getImageUrl(product?.thumbnail || product.images?.[0]) || "/Image-not-found.png"}
                alt={product?.thumbnail?.alt || product.images?.[0]?.alt || product?.name || "Product Image"}
                width={160}
                height={120}
                className="object-cover h-full w-full"
              />
            </div>
            <div className="p-2">
              <h3 className="text-xs bg-[#F1FAEE] w-full p-1 px-3 text poppins-medium mb-1 line-clamp-2">
                {product?.name}
              </h3>

              {product?.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-700 ml-1">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  {product?.reviewCount > 0 && (
                    <span className="text-xs text-gray-500">
                      ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
              )}

              {/* Price Section - Moved here */}
              <div className="flex max-sm:flex-row justify-between items-start max-sm:items-center mb-2">
                <div className="flex flex-col max-sm:flex-row max-sm:items-center max-sm:gap-2">
                  {(() => {
                    const { salePrice, originalPrice, hasSale } = getDisplayPrice(product);
                    return (
                      <>
                        <span className="text-lg max-sm:text-base font-bold text-gray-800">
                          ₹{salePrice}
                        </span>
                        {hasSale && (
                          <span className="text-xs text-gray-400 h-5 line-through">
                            ₹{originalPrice}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {showDes && (
                <div
                  className="text-sm h-10 text-black poppins-medium mb-3 max-sm:hidden"
                  dangerouslySetInnerHTML={{
                    __html: product?.description?.slice(0, 50),
                  }}
                ></div>
              )}
            </div>
          </div>



          {/* Action Buttons Section */}
          <div className="p-2">
            <div>
              {buyNow ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleBuyNow(e)}
                    className="flex-1 h-10 max-sm:h-9 mb-2 greenTwo text-white py-2.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={(e) => handleAddToCart(e)}
                    className="h-10 max-sm:h-9 w-12 flex justify-center group/group2 items-center border border-[#3C950D] hover:bg-[#3C950D] rounded-lg transition-colors"
                    type="button"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#3C950D] group-hover/group2:text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => handleAddToCart(e)}
                  className="w-full greenOne text-black py-2.5 max-sm:py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors duration-200"
                  type="button"
                >
                  Add to cart
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={redirectToLogin}
        onSignup={redirectToSignup}
      />
    </>
  );
};

export default TrySectionCard;