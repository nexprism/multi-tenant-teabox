import React from "react";
import {
  ChevronDown,
  Clock,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
} from "@/app/store/slices/cartSlice";
import { toast } from "react-toastify";
import { setCheckoutOpen } from "@/app/store/slices/checkOutSlice";
import { addToWishlist } from "@/app/store/slices/wishlistSlice";
import { selectSelectedProduct, setCurrentVariantImage } from "@/app/store/slices/productSlice";
import { trackEvent } from "@/app/lib/tracking/trackEvent";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

const Base_Url = process.env.NEXT_PUBLIC_BASE_URL;

interface Variant5Props {
  productData?: any;
  detailSettings?: any;
}

function Variant5({ productData: propProductData, detailSettings }: Variant5Props) {
  const [expandedSection, setExpandedSection] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [selectedVariant, setSelectedVariant] = React.useState<number>(0);
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propProductData || reduxProductData;
  const dispatch = useDispatch() as any;
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const userId = useSelector((state: any) => state.auth.user?._id);

  // Early return if no product data
  if (!productData) {
    return <div className="p-4 text-center text-gray-500">Loading product details...</div>;
  }

  React.useEffect(() => {
    if (productData?._id) {
      try {
        trackEvent("PRODUCT_VIEW", {
          productId: productData._id,
          user: isAuthenticated ? userId : "guest",
        });
      } catch (err) { }
    }
  }, [productData?._id, isAuthenticated, userId]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = async () => {
    // if (!isAuthenticated) {
    //   setAuthModalOpen(true);
    //   return;
    // }

    // Check if productData is loaded
    if (!productData) {
      toast.error("Product data is not loaded yet. Please wait...");
      return;
    }

    if (!productData.variants || !productData.variants[selectedVariant]) {
      toast.error("Please select a valid variant");
      return;
    }

    const { salePrice } = getDisplayPrice(productData, productData.variants[selectedVariant]?._id);

    // Get product ID - try multiple possible field names
    const productId = productData._id || productData.id || productData.productId || productData.product?._id || productData.product?.id;
    if (!productId) {
      console.error("Product data structure:", productData);
      console.error("Available keys:", Object.keys(productData || {}));
      toast.error("Product ID is not available. Please refresh the page.");
      return;
    }

    // Extract variant ID
    const variantId = productData.variants[selectedVariant]?._id;

    try {
      const resultAction = await dispatch(
        (addToCart as any)({
          product: productId, // Pass just the ID string like main page
          quantity,
          price: salePrice,
          variant: variantId,
        })
      );
      if (resultAction.error) {
        // Show backend error (payload) if present, else generic
        toast.error(
          resultAction.payload ||
          resultAction.error.message ||
          "Failed to add to cart"
        );
        return;
      }

      // Only call getCartItems() if the server successfully added the item
      // If addToCart fell back to localStorage (server failed), don't fetch from server
      // because it won't have the item yet and will overwrite local state
      const serverSuccess = resultAction.payload?._serverSuccess;
      if (serverSuccess === true) {
        setTimeout(async () => {
          try {
            await dispatch(getCartItems());
          } catch (err) {
            // Silently fail - cart is already updated locally
          }
        }, 500); // 500ms delay to allow server to process
      }

      try {
        trackEvent("ADD_TO_CART", {
          productId: productId,
          variantId: variantId,
          quantity,
          user: isAuthenticated ? userId : "guest",
        });
      } catch (err) { }
      dispatch(toggleCart());
    } catch (error) {
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    // if (!isAuthenticated) {
    //   setAuthModalOpen(true);
    //   return;
    // }
    const { salePrice } = getDisplayPrice(productData, productData.variants[selectedVariant]?._id);
    try {
      const resultAction = await dispatch(
        (setBuyNowProduct as any)({
          product: {
            id: productData._id,
            name: productData.name,
            image: getImageUrl(productData.thumbnail || productData.images?.[0]),
            variant: productData.variants[selectedVariant],
            slug: productData.slug,
          },
          quantity,
          price: salePrice,
          variant: productData.variants[selectedVariant],
        })
      );
      if (resultAction.error) {
        // Show backend error (payload) if present, else generic
        toast.error(
          resultAction.payload ||
          resultAction.error.message ||
          "Failed to add to cart"
        );
        return;
      }
      await dispatch(getCartItems());
      try {
        trackEvent("buy_now", {
          productId: productData._id,
          variantId: productData.variants[selectedVariant]?._id,
          quantity,
          user: isAuthenticated ? userId : "guest",
        });
      } catch (err) { }
      dispatch(setCheckoutOpen());
      // dispatch(toggleCart());
    } catch (error) {
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Product Info */}
      <div className="lg:col-span-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-600 font-medium">
              {productData.brand}
            </span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="text-[#07490C] font-medium">
              ✓ {productData.availability}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {productData?.name}
          </h1>

          {/* Brand Logo */}
          {(() => {
            // Handle both brand object and brandImage string
            const brandImage = productData?.brandImage || 
                              (typeof productData?.brand === 'object' && productData?.brand?.image ? productData.brand.image : null);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[Variant5] Brand data:', {
                brand: productData?.brand,
                brandImage: productData?.brandImage,
                resolvedBrandImage: brandImage,
                productDataKeys: Object.keys(productData || {})
              });
            }
            
            if (!brandImage) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[Variant5] No brand image found');
              }
              return null;
            }
            
            const imageUrl = getImageUrl(brandImage);
            
            return (
              <div className="flex items-center mt-2">
                <Image
                  src={imageUrl}
                  alt={typeof productData?.brand === 'object' ? productData?.brand?.name : (productData?.brand || "Brand Logo")}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    console.error('[Variant5] Brand logo failed to load:', imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Variant5] Brand logo loaded successfully:', imageUrl);
                    }
                  }}
                />
              </div>
            );
          })()}

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${i < Math.round(productData?.reviews?.Average || 0)
                      ? "fill-orange-400 text-orange-400"
                      : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
              <span className="font-medium text-gray-900">
                {productData?.reviews?.Average.toFixed(1)}
              </span>
              <span className="text-gray-500">
                ({productData?.reviews?.Reviews.length} reviews)
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            {/* <div className="flex items-center gap-2 text-[#07490C]">
              <Users size={16} />
              <span className="font-medium">{productData.soldCount}</span>
            </div> */}
          </div>
        </div>

        {detailSettings.showDescription && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Product Description
            </h3>
            <p
              dangerouslySetInnerHTML={{
                __html: productData.description,
              }}
              className="text-gray-700 leading-relaxed"
            ></p>
          </div>
        )}

        {/* Features Grid */}
        {productData?.benefits?.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Why Choose This Product
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productData?.benefits?.map((feature, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200"
                  >
                    <div className="h-9 w-9 flex justify-center items-center  text-green-800 bg-green-100 rounded-lg">
                      {idx + 1}
                    </div>
                    <div className="w-[90%]">
                      <div className="font-semibold text-gray-900">
                        {feature.title}
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: feature.description,
                        }}
                        className="text-sm text-gray-600 mt-1"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
          <div className="space-y-6">
            {/* Price */}
            {(() => {
              const { salePrice, originalPrice, hasSale, discount } = getDisplayPrice(productData, productData.variants[selectedVariant]?._id);
              return (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{salePrice}
                    </span>
                    {hasSale && (
                      <span className="text-xl text-gray-500 line-through">
                        ₹{originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {hasSale && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {discount}% OFF
                      </span>
                    )}
                    {hasSale && (
                      <span className="text-[#07490C] text-sm font-medium">
                        Save ₹{originalPrice - salePrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Inclusive of all taxes • Free shipping
                  </p>
                </div>
              );
            })()}

            {/* Variant Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Choose Size</h3>
              <div className="flex lg:block gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {productData?.variants?.map((variant, index) => (
                  <button
                    key={variant._id}
                    onClick={() => {
                      setSelectedVariant(index);
                      // Dispatch the variant image if available
                      if (variant.image) {
                        dispatch(setCurrentVariantImage(variant.image));
                      } else if (variant.images && variant.images.length > 0) {
                        dispatch(setCurrentVariantImage(variant.images[0]));
                      } else {
                        // If no variant specific image, potentially reset or keep current? 
                        // Let's reset to null so it falls back to main images if wanted, 
                        // or maybe we just don't dispatch if we want to keep last selection.
                        // User wants "shows the uploaded image", so if there is one, show it.
                        dispatch(setCurrentVariantImage(null));
                      }
                    }}
                    className={`flex-shrink-0 lg:w-full min-w-[150px] p-3 border-2 rounded-lg text-left transition-all ${selectedVariant === index
                      ? "customBorder bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {variant.title}
                          {variant.popular && (
                            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ₹{variant.salePrice || variant.price}
                        </div>
                        {variant.salePrice && (
                          <div className="text-sm text-gray-500 line-through">
                            ₹{variant.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Quantity</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center customBorder border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 hover:bg-gray-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-3 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 hover:bg-gray-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Total: ₹
                  {(() => {
                    const { salePrice } = getDisplayPrice(productData, productData.variants[selectedVariant]?._id);
                    return (salePrice * quantity).toLocaleString();
                  })()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full greenOne text-black py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="greenTwo w-full text-white py-4 rounded-lg font-semibold transition-colors"
              >
                Buy Now
              </button>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await dispatch(
                      (addToWishlist as any)({
                        product: productData._id,
                        variant: productData.variants[selectedVariant]._id,
                      })
                    );
                    try {
                      trackEvent("ADD_TO_WISHLIST", {
                        productId: productData._id,
                        variantId: productData.variants[selectedVariant]._id,
                        user: isAuthenticated ? userId : "guest",
                        timestamp: new Date().toISOString(),
                      });
                    } catch (err) {
                      /* non-blocking */
                    }
                  }}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Heart size={18} />
                  Wishlist
                </button>
                <button className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield size={16} className="text-[#07490C]" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck size={16} className="text-blue-600" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw size={16} className="text-purple-600" />
                <span>Easy Returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} className="text-orange-600" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Variant5;
