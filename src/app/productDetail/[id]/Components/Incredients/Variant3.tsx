import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function PremiumIngredientsUI({ data }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const sectionRef = useRef(null);
  const itemRefs = useRef([]);
  const productData = useSelector(selectSelectedProduct);

  // Use passed data if provided, otherwise fallback to productData
  const ingredients = data || productData?.ingredients || [];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;

      if (
        scrollPos + windowHeight > sectionTop &&
        scrollPos < sectionTop + sectionHeight
      ) {
        itemRefs.current.forEach((ref, idx) => {
          if (ref) {
            const rect = ref.getBoundingClientRect();
            if (
              rect.top < windowHeight * 0.5 &&
              rect.bottom > windowHeight * 0.3
            ) {
              setActiveIndex(idx);
            }
          }
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={sectionRef}
      className="min-h-screen bg-white text-gray-900 px-4 md:px-8 overflow-hidden"
    >
      {/* Floating Background Elements */}
      <div className=" inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 greenOne/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl pb-2 font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent uppercase" style={{ fontFamily: "Poppins, sans-serif" }} >
            Ingredients
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every element carefully chosen to create an unforgettable culinary
            experience
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative">
          {/* Central Timeline Line */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-transparent via-green-300 to-transparent h-full"></div>

          {/* Ingredients */}
          <div className="space-y-32">
            {ingredients.map((ingredient, index) => {
              const isLeft = index % 2 === 0;
              const isActive = activeIndex === index;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${isLeft ? "md:flex-row-reverse" : ""
                    }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Timeline Dot */}
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-20">
                    <div
                      className={`w-6 h-6 rounded-full border-4 border-white transition-all duration-500 ${isActive
                          ? "bg-gradient-to-r from-green-400 to-green-500 scale-150 shadow-lg"
                          : "bg-gray-200"
                        }`}
                    >
                      <div
                        className={`absolute inset-0 rounded-full transition-all duration-500 ${isActive
                            ? "bg-gradient-to-r from-green-400 to-green-500 animate-ping opacity-75"
                            : ""
                          }`}
                      ></div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div
                    className={`w-full md:w-[calc(50%-4rem)] transition-all duration-700 ${isActive ? "scale-100 opacity-100" : "scale-95 opacity-40"
                      }`}
                  >
                    <div
                      className={`relative group cursor-pointer transition-all duration-500 ${isHovered ? "transform -translate-y-2" : ""
                        }`}
                    >
                      {/* Card Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-3xl backdrop-blur-sm border border-gray-200 shadow-xl transition-all duration-500">
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 transition-opacity duration-500 rounded-3xl ${isActive || isHovered ? "opacity-5" : ""
                            }`}
                        ></div>
                      </div>

                      <div className="relative p-8">
                        {/* Number Badge */}
                        <div
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-r from-green-400 to-green-500 shadow-lg transition-all duration-500 ${isActive ? "scale-110" : "scale-100"
                            }`}
                        >
                          <span className="text-2xl font-black text-white">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        {/* Ingredient Name */}
                        <h3 className="text-3xl md:text-4xl font-black mb-3 text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                          {ingredient.name}
                        </h3>

                        {/* Quantity */}
                        <div className="flex items-center gap-2 mb-4">
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                            />
                          </svg>
                          <p className="text-gray-700 font-semibold">
                            {ingredient.quantity}
                          </p>
                        </div>

                        {/* Description */}
                        <div className="border-t border-gray-200 pt-4">
                          {ingredient.description ? (
                            <div
                              className="text-gray-600 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: ingredient.description,
                              }}
                            />
                          ) : (
                            <p className="text-gray-600 leading-relaxed">
                              Essential ingredient for this recipe.
                            </p>
                          )}
                        </div>

                        {/* Decorative Corner */}
                        <div
                          className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 opacity-0 blur-2xl transition-opacity duration-500 ${isActive || isHovered ? "opacity-20" : ""
                            }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div
                    className={`w-full md:w-[calc(50%-4rem)] transition-all duration-700 ${isActive ? "scale-100 opacity-100" : "scale-90 opacity-30"
                      }`}
                  >
                    <div className="relative group cursor-pointer">
                      {/* Image Container */}
                      <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl border border-gray-200">
                        {ingredient.image && (
                          <img
                            src={getImageUrl(ingredient.image)}
                            alt={ingredient.alt || ingredient.name}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          />
                        )}

                        {/* Gradient Overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-green-500 to-green-600 opacity-10 mix-blend-multiply transition-opacity duration-500 ${isActive ? "opacity-20" : "opacity-5"
                            }`}
                        ></div>

                        {/* Corner Accent */}
                        <div className="absolute top-6 right-6">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-500 ${isActive ? "scale-110" : "scale-100"
                              }`}
                          >
                            <span className="text-xl font-black text-white">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Glow Effect */}
                      <div
                        className={`absolute -inset-4 bg-gradient-to-r from-green-400 to-green-500 rounded-3xl blur-2xl opacity-0 transition-opacity duration-500 -z-10 ${isActive || isHovered ? "opacity-20" : ""
                          }`}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center gap-3 mt-32">
          {ingredients.map((ingredient, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                itemRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className={`transition-all duration-300 ${activeIndex === index ? "w-12 h-3" : "w-3 h-3 hover:w-6"
                } rounded-full bg-gradient-to-r from-green-400 to-green-500 ${activeIndex === index
                  ? "opacity-100"
                  : "opacity-30 hover:opacity-60"
                }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap");

        * {
          font-family: "Space Grotesk", sans-serif;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
