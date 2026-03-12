import { ChevronLeft, ChevronRight, Gift, Tag } from "lucide-react";
import React from "react";

function Variant1({ coupons, couponSettings }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [selectedCoupon, setSelectedCoupon] = React.useState(null);

  const itemsPerView = couponSettings.itemsPerView;
  const maxSlides = Math.max(0, (coupons?.length || 0) - itemsPerView);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlides));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handleSelectCoupon = (coupon: any) => {
    if (selectedCoupon?._id === coupon._id) {
      setSelectedCoupon(null);
    } else {
      setSelectedCoupon(coupon);
    }
  };

  return (
    <div className="space-y-6 max-w-full md:max-w-[40vw]">
    {/* <div className="space-y-6 max-w-full"> */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Available Offers
        </h3>
        <p className="text-gray-600">
          Choose from our exclusive discount coupons
        </p>
      </div>

      <div className="relative max-w-full">
        <div className="flex relative items-center gap-3 max-w-full">
          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`w-8 h-8 left-0 top-1/2 translate-y-[-50%] absolute z-30 rounded-full border-2 flex items-center justify-center transition-all ${
              currentSlide === 0
                ? "border-gray-200 bg-white text-gray-300 cursor-not-allowed"
                : "border text-green-600 hover:bg-green-50"
            }`}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Coupon Container */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-3 transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${
                  currentSlide * (100 / itemsPerView)
                }%)`,
              }}
            >
              {coupons.map((coupon: any) => {
                // Assign color and textColor based on type
                let color = "bg-gradient-to-r from-green-500 to-teal-500";
                let textColor = "text-white";
                if (coupon.type === "percent")
                  color = "bg-gradient-to-r from-blue-500 to-cyan-500";
                if (coupon.type === "flat")
                  color = "bg-gradient-to-r from-orange-500 to-red-500";

                const discount =
                  coupon.type === "percent"
                    ? `${coupon.value}% OFF`
                    : `₹${coupon.value} OFF`;

                return (
                  <div
                    key={coupon._id}
                    className={`flex-shrink-0 w-1/2  max-w-[300px] relative cursor-pointer transition-all duration-300 ${
                      selectedCoupon?._id === coupon._id
                        ? "scale-105"
                        : "hover:scale-102"
                    }`}
                    onClick={() => handleSelectCoupon(coupon)}
                  >
                    <div
                      className={`${color} rounded-lg p-4 relative overflow-hidden`}
                    >
                      {/* Decorative pattern */}
                      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                        <Gift size={64} className="transform rotate-12" />
                      </div>

                      {/* Selection indicator */}
                      {selectedCoupon?._id === coupon._id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 greenOne rounded-full"></div>
                        </div>
                      )}

                      <div className={`${textColor} relative z-10`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={16} />
                          <span className="font-bold text-sm">
                            {coupon.code}
                          </span>
                        </div>
                        <div className="font-bold text-lg mb-1">{discount}</div>
                        <div className="text-xs opacity-90 mb-1">
                          {coupon.description || ""}
                        </div>
                        <div className="text-xs opacity-75">
                          Min order: ₹{coupon.minCartValue || 0}
                        </div>
                      </div>

                      {/* Border for selected coupon */}
                      {selectedCoupon?._id === coupon._id && (
                        <div className="absolute inset-0 border-3 border-white rounded-lg"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            disabled={currentSlide >= maxSlides}
            className={`w-8 h-8 absolute right-0 top-1/2 translate-y-[-50%] z-30 rounded-full border-2 flex items-center justify-center transition-all ${
              currentSlide >= maxSlides
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border text-green-600 hover:bg-green-50"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Selected Coupon Display */}
        {selectedCoupon && couponSettings.showSelection && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 greenOne rounded-full"></div>
                <span className="text-sm font-medium text-green-700">
                  Coupon {selectedCoupon.code} selected -{" "}
                  {selectedCoupon.type === "percent"
                    ? `${selectedCoupon.value}% OFF`
                    : `₹${selectedCoupon.value} OFF`}
                </span>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Slide indicators */}
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: maxSlides + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === index ? "greenOne" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Variant1;
