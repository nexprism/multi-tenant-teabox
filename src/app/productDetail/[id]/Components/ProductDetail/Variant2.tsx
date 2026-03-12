import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
} from "@/app/store/slices/cartSlice";
import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import { ChevronDown, ShoppingCart, Star } from "lucide-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { trackEvent } from "@/app/lib/tracking/trackEvent";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

interface Variant2Props {
  productData?: any;
  detailSettings?: any;
}

function Variant2({ productData: propProductData, detailSettings }: Variant2Props) {
  const [expandedSection, setExpandedSection] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propProductData || reduxProductData;
  const dispatch = useDispatch() as any;
  const [selectedVariant, setSelectedVariant] = React.useState<number>(
    productData?.variants?.[0]?._id || 0
  );
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

    const { salePrice } = getDisplayPrice(productData, selectedVariant);

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

    try {
      const resultAction = await dispatch(
        (addToCart as any)({
          product: productId, // Pass just the ID string like main page
          quantity,
          price: salePrice,
          variant: selectedVariant,
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

  // If you add a Buy Now button, use this logic:
  const handleBuyNow = async () => {
    const { salePrice } = getDisplayPrice(productData, selectedVariant);
    try {
      const resultAction = await dispatch(
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
      if (resultAction.error) {
        // Show backend error (payload) if present, else generic
        toast.error(
          resultAction.payload ||
          resultAction.error.message ||
          "Failed to proceed with Buy Now"
        );
        return;
      }
      // Navigate to checkout or perform any other action
    } catch (error) {
      toast.error(error?.message || "Failed to proceed with Buy Now");
    }
  };

  return (
    <div className="w-full">
      {/* Product Title and Rating */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {productData?.name}
        </h1>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${i < Math.round(productData?.reviews?.Average || 0)
                ? "fill-orange-400 text-orange-400"
                : "text-gray-300"
                }`}
            />
          ))}
        </div>
        {/* <span className="text-sm text-gray-600">({productData?.reviews?.Average?.toFixed(1)}) - 390 Product Sold</span> */}
        <span className="text-sm text-gray-600">
          ({productData?.reviews?.Average?.toFixed(1)})
        </span>
      </div>

      {/* Delivery Options */}
      {/* <div className="mb-6">
        <h3 className="font-semibold text-black mb-2">Delivery Options</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter pincode"
            className="flex-1 px-3 py-2 border text-black border-gray-300 rounded text-sm"
          />
          <button className="greenOne text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 transition-colors">
            Check
          </button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Product Delivers on your doorstep within 7-8 days
        </div>
      </div> */}

      {/* Pack Selection */}
      <div className="mb-6 relative">
        <h3 className="font-semibold text-black mb-3">Select Pack</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {productData?.variants?.map((variant, index) => (
            <div
              key={index}
              onClick={() => setSelectedVariant(variant._id)}
              className={`relative flex-1 min-w-[200px] border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedVariant == variant._id
                ? "border-green-600 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <div
                className={`absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded ${variant?.color === "green"
                  ? "greenOne"
                  : variant?.color === "orange"
                    ? "bg-orange-500"
                    : "bg-blue-500"
                  }`}
              >
                {(variant.salePrice - variant.price) / variant.price
                  ? `-${Math.round(
                    ((variant.price - variant.salePrice) / variant.price) *
                    100
                  )}%`
                  : ""}
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-black">
                  {variant.title}
                </div>
                <div
                  className={`font-semibold ${selectedVariant === variant._id
                    ? "text-green-600"
                    : "text-gray-900"
                    }`}
                >
                  ₹{variant.salePrice || variant.price}
                </div>
                {variant.salePrice && (
                  <div className="text-sm text-gray-500 line-through">
                    ₹{variant.price}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="mb-6">
        <h3 className="font-semibold text-black mb-2">Quantity</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="w-10 h-10 border border-gray-300 text-black rounded flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <span className="text-lg font-medium text-black px-4">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="w-10 h-10 border border-gray-300 text-black rounded flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleAddToCart}
          className="px-4 w-full py-3 border border-gray-300 text-black rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Product Details */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleSection("details")}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${expandedSection === "details"
              ? "bg-green-50 hover:bg-green-100"
              : "hover:bg-gray-50"
              }`}
          >
            <span
              className={`font-semibold text-base ${expandedSection === "details"
                ? "text-green-700"
                : "text-green-600"
                }`}
            >
              Product Details
            </span>
            <div
              className={`p-1 rounded-full transition-all duration-300 ${expandedSection === "details"
                ? "bg-green-200 rotate-180"
                : "bg-gray-100"
                }`}
            >
              <ChevronDown
                className={`transition-colors duration-200 ${expandedSection === "details"
                  ? "text-green-700"
                  : "text-gray-600"
                  }`}
                size={18}
              />
            </div>
          </button>
          <div
            className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${expandedSection === "details"
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
              } overflow-hidden`}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: productData.description,
              }}
              className="px-5 py-4 text-sm text-gray-700 leading-relaxed bg-gray-50"
            ></div>
          </div>
        </div>

        {/* Ingredients Accordion */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleSection("ingredients")}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${expandedSection === "ingredients"
              ? "bg-green-50 hover:bg-green-100"
              : "hover:bg-gray-50"
              }`}
          >
            <span
              className={`font-semibold text-base ${expandedSection === "ingredients"
                ? "text-green-700"
                : "text-green-600"
                }`}
            >
              Ingredients
            </span>
            <div
              className={`p-1 rounded-full transition-all duration-300 ${expandedSection === "ingredients"
                ? "bg-green-200 rotate-180"
                : "bg-gray-100"
                }`}
            >
              <ChevronDown
                className={`transition-colors duration-200 ${expandedSection === "ingredients"
                  ? "text-green-700"
                  : "text-gray-600"
                  }`}
                size={18}
              />
            </div>
          </button>
          <div
            className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${expandedSection === "ingredients"
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
              } overflow-hidden`}
          >
            <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
              <ul className="space-y-2 ">
                {productData.ingredients.map((item, idx) => (
                  <li
                    key={item._id || idx}
                    className="flex items-start b-10 gap-2"
                  >
                    <div className="w-1.5 h-1.5 greenOne rounded-full mt-2 flex-shrink-0"></div>
                    <div className="leading-relaxed">
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits Accordion */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleSection("benefits")}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${expandedSection === "benefits"
              ? "bg-green-50 hover:bg-green-100"
              : "hover:bg-gray-50"
              }`}
          >
            <span
              className={`font-semibold text-base ${expandedSection === "benefits"
                ? "text-green-700"
                : "text-green-600"
                }`}
            >
              Benefits
            </span>
            <div
              className={`p-1 rounded-full transition-all duration-300 ${expandedSection === "benefits"
                ? "bg-green-200 rotate-180"
                : "bg-gray-100"
                }`}
            >
              <ChevronDown
                className={`transition-colors duration-200 ${expandedSection === "benefits"
                  ? "text-green-700"
                  : "text-gray-600"
                  }`}
                size={18}
              />
            </div>
          </button>
          <div
            className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${expandedSection === "benefits"
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
              } overflow-hidden`}
          >
            <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
              <ul className="space-y-2">
                {productData.benefits.map((item, idx) => (
                  <li key={item._id || idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 greenOne rounded-full mt-2 flex-shrink-0"></div>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: item.description,
                      }}
                      className="leading-relaxed"
                    ></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Precautions Accordion */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleSection("precautions")}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${expandedSection === "precautions"
              ? "bg-green-50 hover:bg-green-100"
              : "hover:bg-gray-50"
              }`}
          >
            <span
              className={`font-semibold text-base ${expandedSection === "precautions"
                ? "text-green-700"
                : "text-green-600"
                }`}
            >
              Precautions
            </span>
            <div
              className={`p-1 rounded-full transition-all duration-300 ${expandedSection === "precautions"
                ? "bg-green-200 rotate-180"
                : "bg-gray-100"
                }`}
            >
              <ChevronDown
                className={`transition-colors duration-200 ${expandedSection === "precautions"
                  ? "text-green-700"
                  : "text-gray-600"
                  }`}
                size={18}
              />
            </div>
          </button>
          <div
            className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${expandedSection === "precautions"
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
              } overflow-hidden`}
          >
            <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
              <ul className="space-y-2">
                {productData.precautions &&
                  productData.precautions.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="px-5 py-2 text-sm text-gray-700 bg-gray-50"
                    >
                      <ul className="list-decimal list-inside space-y-2">
                        <li
                          key={item._id || idx}
                          className="flex flex-col items-start gap-1"
                        >
                          <span className="font-semibold">
                            {idx + 1}. {item.title}
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                            className="leading-relaxed"
                          ></span>
                        </li>
                      </ul>
                    </div>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* How to use */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleSection("usage")}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${expandedSection === "usage"
              ? "bg-green-50 hover:bg-green-100"
              : "hover:bg-gray-50"
              }`}
          >
            <span
              className={`font-semibold text-base ${expandedSection === "usage"
                ? "text-green-700"
                : "text-green-600"
                }`}
            >
              How to use
            </span>
            <div
              className={`p-1 rounded-full transition-all duration-300 ${expandedSection === "usage"
                ? "bg-green-200 rotate-180"
                : "bg-gray-100"
                }`}
            >
              <ChevronDown
                className={`transition-colors duration-200 ${expandedSection === "usage"
                  ? "text-green-700"
                  : "text-gray-600"
                  }`}
                size={18}
              />
            </div>
          </button>
          <div
            className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${expandedSection === "usage"
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
              } overflow-hidden`}
          >
            {productData.howToUseSteps &&
              productData.howToUseSteps.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="px-5 py-2 text-sm text-gray-700 bg-gray-50"
                >
                  <ul className="list-decimal list-inside space-y-2">
                    <li
                      key={item._id || idx}
                      className="flex flex-col items-start gap-1"
                    >
                      <span className="font-semibold">
                        {idx + 1}. {item.title}
                      </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.description,
                        }}
                        className="leading-relaxed"
                      ></span>
                    </li>
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Variant2;
