"use client"

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  ShoppingCart,
} from "lucide-react";
import { getImageUrl } from "@/app/utils/imageHelper";

function ProdDet() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedPack, setSelectedPack] = useState("pack1");
  const [quantity, setQuantity] = useState(1);

  // Static product data
  const productData = {
    name: "Premium Organic Turmeric Powder",
    images: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1599273830315-6b26c5e2f359?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=400&fit=crop"
    ],
    description: "Our premium organic turmeric powder is carefully sourced from the finest turmeric roots. Rich in curcumin, this golden spice offers powerful anti-inflammatory properties and adds vibrant color and earthy flavor to your dishes.",
    variants: [
      {
        _id: "pack1",
        title: "100g Pack",
        price: "299",
        salePrice: "399",
        discount: "25% OFF",
        color: "green"
      },
      {
        _id: "pack2",
        title: "250g Pack",
        price: "649",
        salePrice: "849",
        discount: "30% OFF",
        color: "orange"
      },
      {
        _id: "pack3",
        title: "500g Pack",
        price: "1199",
        salePrice: "1599",
        discount: "35% OFF",
        color: "green"
      }
    ],
    ingredients: [
      { _id: "1", description: "100% Pure Organic Turmeric Root Powder" },
      { _id: "2", description: "Rich in Curcumin (Active Compound)" },
      { _id: "3", description: "No Added Preservatives or Artificial Colors" },
      { _id: "4", description: "Sourced from Certified Organic Farms" }
    ],
    benefits: [
      { _id: "1", description: "Powerful Anti-inflammatory Properties" },
      { _id: "2", description: "Rich in Antioxidants" },
      { _id: "3", description: "Supports Immune System Health" },
      { _id: "4", description: "Promotes Digestive Health" },
      { _id: "5", description: "May Help Reduce Joint Pain" }
    ],
    precautions: [
      { _id: "1", description: "Consult your doctor before use if pregnant or nursing" },
      { _id: "2", description: "May interact with blood-thinning medications" },
      { _id: "3", description: "Start with small amounts to test tolerance" },
      { _id: "4", description: "Store in a cool, dry place away from sunlight" }
    ]
  };

  const coupons = [
    { code: "SAVE20", discount: "20% OFF", minOrder: "₹500" },
    { code: "FIRST10", discount: "10% OFF", minOrder: "₹300" },
    { code: "BULK30", discount: "30% OFF", minOrder: "₹1000" }
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleQuantityChange = (change) => {
    setQuantity(Math.max(1, quantity + change));
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productData.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productData.images.length) % productData.images.length);
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} item(s) to cart!`);
  };

  return (
    <div className="w-full md:max-w-[90%] mx-auto p-4 bg-white">
      <div>
        {/* Back Button */}
        <button className="mb-4 px-4 py-2 border border-gray-300 rounded text-sm flex items-center gap-2 hover:bg-gray-50">
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side - Product Details */}
          {/* variant 2 */}
          <div className="lg:max-w-xl w-full md:w-1/2">
            {/* Product Title and Rating */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {productData.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-orange-400 text-orange-400"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                (4.7) - 390 Product Sold
              </span>
            </div>

            {/* Delivery Options */}
            <div className="mb-6">
              <h3 className="font-semibold text-black mb-2">
                Delivery Options
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter pincode"
                  className="flex-1 px-3 py-2 border text-black border-gray-300 rounded text-sm"
                />
                <button className="greenOne text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 transition-colors">
                  Check
                </button>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Product Delivers on your doorstep within 7-8 days
              </div>
            </div>

            {/* Pack Selection */}
            <div className="mb-6 relative">
              <h3 className="font-semibold text-black mb-3">Select Pack</h3>
              <div className="flex gap-3">
                {productData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className={`relative flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPack === variant._id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedPack(variant._id)}
                  >
                    <div
                      className={`absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded ${
                        variant.color === "green"
                          ? "greenOne"
                          : variant.color === "orange"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {variant.discount}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm text-black">
                        {variant.title}
                      </div>
                      <div
                        className={`font-semibold ${
                          selectedPack === variant._id
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        ₹{variant.price}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        ₹{variant.salePrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="font-semibold text-black mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 border border-gray-300 text-black rounded flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-medium text-black px-4">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 border border-gray-300 text-black rounded flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleAddToCart}
                className="px-4 w-full py-3 border border-gray-300 text-black rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-3">
              {/* Product Details */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection("details")}
                  className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${
                    expandedSection === "details"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold text-base ${
                    expandedSection === "details" ? "text-green-700" : "text-green-600"
                  }`}>
                    Product Details
                  </span>
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    expandedSection === "details" ? "bg-green-200 rotate-180" : "bg-gray-100"
                  }`}>
                    <ChevronDown
                      className={`transition-colors duration-200 ${
                        expandedSection === "details" ? "text-green-700" : "text-gray-600"
                      }`}
                      size={18}
                    />
                  </div>
                </button>
                <div
                  className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${
                    expandedSection === "details"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed bg-gray-50">
                    {productData.description}
                  </div>
                </div>
              </div>

              {/* Ingredients Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection("ingredients")}
                  className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${
                    expandedSection === "ingredients"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold text-base ${
                    expandedSection === "ingredients" ? "text-green-700" : "text-green-600"
                  }`}>
                    Ingredients
                  </span>
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    expandedSection === "ingredients" ? "bg-green-200 rotate-180" : "bg-gray-100"
                  }`}>
                    <ChevronDown
                      className={`transition-colors duration-200 ${
                        expandedSection === "ingredients" ? "text-green-700" : "text-gray-600"
                      }`}
                      size={18}
                    />
                  </div>
                </button>
                <div
                  className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${
                    expandedSection === "ingredients"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
                    <ul className="space-y-2">
                      {productData.ingredients.map((item, idx) => (
                        <li key={item._id || idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 greenOne rounded-full mt-2 flex-shrink-0"></div>
                          <div className="leading-relaxed">
                            {(item.name || item.title) && (
                              <div className="font-semibold text-gray-900 mb-1">
                                {item.name || item.title}
                              </div>
                            )}
                            {item.description && (
                              <span>{item.description}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Benefits Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection("benefits")}
                  className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${
                    expandedSection === "benefits"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold text-base ${
                    expandedSection === "benefits" ? "text-green-700" : "text-green-600"
                  }`}>
                    Benefits
                  </span>
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    expandedSection === "benefits" ? "bg-green-200 rotate-180" : "bg-gray-100"
                  }`}>
                    <ChevronDown
                      className={`transition-colors duration-200 ${
                        expandedSection === "benefits" ? "text-green-700" : "text-gray-600"
                      }`}
                      size={18}
                    />
                  </div>
                </button>
                <div
                  className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${
                    expandedSection === "benefits"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
                    <ul className="space-y-2">
                      {productData.benefits.map((item, idx) => (
                        <li key={item._id || idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 greenOne rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Precautions Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection("precautions")}
                  className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${
                    expandedSection === "precautions"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold text-base ${
                    expandedSection === "precautions" ? "text-green-700" : "text-green-600"
                  }`}>
                    Precautions
                  </span>
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    expandedSection === "precautions" ? "bg-green-200 rotate-180" : "bg-gray-100"
                  }`}>
                    <ChevronDown
                      className={`transition-colors duration-200 ${
                        expandedSection === "precautions" ? "text-green-700" : "text-gray-600"
                      }`}
                      size={18}
                    />
                  </div>
                </button>
                <div
                  className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${
                    expandedSection === "precautions"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-5 py-4 text-sm text-gray-700 bg-gray-50">
                    <ul className="space-y-2">
                      {productData.precautions.map((item, idx) => (
                        <li key={item._id || idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* How to use */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection("usage")}
                  className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 ${
                    expandedSection === "usage"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold text-base ${
                    expandedSection === "usage" ? "text-green-700" : "text-green-600"
                  }`}>
                    How to use
                  </span>
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    expandedSection === "usage" ? "bg-green-200 rotate-180" : "bg-gray-100"
                  }`}>
                    <ChevronDown
                      className={`transition-colors duration-200 ${
                        expandedSection === "usage" ? "text-green-700" : "text-gray-600"
                      }`}
                      size={18}
                    />
                  </div>
                </button>
                <div
                  className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${
                    expandedSection === "usage"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed bg-gray-50">
                    Add a pinch to warm milk or tea. Can be used in cooking and
                    baking. Store in a cool, dry place. Mix 1/2 teaspoon with honey
                    for daily consumption or add to your favorite recipes for enhanced
                    flavor and health benefits.
                  </div>
                </div>
              </div>

              {/* Available Coupons */}
              <div className="mt-6">
                <h3 className="font-semibold text-black mb-3">
                  Available Coupons
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {coupons.map((coupon, index) => (
                    <div key={index} className="min-w-[200px] border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-green-50 to-green-100">
                      <div className="font-bold text-green-700 text-sm">{coupon.code}</div>
                      <div className="text-xs text-gray-600">{coupon.discount}</div>
                      <div className="text-xs text-gray-500">Min order: {coupon.minOrder}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

            <div className="flex gap-4 w-full h-fit sticky top-16">
              

              {/* Main Product Image */}
              <div className="flex-1 relative">
                <div className="aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden relative group">
                  {/* Navigation arrows */}
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 z-10"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <img
                    src={getImageUrl(productData.images[selectedImage])}
                    alt="Product Image"
                    className="w-full h-full object-cover"
                  />

                  {/* Image indicator dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {productData.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          selectedImage === index ? "greenOne" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="flex flex-col gap-3">
                {productData.images.map((img, index) => (
                  <div
                    key={index}
                    className={`w-20 h-20 border-2 rounded-lg cursor-pointer overflow-hidden transition-all ${
                      selectedImage === index 
                        ? "border-green-500 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Product view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default ProdDet;