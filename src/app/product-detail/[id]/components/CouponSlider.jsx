"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoupons } from "@/app/store/slices/couponSlice";
import { toast } from "react-toastify";

const CouponSlider = () => {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const dispatch = useDispatch();

  const { items: coupons = [], loading } = useSelector(
    (state) => state.coupon
  );

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const scroll = (direction) => {
    const container = sliderRef.current;
    if (!container) return;

    const scrollAmount = 280;

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

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
    clearTimeout(handleScroll.timeout);
    handleScroll.timeout = setTimeout(updateScrollButtons, 50);
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);

    return () => clearTimeout(timer);
  }, [coupons]);

  if (loading) {
    return (
      <div className="w-full py-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[260px] h-28 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`absolute -left-3 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 border border-gray-200 ${
            canScrollLeft
              ? "text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100"
              : "text-gray-300 cursor-not-allowed opacity-0"
          }`}
        >
          <ChevronLeft size={20} className="text-green-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 border border-gray-200 ${
            canScrollRight
              ? "text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100"
              : "text-gray-300 cursor-not-allowed opacity-0"
          }`}
        >
          <ChevronRight size={20} className="text-green-600" />
        </button>

        {/* Slider Container */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide gap-4 py-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {coupons.map((coupon, index) => (
            <div
              key={coupon._id || index}
              className="min-w-[260px] flex-shrink-0 relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-dashed border-green-300 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              {/* Decorative circles */}
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-green-300" />
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-green-300" />

              {/* Discount Badge */}
              <div className="absolute -top-2 -right-2 greenOne text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {coupon.type === "percent"
                  ? `${coupon.value}% OFF`
                  : `₹${coupon.value} OFF`}
              </div>

              {/* Coupon Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-green-800 text-sm uppercase tracking-wide">
                    {coupon.code}
                  </h4>
                  <button
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className="p-1.5 hover:bg-green-200 rounded-md transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === coupon.code ? (
                      <Check size={16} className="text-green-700" />
                    ) : (
                      <Copy size={16} className="text-green-600" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-700 line-clamp-2">
                  {coupon.description || "Save on your purchase"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="text-xs text-gray-600">
                    Min: ₹{coupon.minCartValue || 0}
                  </span>
                  {coupon.maxDiscount && (
                    <span className="text-xs text-gray-600">
                      Max: ₹{coupon.maxDiscount}
                    </span>
                  )}
                </div>

                {coupon.expiryDate && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>Valid till:</span>
                    <span className="font-medium">
                      {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CouponSlider;