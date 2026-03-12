import { Check, Gift } from "lucide-react";
import React from "react";

function Variant3({ coupons }) {
  const [selectedCoupon, setSelectedCoupon] = React.useState(null);

  const handleSelectCoupon = (coupon: any) => {
    if (selectedCoupon?._id === coupon._id) {
      setSelectedCoupon(null);
    } else {
      setSelectedCoupon(coupon);
    }
  };
  return (
    <div className="space-y-4 max-w-full md:max-w-[40vw]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-xl">
          <Gift size={20} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Available Offers</h3>
          <p className="text-sm text-gray-600">
            {coupons.length} coupons available
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {coupons.slice(0, 3).map((coupon: any, idx: number) => {
          const discount =
            coupon.type === "percent"
              ? `${coupon.value}% OFF`
              : `₹${coupon.value} OFF`;

          return (
            <div
              key={coupon._id}
              className={`flex items-center justify-between p-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                selectedCoupon?._id === coupon._id
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-green-300"
              }`}
              onClick={() => handleSelectCoupon(coupon)}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 greenOne rounded-full"></div>
                <div>
                  <span className="font-semibold text-gray-900">
                    {coupon.code}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="font-medium text-green-600">{discount}</span>
                </div>
              </div>
              {selectedCoupon?._id === coupon._id && (
                <Check size={16} className="text-green-600" />
              )}
            </div>
          );
        })}
      </div>

      {selectedCoupon && (
        <div className="mt-3 text-center text-sm text-green-700 font-medium">
          ✓ {selectedCoupon.code} applied
        </div>
      )}
    </div>
  );
}

export default Variant3;
