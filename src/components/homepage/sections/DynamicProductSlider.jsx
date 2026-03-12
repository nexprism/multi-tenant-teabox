"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import teaOne from "../../../../public/images/one.webp";
import { fetchFrequentlyPurchasedProducts } from "@/app/store/slices/productSlice";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react";
import {
  addToCart,
  getCartItems,
  setBuyNowProduct,
  toggleCart,
  closeCart,
} from "@/app/store/slices/cartSlice";
import { setCheckoutOpen } from "@/app/store/slices/checkOutSlice";

import { toast } from "react-toastify";
import TrySectionCard from "@/app/search/TrySectionCard";
import { useTrack } from "@/app/lib/tracking/useTrack";
import AnimatedGradientBorder from "@/components/ui/AnimatedGradientBorder";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

const DynamicProductSlider = ({ content }) => {
  const { title, description, image } = content;
  // Use separate frequentlyPurchased state to avoid colliding with ProductGrid's main product list
  const { frequentlyPurchased, loading } = useSelector((state) => state.product);




  // Safely derive stories from products (handling both array and object structure)
  const rawProducts = Array.isArray(frequentlyPurchased) ? frequentlyPurchased : [];

  // Merge Product Stories (Admin)
  const stories = rawProducts.filter((P) => P?.storyVideoUrl).map(p => ({ ...p, isUserStory: false }));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayProduct, setOverlayProduct] = useState(null);

  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const { trackAddToCart, trackView } = useTrack();

  const nextSlide = () => {
    const pages = Math.max(1, Math.ceil(stories.length / itemsPerPage));
    setCurrentSlide((prev) => (prev + 1) % pages);
  };

  const prevSlide = () => {
    const pages = Math.max(1, Math.ceil(stories.length / itemsPerPage));
    setCurrentSlide((prev) => (prev - 1 + pages) % pages);
  };

  // Static products for now - you'll replace this with API data later

  // Initialize scroll buttons on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);

    return () => clearTimeout(timer);
  }, [frequentlyPurchased]);

  const scroll = (direction) => {
    const container = sliderRef.current;
    if (!container) return;

    const scrollAmount = 210; // Adjusted for card width (200px + 16px gap)

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

    // Update button states after scroll animation
    setTimeout(() => {
      updateScrollButtons();
    }, 300);
  };

  const updateScrollButtons = () => {
    const container = sliderRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const handleScroll = () => {
    // Throttle the scroll updates
    clearTimeout(handleScroll.timeout);
    handleScroll.timeout = setTimeout(updateScrollButtons, 50);
  };



  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    console.log("HandleAddToCart triggered for:", product);
    // if (!isAuthenticated) {
    //   setShowAuthModal(true);
    //   return;
    // }


    const { salePrice } = getDisplayPrice(product);

    try {
      const resultAction = await dispatch(
        addToCart({
          product: product.originalProductId || product._id,
          quantity: 1,
          price: salePrice,
          variant: product?.variants[0]?._id,
        })
      );

      // Don't immediately call getCartItems() - it can overwrite the cart if server hasn't synced
      // The addToCart action already updates the Redux state and localStorage
      // Only refresh cart from server after a delay to allow server to sync
      if (!resultAction.error) {
        setTimeout(async () => {
          try {
            await dispatch(getCartItems());
          } catch (err) {
            // Silently fail - cart is already updated locally
          }
        }, 500); // 500ms delay to allow server to process
      }

      dispatch(toggleCart());

      // track
      try {
        trackAddToCart(product.originalProductId || product._id);
      } catch (err) {
        // non-blocking
      }
    } catch (error) {
      // console.warn("Add to cart error:", error);
    }
  };

  const handleBuyNow = async (e, productData) => {
    e.stopPropagation();
    console.log("HandleBuyNow triggered for:", productData);

    // 1️⃣ Close cart immediately
    dispatch(closeCart());


    const { salePrice } = getDisplayPrice(productData);

    try {
      // 2️⃣ Normalize product image
      const productImage = productData.thumbnail || productData.images?.[0];
      const imageObj = productImage
        ? typeof productImage === "string"
          ? { url: productImage, alt: productData.name }
          : {
            url: productImage.url || productImage,
            alt: productImage.alt || productData.name,
          }
        : { url: "/Image-not-found.png", alt: productData.name };

      // 3️⃣ Prepare Buy Now payload
      const buyNowPayload = {
        product: {
          _id: productData.originalProductId || productData._id,
          id: productData.originalProductId || productData._id,
          name: productData.name,
          image: imageObj,
          category: productData.category,
        },
        quantity: 1,
        price: Number(salePrice || 0),
        variant: productData.variants[0]._id,
      };

      // 4️⃣ Update Redux (for UI state)
      const resultAction = await dispatch(setBuyNowProduct(buyNowPayload));

      if (resultAction.error) {
        toast.error(
          resultAction.payload ||
          resultAction.error.message ||
          "Failed to add to cart"
        );
        return;
      }

      // 5️⃣ FORCE write to localStorage (client-only)
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "dnd_ecommerce_buy_now",
          JSON.stringify(buyNowPayload)
        );
      }

      // 🔑 6️⃣ CRITICAL: wait one frame so browser flushes storage
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 7️⃣ Close overlay (UI cleanup)
      setOverlayProduct(null);

      // 8️⃣ Open checkout state (if used)
      dispatch(setCheckoutOpen());

      // 9️⃣ Navigate AFTER storage is guaranteed
      router.push("/checkout-popup");

      // 🔟 Tracking (non-blocking)
      try {
        trackAddToCart(productData.originalProductId || productData._id);
        trackEvent("BUY_NOW", {
          productId: productData.originalProductId || productData._id,
          variantId: productData.variants[0]._id,
        });
      } catch (_) { }

    } catch (error) {
      toast.error(error?.message || "Failed to add to cart");
    }
  };


  const openOverlay = (product) => {
    setOverlayProduct(product);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    // keep product for a short time to allow potential animations
    setTimeout(() => setOverlayProduct(null), 200);
  };

  // handle Escape key to close overlay and disable body scroll when open
  useEffect(() => {
    if (!overlayOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") closeOverlay();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    dispatch(
      fetchFrequentlyPurchasedProducts({
        frequentlyPurchased: true,
        limit: 10,
      })
    );
  }, []);

  // Responsively determine how many items to show per page for the story slider
  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      // breakpoints: mobile=1, sm>=640:2, md>=768:3, lg>=1024:4
      if (w >= 1024) setItemsPerPage(4);
      else if (w >= 768) setItemsPerPage(3);
      else if (w >= 640) setItemsPerPage(2);
      else setItemsPerPage(1);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);



  // If itemsPerPage changes, ensure currentSlide is within range
  useEffect(() => {
    const pages = Math.max(1, Math.ceil(stories.length / itemsPerPage));
    if (currentSlide > pages - 1) setCurrentSlide(pages - 1);
  }, [itemsPerPage, stories.length]);

  const isVideo = (url) => {
    return typeof url === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  // Check if we should show the component
  const hasProducts = frequentlyPurchased?.length > 0;
  if (loading || !hasProducts) {
    return null;
  }

  return (
    <div className="flex relative flex-col gap-4 justify-between w-full h-fit py-20 px-4 lg:px-0">
      {/* Background Image */}


      {/* Left Content - Dynamic from API */}
      <div className="flex-1 relative mb-8 lg:mb-0 lg:mr-8 z-20 text-center">
        <h1 className="text-4xl  md:text-5xl font-black text-gray-800 leading-tight mb-2 text-center">
          {/* <h1 className="text-4xl w-full font-black text-gray-800 leading-tight mb-2"> */}
          {title}
        </h1>
        <AnimatedGradientBorder />
        <div
          className="text-gray-800 font-medium text-lg mt-2 lg:max-w-[80%] mx-auto"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>

      {/* Right Content - Product Slider */}
      <div className="flex-1 relative z-20 ">
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`hidden sm:flex absolute -left-4 md:-left-5 top-1/2 border border-black/20 transform -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg items-center justify-center transition-all duration-200 ${canScrollLeft
              ? "text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100"
              : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="#3c950d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`hidden sm:flex absolute -right-2 md:-right-5 top-1/2 border transform -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg items-center justify-center transition-all duration-200 ${canScrollRight
              ? "text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100"
              : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="#3c950d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Slider Container */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="grid grid-cols-2 gap-4 auto-rows-fr  md:grid-cols-3 lg:flex lg:overflow-x-auto scrollbar-hide lg:space-x-4 py-4 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {frequentlyPurchased?.length > 0 ? (
              frequentlyPurchased.map((product, index) => (
                <TrySectionCard
                  key={product._id}
                  product={product}
                  showDes={false}
                  buyNow={true}
                />
              ))
            ) : null}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="mt-20">
        <div className="relative">
          <h1 className="text-3xl md:text-5xl w-full font-black text-gray-800 leading-tight mb-2 text-center">
            Story
          </h1>
          <AnimatedGradientBorder />
          <div className="relative mt-5">
            {/* Left Arrow */}
            <button
              onClick={prevSlide}
              className="absolute left-8 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={nextSlide}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Slider Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out gap-4"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {stories.map(
                  (product, index) => (
                    <div
                      key={product._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openOverlay(product)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          openOverlay(product);
                      }}
                      className="relative cursor-pointer"
                      style={{
                        flex: `0 0 ${100 / itemsPerPage}%`,
                        minWidth: 0,
                      }}
                    >
                      <div className="border border-gray-200 overflow-hidden rounded-2xl h-[307px] flex flex-col group">
                        {/* Name with green icon */}
                        <div className="absolute top-4 right-6 flex items-center justify-between mb-6 z-50">
                          <h3 className="text-md font-bold text-black uppercase tracking-wide">
                            {product?.userId?.name}
                          </h3>
                          <Image
                            className="h-6 w-6"
                            src={"/images/heart.webp"}
                            width={40}
                            height={40}
                            alt="heart-icon"
                          />
                        </div>

                        {/* Gray placeholder box - Fixed height */}
                        <div className="relative w-full h-[307px] rounded-lg">
                          {/* Placeholder for image or additional content */}
                          {isVideo(product?.storyVideoUrl) ? (
                            <video
                              src={getImageUrl(product?.storyVideoUrl)}
                              className="w-full h-full object-cover"
                              // controls
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={getImageUrl(product?.storyVideoUrl)}
                              alt="Story Visual"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Hover Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 max-sm:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 rounded-b-lg">
                            <h4 className="text-white text-sm font-semibold text-center mb-2 line-clamp-1">
                              {product.name}
                            </h4>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyNow(e, product);
                                }}
                                className="greenTwo text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                              >
                                Buy Now
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(e, product);
                                }}
                                className="greenOne text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-400 transition-colors duration-200"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Slider Dots Indicator */}
          < div className="flex justify-center mt-8 space-x-2" >
            {(() => {
              const pages = Math.max(1, Math.ceil(stories.length / itemsPerPage));
              return Array.from({ length: pages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentSlide === index ? "greenOne" : "bg-gray-300"
                    }`}
                />
              ));
            })()}
          </div >
          {/* Overlay for full-page media preview */}
          {
            overlayOpen && overlayProduct && (
              <div
                className="fixed max-sm:hidden inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4"
                onClick={closeOverlay}
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="relative max-h-[80%]  bg-white rounded-lg overflow-hidden shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={closeOverlay}
                    aria-label="Close preview"
                    className="absolute right-3 top-3 z-50 bg-white rounded-full w-9 h-9 flex items-center justify-center border shadow hover:bg-gray-50"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="w-full bg-black flex items-center justify-center">
                    {isVideo(overlayProduct.storyVideoUrl) ? (
                      <video
                        src={getImageUrl(overlayProduct.storyVideoUrl)}
                        controls
                        autoPlay
                        className="w-fit h-full object-cover bg-black"
                      />
                    ) : (
                      <img
                        src={getImageUrl(overlayProduct.storyVideoUrl)}
                        alt={overlayProduct.name || "story media"}
                        className="w-full h-full object-contain bg-black"
                      />
                    )}
                  </div>

                  <div className="  absolute bottom-4 left-1/2 max-sm:left-2/3 transform -translate-x-1/2 w-full md:w-auto rounded-lg ">
                    {/* Add to Cart Button */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleBuyNow(e, overlayProduct)}
                        className="w-32 h-10 mb-2 greenTwo text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        Buy Now
                      </button>

                      <button
                        onClick={(e) => handleAddToCart(e, overlayProduct)}
                        className="h-10 w-32 text-sm flex justify-center group items-center border hover:bg-[#3C950D]  rounded-lg"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
export default DynamicProductSlider;
