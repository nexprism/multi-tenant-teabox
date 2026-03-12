import { FileText } from "lucide-react";
import Variant1 from "./Variant1";
import Variant2 from "./Variant2";
import Variant3 from "./Variant3";

export function Description({
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
  const descriptionSettings = {
    ...{
      showVideo: true,
      showImages: true,
      span: component.span || 1,
      variant: "layout",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "layout",
  };

  // Use product data if available
  const data = product || {};

  const renderVariant = () => {
    switch (descriptionSettings.variant) {
      case "compact":
        return <Variant1 descriptionData={data} />;
      case "showcase":
        return <Variant2 descriptionData={data} />;
      case "layout":
        return <Variant3 descriptionData={data} />;
      default:
        return <Variant1 descriptionData={data} />;
    }
  };

  return (
    <div
      className={`${isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-2xl shadow-xl border border-gray-100"
        } ${isPreviewMode ? "" : "p-6 mb-4"} ${isFullWidth ? "w-auto" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-purple-100 rounded-xl">
              <FileText size={20} className="text-purple-600" />
            </div>
            Description
            {isFullWidth && (
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
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
