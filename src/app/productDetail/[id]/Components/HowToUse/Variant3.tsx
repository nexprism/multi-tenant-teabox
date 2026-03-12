import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";

function Variant3() {
  const productData = useSelector(selectSelectedProduct);
  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  // measure component width
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      setWidth(w);
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);

  // compute a font size from the measured width and clamp it between 50 and 130px
  const computedTitleSize = Math.min(
    130,
    Math.max(50, Math.round(width * 0.12))
  );
  const titleStyle: React.CSSProperties = {
    fontFamily: "Bebas Neue, sans-serif",
    fontSize: `${computedTitleSize}px`,
    lineHeight: 0.95, // reduce line-height which was causing extra vertical spacing
  };

  // new: computed sizes for the steps grid/card so lg classes don't force too-large sizes
  const computedStepTitle = Math.min(
    40,
    Math.max(22, Math.round(width * 0.06))
  ); // px
  const computedStepNumberSize = Math.min(
    80,
    Math.max(48, Math.round(width * 0.12))
  ); // width/height px
  const computedStepNumberText = Math.min(
    28,
    Math.max(16, Math.round(width * 0.06))
  ); // px
  const computedCardPadding = Math.min(
    40,
    Math.max(16, Math.round(width * 0.04))
  ); // px

  return (
    <section className=" text-white py-20 px-4 relative overflow-hidden">
      {/* attach ref to this wrapper so we measure the actual rendered width */}
      <div ref={wrapperRef} className="max-w-7xl mx-auto relative z-10">
        {/* small unobtrusive badge showing measured width */}
        {/* <div className="absolute top-4 right-4 z-20">
          <span className="bg-black/60 text-white text-xs rounded px-2 py-1">
            {width}px
          </span>
        </div> */}

        {/* Header Section */}
        <div className="text-center mb-20">
          <h1
            // keep classes for other styling but override size via inline style
            className="text-4xl md:text-5xl text-black bebas mb-4 md:mb-0"
            style={titleStyle}
          >
            HOW TO USE
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-2"></div>
          <p
            className="text-lg md:text-lg text-black max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Follow our comprehensive guide to master the platform in just 4
            simple steps
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-20">
          <div className="w-full mx-auto">
            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group">
              <iframe
                src={`${
                  productData?.howToUseVideo
                    ? `https://www.youtube.com/embed/${extractVideoId(
                        productData.howToUseVideo
                      )}`
                    : "https://www.youtube.com/embed/hWVJucr3Il8"
                }?autoplay=1&mute=1&rel=0&modestbranding=1`}
                allowFullScreen
                className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                style={{ border: 0 }}
                title="How To Use Tutorial Video"
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        {/* Use measured width to control columns (md breakpoint = 768px) */}
        <div
          className="grid gap-8 lg:gap-12 mb-20"
          style={{
            gridTemplateColumns: width < 480 ? "1fr" : "repeat(2, 1fr)",
          }}
        >
          {productData.howToUseSteps.map((step, index) => (
            <div key={index} className="group relative">
              {/* Step Card */}
              <div
                className="backdrop-blur-sm border border-gray-700 rounded-3xl p-8 lg:p-10 h-full hover:border-gray-500 transition-all duration-500 hover:transform hover:scale-105"
                style={{ padding: `${computedCardPadding}px` }}
              >
                {/* Step Number */}
                <div className="flex items-center mb-6">
                  <div
                    className="rounded-full bg-gradient-to-br font-poppins from-white to-gray-200 text-black flex items-center justify-center font-black"
                    style={{
                      width: `${computedStepNumberSize}px`,
                      height: `${computedStepNumberSize}px`,
                      fontSize: `${computedStepNumberText}px`,
                      minWidth: `${computedStepNumberSize}px`,
                      minHeight: `${computedStepNumberSize}px`,
                      lineHeight: 1,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="ml-4 flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                </div>

                {/* Step Content */}
                <h3
                  className="text-3xl lg:text-4xl text-black xl:text-5xl font-black mb-2 leading-tight transition-colors"
                  style={{
                    fontSize: `${computedStepTitle}px`,
                    lineHeight: 1.05,
                  }}
                >
                  {step.title}
                </h3>

                <div
                  className="text-md text-gray-300 text leading-relaxed mb-8 group-hover:text-gray-800 transition-colors"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: step.description }}
                />

                {/* Step Features */}
                <div className="space-y-4">
                  {[1, 2].map((feature) => (
                    <div key={feature} className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full border-black border"></div>
                      <span
                        className="text-gray-400 text-sm"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        Key feature or benefit #{feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              </div>

              {/* Connection Lines rendered based on measured width instead of Tailwind viewport breakpoints */}
              {index < productData.howToUseSteps.length - 1 && width >= 768 && (
                <div className="absolute -bottom-6 left-1/2 w-px h-12 bg-gradient-to-b from-gray-600 to-transparent transform -translate-x-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r bg/80 bg backdrop-blur-sm border border-gray-700 rounded-3xl p-12 lg:p-16">
            <h2
              className="text-5xl lg:text-6xl xl:text-7xl font-black mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              READY TO BEGIN?
            </h2>
            <p
              className="text-xl lg:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              You now have everything you need to get started. Launch your
              journey today!
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <button
                className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Start Now
              </button>
              <button
                className="px-10 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:border-gray-400 bg-gray-800/50 transition-all duration-300"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Watch Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Variant3;
