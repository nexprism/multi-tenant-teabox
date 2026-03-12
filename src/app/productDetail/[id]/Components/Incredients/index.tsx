import { BookOpen } from "lucide-react";
import RenderScrollingVariant from "./Variant1";
import ModernIngredientsUI from "./Variant2";
import PremiumIngredientsUI from "./Variant3";
import AyurvedicIngredientsUI from "./Variant4";

export function Ingredients({
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
  const ingredientSettings = {
    ...{
      showImages: true,
      showDetails: true,
      span: component.span || 1,
      variant: "scrolling",
    },
    ...settings[component.id],
    variant:
      component.variant || settings[component.id]?.variant || "scrolling",
  };

  const ingredients = product?.ingredients || [];

  const renderVariant = () => {
    switch (ingredientSettings.variant) {
      case "scrolling":
        return <RenderScrollingVariant data={ingredients} />;
      case "modern":
        return <ModernIngredientsUI data={ingredients} />;

      case "premium":
        return <PremiumIngredientsUI data={ingredients} />;
      case "ayurvedic":
        return <AyurvedicIngredientsUI productData={product} />;
      default:
        return <RenderScrollingVariant data={ingredients} />;
    }
  };

  return (
    <div
      className={`${isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-2xl shadow-xl border border-gray-100"
        } ${isPreviewMode ? "" : "p-6 mb-4"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-green-100 rounded-xl">
              <BookOpen size={20} className="text-green-600" />
            </div>
            Ingredients
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
