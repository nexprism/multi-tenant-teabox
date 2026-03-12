import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Star,
} from "lucide-react";
import renderSliderVariant from "./Variant1";

export function FrequentlyPurchased({
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
  const frequentlyPurchasedSettings = {
    ...{
      showRating: true,
      maxProducts: 4,
      layout: "slider",
      span: component.span || 1,
      variant: "slider",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "slider",
  };

  // Grid Variant - Clean grid layout

  const renderVariant = () => {
    switch (frequentlyPurchasedSettings.variant) {
      case "grid":
        return renderSliderVariant();

      default:
        return renderSliderVariant();
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
            <div className="p-2 bg-orange-100 rounded-xl">
              <ShoppingCart size={20} className="text-orange-600" />
            </div>
            Frequently Purchased
            {isFullWidth && (
              <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
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
