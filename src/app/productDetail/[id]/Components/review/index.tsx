import { Star } from "lucide-react";
import renderCardsVariant from "./variant1";
import RenderTestimonialVariant from "./variant2";
import RenderListVariant from "./variant3";
import RenderCardsVariant from "./variant1";
import AyurvedicReviewsVariant from "./Variant4";
import { useSelector } from "react-redux";
import { selectSelectedProduct } from "@/app/store/slices/productSlice";

export function CustomerReviews({
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
  const productData = useSelector(selectSelectedProduct);

  const reviewSettings = {
    ...{
      showRatingOverview: true,
      showReviewImages: true,
      maxReviews: 3,
      span: component.span || 1,
      variant: "cards",
      Average: 3,
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "cards",
  };

  // Dummy review data

  const renderVariant = () => {
    switch (reviewSettings.variant) {
      case "list":
        return <RenderListVariant />;
      case "testimonial":
        return <RenderTestimonialVariant />;
      case "ayurvedic":
        return <AyurvedicReviewsVariant />;
      default:
        return <RenderCardsVariant />;
    }
  };

  if (productData?.reviews?.Reviews.length === 0) {
    return null; // No reviews to display
  }

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
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Star size={20} className="text-yellow-600" />
            </div>
            Customer Reviews
            {isFullWidth && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
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
