import { Gift } from "lucide-react";
import Variant2 from "./Variant2";
import Variant1 from "./Variant1";
import Variant3 from "./Variant3";
import { useEffect, useState } from "react";
import axiosInstance from "@/axiosConfig/axiosInstance";

export function Coupons({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
  COMPONENT_SPANS,
}: {
  component: any;
  product: any;
  settings: any;
  onUpdateSettings: any;
  onUpdateSpan: any;
  isFullWidth?: boolean;
  isPreviewMode?: boolean;
  COMPONENT_SPANS: any;
}) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const couponSettings = {
    ...{
      itemsPerView: 2,
      showSelection: true,
      span: component.span || 1,
      variant: "slider",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "slider",
  };

  // Fetch coupons from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/coupon", {
          params: {
            status: "active", // Only fetch active coupons
          },
        });

        console.log("Fetched coupons:", response);
        
        if (response.data) {
          setCoupons(response.data.coupons?.data || []);
        }
      } catch (error) {
        console.error("Error fetching coupons:", error);
        // Keep empty array on error
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const renderVariant = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      );
    }

    // Show empty state if no coupons
    if (!coupons || coupons.length === 0) {
      return (
        <div className="text-center py-8">
          <Gift size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No coupons available at the moment</p>
        </div>
      );
    }

    switch (couponSettings.variant) {
      case "grid":
        return <Variant1 coupons={coupons} couponSettings={couponSettings} />;
      case "slider":
        return <Variant2 coupons={coupons} couponSettings={couponSettings} />;
      case "compact":
        return <Variant3 coupons={coupons} />;
      default:
        return <Variant1 coupons={coupons} couponSettings={couponSettings} />;
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-2xl shadow-xl border border-gray-100"
      } ${isPreviewMode ? "" : "p-6 mb-4"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-green-100 rounded-xl">
              <Gift size={20} className="text-green-600" />
            </div>
            Discount Coupons
            {isFullWidth && (
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                Full Width
              </span>
            )}
          </h3>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}
