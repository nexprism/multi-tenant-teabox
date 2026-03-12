import Variant1 from "./Variant1";
import Variant2 from "./Variant2";
import Variant3 from "./Variant3";
import Variant4 from "./Variant4";

export function HowToUse({
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
  const howToUseSettings = {
    ...{
      showVideo: true,
      showSteps: true,
      span: component.span || 1,
      variant: "standard",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "standard",
  };

  const dummyHowToUseData = {
    howToUseVideo: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    howToUseSteps: [
      {
        number: "01",
        title: "Get Started",
        description:
          "Begin by unboxing your product and checking that all components are present and intact.",
      },
      {
        number: "02",
        title: "Setup",
        description:
          "Follow the quick start guide to set up your device or prepare the product for its first use.",
      },
      {
        number: "03",
        title: "Usage",
        description:
          "Use the product as directed. Refer to the manual for specific operating modes and safety instructions.",
      },
      {
        number: "04",
        title: "Maintenance",
        description:
          "Regular maintenance ensures longevity. Clean after use and store in a cool, dry place.",
      },
    ],
    storageInfo: {
      title: "Storage & Freshness",
      description:
        "Store in a cool, dry place away from direct sunlight. Once opened, keep refrigerated and consume within 25-30 days as it contains no strong artificial preservatives.",
    },
  };

  const data = product || dummyHowToUseData;

  const renderVariant = () => {
    switch (howToUseSettings.variant) {
      case "minimal":
        return <Variant1 productData={data} />;
      case "detailed":
        return <Variant2 productData={data} />;
      case "standard":
        return <Variant3 productData={data} />;
      case "ayurvedic":
        return <Variant4 productData={data} />;
      default:
        return <Variant1 productData={data} />;
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
      {renderVariant()}
    </div>
  );
}
