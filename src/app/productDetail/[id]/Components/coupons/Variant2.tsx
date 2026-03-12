import { Check, Gift, Tag } from "lucide-react";
import React from "react";

function Variant2({ coupons, couponSettings, isFullWidth = false }) {
  const [selectedCoupon, setSelectedCoupon] = React.useState(null);

  const handleSelectCoupon = (coupon: any) => {
    if (selectedCoupon?._id === coupon._id) {
      setSelectedCoupon(null);
    } else {
      setSelectedCoupon(coupon);
    }
  };
  return (
    <div className="space-y-6 max-w-full md:max-w-[40vw]">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          💳 Discount Coupons
        </h3>
        <p className="text-gray-600">Save more with our exclusive offers</p>
      </div>

      <div
        className={`grid ${isFullWidth ? "grid-cols-4" : "grid-cols-2"} gap-4`}
      >
        {coupons.map((coupon: any) => {
          let color = "bg-gradient-to-r from-green-500 to-teal-500";
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
              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedCoupon?._id === coupon._id
                  ? "scale-105 ring-2 ring-green-400"
                  : ""
              }`}
              onClick={() => handleSelectCoupon(coupon)}
            >
              <div
                className={`${color} rounded-xl p-5 relative overflow-hidden text-white`}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-20">
                  <Gift size={48} className="transform rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} />
                    <span className="font-bold text-sm">{coupon.code}</span>
                  </div>
                  <div className="font-bold text-xl mb-2">{discount}</div>
                  <div className="text-xs opacity-90 mb-2">
                    {coupon.description}
                  </div>
                  <div className="text-xs opacity-75">
                    Min: ₹{coupon.minCartValue}
                  </div>
                </div>

                {selectedCoupon?._id === coupon._id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <Check size={12} className="text-green-600" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCoupon && couponSettings.showSelection && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="text-center">
            <h4 className="font-semibold text-green-800 mb-1">
              Selected Coupon
            </h4>
            <p className="text-green-700">
              {selectedCoupon.code} -{" "}
              {selectedCoupon.type === "percent"
                ? `${selectedCoupon.value}% OFF`
                : `₹${selectedCoupon.value} OFF`}
            </p>
            <button
              onClick={() => setSelectedCoupon(null)}
              className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium"
            >
              Remove Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Variant2;
