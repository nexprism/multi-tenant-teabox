import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function ModernIngredientsUI({ data }: { data?: any }) {
  const [activeIngredient, setActiveIngredient] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const ingredientsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const productData = useSelector(selectSelectedProduct);

  // Use passed data if provided, otherwise fallback to productData
  const ingredients = data || productData?.ingredients || [];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerTop = containerRef.current.offsetTop;
      const containerHeight = containerRef.current.offsetHeight;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress
      const progress = Math.min(
        Math.max(
          (scrollPosition - containerTop + windowHeight) /
          (containerHeight + windowHeight),
          0
        ),
        1
      );
      setScrollProgress(progress);

      // Update active ingredient based on scroll
      if (
        scrollPosition + windowHeight > containerTop &&
        scrollPosition < containerTop + containerHeight
      ) {
        // Find the index of the first ingredient that is in the center view
        const activeIndex = ingredientsRef.current.findIndex((ref) => {
          if (!ref) return false;
          const rect = ref.getBoundingClientRect();
          // Check if element overlaps comfortably with the center area
          return rect.top < windowHeight * 0.5 && rect.bottom > windowHeight * 0.3;
        });

        if (activeIndex !== -1) {
          setActiveIngredient((prev) => (prev !== activeIndex ? activeIndex : prev));
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Call once to set initial state if data is loaded
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
    // Depend on ingredients length so we re-attach/re-run when data loads, 
    // but NOT on activeIngredient to avoid loops.
  }, [ingredients.length]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen cream py-20 px-4 md:px-8"
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
            Recipe Ingredients
          </span>
          <h1 className="text-3xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight">
            What You'll Need
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Each ingredient plays a crucial role in creating the perfect blend
            of flavors
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mt-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Ingredient Cards */}
          <div className="space-y-6">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                ref={(el) => (ingredientsRef.current[index] = el)}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 transform ${activeIngredient === index
                  ? "scale-100 opacity-100 shadow-2xl"
                  : "scale-95 opacity-60"
                  }`}
              >
                {/* Mobile Image */}
                <div className="lg:hidden h-64 overflow-hidden">
                  {ingredient.image && (
                    <img
                      src={getImageUrl(ingredient.image)}
                      alt={ingredient.alt || ingredient.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${activeIngredient === index
                          ? "greenOne text-white scale-110"
                          : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {ingredient.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-green-600 font-semibold">
                          {ingredient.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    {ingredient.description ? (
                      <div
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: ingredient.description,
                        }}
                      />
                    ) : (
                      <p className="text-gray-600 leading-relaxed">
                        A key ingredient for this recipe.
                      </p>
                    )}
                  </div>

                  {/* Indicator */}
                  {activeIngredient === index && (
                    <div className="mt-6 flex items-center gap-2 text-green-600 font-semibold animate-pulse">
                      <div className="w-2 h-2 greenOne rounded-full"></div>
                      <span className="text-sm">Currently viewing</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Sticky Image Gallery */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px] bg-gray-100">
                {ingredients[activeIngredient]?.image && (
                  <img
                    src={getImageUrl(ingredients[activeIngredient].image)}
                    alt={
                      ingredients[activeIngredient].alt ||
                      ingredients[activeIngredient].name
                    }
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                  />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Image Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-3xl font-bold">
                      {ingredients[activeIngredient]?.name}
                    </h4>
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                      {activeIngredient + 1} of {ingredients.length}
                    </span>
                  </div>
                  <p className="text-white/90 font-medium">
                    {ingredients[activeIngredient]?.quantity}
                  </p>
                </div>
              </div>

              {/* Thumbnail Navigation */}
              <div className="grid grid-cols-4 gap-3">
                {ingredients.map((ingredient, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveIngredient(index);
                      ingredientsRef.current[index]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 ${activeIngredient === index
                      ? "ring-4 ring-[#07490C] scale-105"
                      : "ring-2 ring-gray-200 hover:ring-gray-300 opacity-60 hover:opacity-100"
                      }`}
                  >
                    {ingredient.image && (
                      <img
                        src={getImageUrl(ingredient.image)}
                        alt={ingredient.alt || ingredient.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg drop-shadow-lg">
                        {index + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        * {
          font-family: "Inter", sans-serif;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
