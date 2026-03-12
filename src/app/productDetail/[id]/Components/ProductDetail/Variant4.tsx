import React from "react";
import {
  Check,
  ChevronDown,
  Gift,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
} from "@/app/store/slices/cartSlice";
import { toast } from "react-toastify";
import { setCheckoutOpen } from "@/app/store/slices/checkOutSlice";
import { trackEvent } from "@/app/lib/tracking/trackEvent";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

interface Variant4Props {
  productData?: any;
  detailSettings?: any;
}

function Variant4({ productData: propProductData, detailSettings }: Variant4Props) {
  const [expandedSection, setExpandedSection] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propProductData || reduxProductData;
  const [selectedVariant, setSelectedVariant] = React.useState<any>(
    productData?.variants?.[0] || null
  );

  // Early return if no product data
  if (!productData) {
    return <div className="p-4 text-center text-gray-500">Loading product details...</div>;
  }
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };
  const dispatch = useDispatch() as any;

  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const userId = useSelector((state: any) => state.auth.user?._id);

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

    const { salePrice } = getDisplayPrice(productData, selectedVariant?._id);

    if (!salePrice && salePrice !== 0) {
      toast.error("Please select a valid variant");
      return;
    }

    // Get product ID - try multiple possible field names
    const productId = productData._id || productData.id || productData.productId || productData.product?._id || productData.product?.id;
    if (!productId) {
      console.error("Product data structure:", productData);
      console.error("Available keys:", Object.keys(productData || {}));
      toast.error("Product ID is not available. Please refresh the page.");
      return;
    }

    // Extract variant ID - handle both object and string cases
    const variantId = selectedVariant?._id || selectedVariant;

    try {
      const resultAction = (await (dispatch as any)(
        (addToCart as any)({
          product: productId, // Pass just the ID string like main page
          quantity,
          price: salePrice,
          variant: variantId,
        })
      )) as any;
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
            await (dispatch as any)(getCartItems());
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
    const { salePrice } = getDisplayPrice(productData, selectedVariant?._id || selectedVariant);
    try {
      const resultAction = (await (dispatch as any)(
        (setBuyNowProduct as any)({
          product: {
            id: productData._id,
            name: productData.name,
            image: getImageUrl(productData.thumbnail || productData.images?.[0]),
            variant: selectedVariant,
            slug: productData.slug,
          },
          quantity,
          price: salePrice,
          variant: selectedVariant,
        })
      )) as any;
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
          variantId: selectedVariant,
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {productData?.name}
            </h1>
            <p className="text-md text-gray-600">{productData.subtitle}</p>
          </div>
        </div>

        {/* Rating & Social Proof */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={`${i < Math.floor(productData?.reviews?.Average || 0)
                    ? "fill-orange-400 text-orange-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-900">
              {productData?.reviews?.Average.toFixed(1)}
            </span>
            <span className="text-gray-500">({productData?.reviews?.Reviews.length})</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          {/* <div className="flex items-center gap-2 text-[#07490C]">
            <Users size={16} />
            <span className="font-medium">{productData.soldCount}</span>
          </div> */}
        </div>
      </div>

      {/* Price Section with Animation */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200">
        <div className="flex items-baseline gap-4 mb-2">
          {(() => {
            const { salePrice, originalPrice, hasSale, discount } = getDisplayPrice(productData, selectedVariant?._id);
            return (
              <>
                <span className="text-4xl font-bold text-gray-900">
                  ₹{salePrice}
                </span>
                {hasSale && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{originalPrice}
                    </span>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Save {discount}%
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
        <p className="text-sm text-gray-600">
          Free shipping • Easy returns • Best price guaranteed
        </p>
      </div>

      {/* Variant Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Choose Your Pack
        </h3>
        <div className="flex md:grid md:grid-cols-1 gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {productData?.variants?.map((variant) => (
            <button
              key={variant._id}
              className={`relative flex-shrink-0 min-w-[280px] p-4 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${selectedVariant?._id === variant._id
                ? "border-orange-400 bg-orange-50 shadow-md"
                : "border-gray-200 hover:border-gray-300"
                }`}
              onClick={() => setSelectedVariant(variant)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      {variant.title}
                    </span>
                    {variant.popular && (
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Most Popular
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {variant.subtitle}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{variant.salePrice || variant.price}
                    </span>
                    {variant.salePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{variant.price}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedVariant._id === variant._id
                    ? "border-orange-400 bg-orange-400"
                    : "border-gray-300"
                    }`}
                >
                  {selectedVariant._id === variant._id && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center bg-gray-100 rounded-xl">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="p-3 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-12 text-center font-bold text-lg">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-3 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleAddToCart}
          className="flex-1 greenOne text-black py-4 px-8 rounded-2xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
        >
          <ShoppingCart size={22} />
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="greenTwo text-white py-4 px-8 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          Buy Now
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4">
        {productData?.features?.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Icon size={20} className="text-[#07490C]" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {feature.title}
                </div>
                <div className="text-xs text-gray-600">
                  {feature.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offers Section */}
      {/* <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">
            Special Offers
          </h3>
        </div>
        <div className="space-y-3">
          {productData?.offers?.map((offer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <div>
                  <span className="font-bold text-purple-700">
                    {offer.code}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {offer.discount}
                  </span>
                  {offer.minOrder !== "No minimum" && (
                    <span className="text-xs text-gray-500 block">
                      Min order: {offer.minOrder}
                    </span>
                  )}
                </div>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                Copy
              </button>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}

export default Variant4;
