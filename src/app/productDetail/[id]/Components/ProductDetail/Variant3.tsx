import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
} from "@/app/store/slices/cartSlice";
import { setCheckoutOpen } from "@/app/store/slices/checkOutSlice";
import { selectSelectedProduct, setCurrentVariantImage } from "@/app/store/slices/productSlice";
import {
  Clock,
  RotateCcw,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { trackEvent } from "@/app/lib/tracking/trackEvent";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

interface Variant3Props {
  productData?: any;
}

function Variant3({ productData: propProductData }: Variant3Props) {
  const [expandedSection, setExpandedSection] =
    React.useState<string>("details");
  const [quantity, setQuantity] = React.useState<number>(1);
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propProductData || reduxProductData;
  const dispatch = useDispatch();
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);
  const [showFixedBar, setShowFixedBar] = React.useState<boolean>(false);
  const actionButtonsRef = React.useRef<HTMLDivElement>(null);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const userId = useSelector((state: any) => state.auth.user?._id);

  // Early return if no product data
  if (!productData) {
    return <div className="p-4 text-center text-gray-500">Loading product details...</div>;
  }

  // Normalize reviews if it's an array
  const reviewsData = Array.isArray(productData.reviews)
    ? { Average: productData.rating || 0, Reviews: productData.reviews }
    : productData.reviews || { Average: 0, Reviews: [] };

  const variants = productData.variants || [];
  const currentVariant = variants.find((v: any) => v._id === selectedVariant) || variants[0];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      if (actionButtonsRef.current) {
        const rect = actionButtonsRef.current.getBoundingClientRect();
        const isPastButtons = rect.bottom < 0;
        setShowFixedBar(isPastButtons);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

    const { salePrice } = getDisplayPrice(productData, selectedVariant);

    if (!salePrice && salePrice !== 0) {
      toast.error("Please select a valid variant");
      return;
    }

    // Get product ID - try multiple possible field names
    const productId = productData?._id || productData?.id || productData?.productId || productData?.product?._id || productData?.product?.id;
    if (!productId) {
      console.error("Product data structure:", productData);
      console.error("Available keys:", Object.keys(productData || {}));
      toast.error("Product ID is not available. Please refresh the page.");
      return;
    }

    try {
      const resultAction = (await (dispatch as any)(
        (addToCart as any)({
          product: productId, // Pass just the ID string like main page
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
          variantId: selectedVariant,
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
    const { salePrice } = getDisplayPrice(productData, selectedVariant);
    try {
      await (dispatch as any)(
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
      );
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
      toast.error("Failed to add to cart");
    }
  };
  return (
    <div className="lg:col-span-6 max-w-full overflow-hidden">
      {/* Fixed Buy Now and Add to Cart Section */}
      {productData && showFixedBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={getImageUrl(productData.thumbnail || productData.images?.[0])}
                alt={productData?.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {productData.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const { salePrice, originalPrice, hasSale } = getDisplayPrice(productData, selectedVariant);
                  return (
                    <>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{salePrice}
                      </span>
                      {hasSale && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:flex block gap-2">
              <button
                onClick={handleAddToCart}
                className="greenOne text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 text-sm max-md:mb-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="greenTwo text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm max-md:w-full"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl sm:p-6 shadow-sm mb-6 w-full">
        {/* Title & Rating */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {productData?.name}
        </h1>



        {/* Price Section */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            {(() => {
              const { salePrice, originalPrice, hasSale, discount } = getDisplayPrice(productData, selectedVariant);
              return (
                <>
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{salePrice}
                  </span>
                  {hasSale && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <p className="text-sm text-gray-600">Inclusive of all taxes</p>
        </div>

        {/* Pack Selection - Horizontal Slider */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-sm text-gray-600">Stock, Available</span>
          </div>
          <div className="relative mb-6">
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400" style={{ scrollbarWidth: 'thin' }}>
              {variants.map((variant: any, index: number) => {
                // Calculate discount percentage
                const discountPercent = variant.salePrice && variant.price && variant.price > variant.salePrice
                  ? Math.round(((variant.price - variant.salePrice) / variant.price) * 100)
                  : 0;

                const isSelected = selectedVariant === variant._id;
                const variantImage = variant.image || (variant.images && variant.images.length > 0 ? variant.images[0] : null);
                const displayImage = variantImage || productData.thumbnail || productData.images?.[0];

                // Determine label based on variant
                const getVariantLabel = () => {
                  if (variant.offerTag) return variant.offerTag;
                  if (index === 0) return "Beginner";
                  if (index === 1) return "Saver";
                  if (index === 2) return "Super Saver";
                  return "";
                };

                const getPackLabel = () => {
                  if (variant.title && variant.title.toLowerCase().includes("pack")) return variant.title;
                  const quantity = variant.quantity || index + 1;
                  return `Pack of ${quantity}`;
                };

                return (
                  <button
                    key={variant._id}
                    className={`relative flex-shrink-0 w-[calc(33.333%-0.67rem)] min-w-[140px] md:w-[160px] bg-white border-2 rounded-xl overflow-hidden transition-all text-center ${isSelected
                      ? "border-green-800 shadow-lg ring-1 ring-green-800"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => {
                      setSelectedVariant(variant._id);
                      // Dispatch the variant image if available
                      if (variant.image) {
                        dispatch(setCurrentVariantImage(variant.image));
                      } else if (variant.images && variant.images.length > 0) {
                        dispatch(setCurrentVariantImage(variant.images[0]));
                      } else {
                        dispatch(setCurrentVariantImage(null));
                      }
                    }}
                  >
                    {/* Header Bar */}
                    <div className={`h-8 flex items-center justify-center font-bold text-xs ${isSelected ? "bg-green-800 text-white" : "bg-gray-100 text-gray-800 border-b border-gray-300"
                      }`}>
                      {variant.title || `Variant ${index + 1}`}
                    </div>

                    {/* Image Section */}
                    <div className="flex justify-center items-center bg-[#e2f0d9] min-h-[120px]">
                      {displayImage ? (
                        <img
                          src={getImageUrl(displayImage)}
                          alt={variant.title || `Variant ${index + 1}`}
                          className="max-w-full max-h-[80px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-[80px] bg-gray-200 rounded flex items-center justify-center text-gray-400 text-[10px]">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Pricing Section */}
                    <div className="p-2 space-y-1">
                      <div className="flex flex-wrap items-center justify-center gap-1 mb-0.5">
                        {variant.price && variant.price > (variant.salePrice || variant.price) && (
                          <span className="text-[9px] text-gray-400 line-through">
                            ₹{variant.price}
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          ₹{variant.salePrice || variant.price}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-700 leading-tight">
                        {getPackLabel()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-800">
                        {getVariantLabel()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quantity & Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center customBorder border-gray-300 rounded-lg">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div ref={actionButtonsRef} className="flex gap-3 mb-6">
          <button
            onClick={handleAddToCart}
            className="flex-1 greenOne text-black py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} className="max-sm:hidden" />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="greenTwo text-white py-4 px-8 rounded-xl font-semibold transition-colors"
          >
            Buy Now
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Truck size={18} className="text-[#07490C]" />
            <span>Free Delivery</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <RotateCcw size={18} className="text-[#07490C]" />
            <span>Easy Returns</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Shield size={18} className="text-[#07490C]" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock size={18} className="text-[#07490C]" />
            <span>7-8 Days Delivery</span>
          </div>
        </div>

        {/* Coupons */}
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white rounded-2xl shadow-sm pb-24 lg:pb-6">
        <div className="border-b border-gray-200">
          <div className="flex max-sm:overflow-x-scroll ">
            {[
              { key: "details", label: "Details" },
              { key: "ingredients", label: "Ingredients" },
              { key: "benefits", label: "Benefits" },
              { key: "precautions", label: "Precautions" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => toggleSection(tab.key)}
                className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${expandedSection === tab.key
                  ? "border-green-500 text-[#07490C]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {expandedSection === "details" && (
            <div
              dangerouslySetInnerHTML={{
                __html: productData.description,
              }}
              className="text-gray-700 leading-relaxed"
            ></div>
          )}

          {expandedSection === "ingredients" && (
            <div className="space-y-3">
              {productData.ingredients.map((item: any) => (
                <div key={item._id} className="flex items-start gap-3">
                  <div className="w-2 h-2 greenOne rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-gray-700">
                    {(item.name || item.title) && (
                      <div className="font-semibold text-gray-900 mb-1">
                        {item.name || item.title}
                      </div>
                    )}
                    {item.description && (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.description,
                        }}
                      ></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {expandedSection === "benefits" && (
            <div className="space-y-3">
              {productData.benefits.map((item, idx) => (
                <div key={item._id} className="flex flex-col items-start gap-3">
                  <span className="flex gap-2">
                    <div className="w-2 h-2  greenOne rounded-full mt-2 flex-shrink-0"></div>
                    <strong>
                      {idx + 1}. {item.title}
                    </strong>
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.description,
                    }}
                    className="text-gray-700"
                  ></span>
                </div>
              ))}
            </div>
          )}

          {expandedSection === "precautions" && (
            <div className="space-y-3">
              {productData.precautions.map((item: any) => (
                <div key={item._id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.description || item.name || "",
                    }}
                    className="text-gray-700"
                  ></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Variant3;
