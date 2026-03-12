"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Clock,
} from "lucide-react";
import { getImageUrl } from "@/app/utils/imageHelper";

function ProdDetTwo() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedSection, setExpandedSection] = useState("details");
  const [selectedPack, setSelectedPack] = useState("pack1");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productData = {
    name: "Premium Organic Turmeric Powder",
    images: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1599273830315-6b26c5e2f359?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&h=600&fit=crop",
    ],
    description:
      "Our premium organic turmeric powder is carefully sourced from the finest turmeric roots. Rich in curcumin, this golden spice offers powerful anti-inflammatory properties and adds vibrant color and earthy flavor to your dishes.",
    variants: [
      {
        _id: "pack1",
        title: "100g",
        price: "299",
        salePrice: "399",
        discount: "25",
        color: "green",
      },
      {
        _id: "pack2",
        title: "250g",
        price: "649",
        salePrice: "849",
        discount: "30",
        color: "orange",
      },
      {
        _id: "pack3",
        title: "500g",
        price: "1199",
        salePrice: "1599",
        discount: "35",
        color: "green",
      },
    ],
    ingredients: [
      { _id: "1", description: "100% Pure Organic Turmeric Root Powder" },
      { _id: "2", description: "Rich in Curcumin (Active Compound)" },
      { _id: "3", description: "No Added Preservatives or Artificial Colors" },
      { _id: "4", description: "Sourced from Certified Organic Farms" },
    ],
    benefits: [
      { _id: "1", description: "Powerful Anti-inflammatory Properties" },
      { _id: "2", description: "Rich in Antioxidants" },
      { _id: "3", description: "Supports Immune System Health" },
      { _id: "4", description: "Promotes Digestive Health" },
      { _id: "5", description: "May Help Reduce Joint Pain" },
    ],
    precautions: [
      {
        _id: "1",
        description: "Consult your doctor before use if pregnant or nursing",
      },
      { _id: "2", description: "May interact with blood-thinning medications" },
      { _id: "3", description: "Start with small amounts to test tolerance" },
      {
        _id: "4",
        description: "Store in a cool, dry place away from sunlight",
      },
    ],
  };

  const coupons = [
    { code: "SAVE20", discount: "20% OFF", minOrder: "₹500" },
    { code: "FIRST10", discount: "10% OFF", minOrder: "₹300" },
    { code: "BULK30", discount: "30% OFF", minOrder: "₹1000" },
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
    setSelectedImage(
      (prev) =>
        (prev - 1 + productData.images.length) % productData.images.length
    );
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const selectedVariant = productData.variants.find(
    (v) => v._id === selectedPack
  );

  return (
    <div className=" min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[90%] mx-auto px-4 py-3">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back to Products</span>
          </button>
        </div>
      </div>

      <div className="max-w-[90%] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Image Gallery - Left Side */}

          {/* variant 3 */}

          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl sticky top-20 p-6 shadow-sm">
              {/* Main Image */}
              <div className="relative mb-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                  <img
                    src={getImageUrl(productData.images[selectedImage])}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Wishlist & Share */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all ${isWishlisted
                          ? "bg-red-500 text-white"
                          : "bg-white text-gray-600 hover:text-red-500"
                        }`}
                    >
                      <Heart
                        size={18}
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-4 gap-3">
                {productData.images.map((img, index) => (
                  <button
                    key={index}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                        ? "border-green-500 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info - Right Side */}
          {/* variant2 */}

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 w-full lg:w-1/2">
              {/* Title & Rating */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {productData.name}
              </h1>


              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{selectedVariant?.price}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    ₹{selectedVariant?.salePrice}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedVariant?.discount}% OFF
                  </span>
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              {/* Pack Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Choose Size
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {productData.variants.map((variant) => (
                    <button
                      key={variant._id}
                      className={`relative p-4 border-2 rounded-xl text-center transition-all ${selectedPack === variant._id
                          ? "customBorder bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                      onClick={() => setSelectedPack(variant._id)}
                    >
                      <div className="font-semibold text-gray-900">
                        {variant.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{variant.price}
                      </div>
                      {variant.discount && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          -{variant.discount}%
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Actions */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Quantity:
                  </span>
                  <div className="flex items-center customBorder border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 greenOne text-black py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button className="greenTwo text-white py-4 px-8 rounded-xl font-semibold transition-colors">
                  Buy Now
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck size={18} className="text-[#07490C]" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <RotateCcw size={18} className="text-[#07490C]" />
                  <span>Easy Returns</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield size={18} className="text-[#07490C]" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={18} className="text-[#07490C]" />
                  <span>7-8 Days Delivery</span>
                </div>
              </div>

              {/* Coupons */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available Offers
                </h3>
                <div className="space-y-2">
                  {coupons.map((coupon, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <span className="font-semibold text-green-700">
                          {coupon.code}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {coupon.discount} on orders above {coupon.minOrder}
                        </span>
                      </div>
                      <button className="text-[#07490C] text-sm font-medium hover:text-green-700">
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {[
                    { key: "details", label: "Details" },
                    { key: "ingredients", label: "Ingredients" },
                    { key: "benefits", label: "Benefits" },
                    { key: "precautions", label: "Precautions" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => toggleSection(tab.key)}
                      className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${expandedSection === tab.key
                          ? "border-green-500 text-[#07490C]"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {expandedSection === "details" && (
                  <div className="text-gray-700 leading-relaxed">
                    {productData.description}
                    <div className="mt-4">
                      <p className="text-sm">
                        <strong>Usage:</strong> Add a pinch to warm milk or tea.
                        Can be used in cooking and baking. Mix 1/2 teaspoon with
                        honey for daily consumption or add to your favorite
                        recipes.
                      </p>
                    </div>
                  </div>
                )}

                {expandedSection === "ingredients" && (
                  <div className="space-y-3">
                    {productData.ingredients.map((item) => (
                      <div key={item._id} className="flex items-start gap-3">
                        <div className="w-2 h-2 greenOne rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-gray-700">
                          {(item.name || item.title) && (
                            <div className="font-semibold text-gray-900 mb-1">
                              {item.name || item.title}
                            </div>
                          )}
                          {item.description && (
                            <span>{item.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "benefits" && (
                  <div className="space-y-3">
                    {productData.benefits.map((item) => (
                      <div key={item._id} className="flex items-start gap-3">
                        <div className="w-2 h-2 greenOne rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "precautions" && (
                  <div className="space-y-3">
                    {productData.precautions.map((item) => (
                      <div key={item._id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProdDetTwo;
