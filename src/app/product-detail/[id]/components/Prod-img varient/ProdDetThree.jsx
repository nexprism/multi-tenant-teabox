"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Clock,
  Check,
  Plus,
  Minus,
  Eye,
  Award,
  Leaf,
  Zap,
  Users,
  ThumbsUp,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Gift,
  Sparkles,
} from "lucide-react";
import { getImageUrl } from "@/app/utils/imageHelper";

function ProdDetThree() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVariant, setSelectedVariant] = useState("pack1");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedReviewFilter, setSelectedReviewFilter] = useState("all");

  const productData = {
    name: "Premium Organic Turmeric Powder",
    subtitle: "Golden Wellness Boost - Certified Organic",
    images: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1599273830315-6b26c5e2f359?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=800&fit=crop",
    ],
    rating: 4.7,
    reviewCount: 1247,
    soldCount: "5.2K+ sold",
    badges: ["Organic Certified", "Premium Quality", "Best Seller"],
    shortDescription:
      "Pure, organic turmeric powder packed with curcumin for natural wellness and vibrant cooking.",
    fullDescription:
      "Our premium organic turmeric powder is meticulously sourced from the finest turmeric roots grown in certified organic farms. Rich in curcumin, this golden spice offers powerful anti-inflammatory properties and adds vibrant color and earthy flavor to your dishes. Each batch is carefully processed to retain maximum nutritional value and potency.",
    variants: [
      {
        _id: "pack1",
        title: "100g",
        subtitle: "Perfect for trying",
        price: 299,
        originalPrice: 399,
        discount: 25,
        popular: false,
      },
      {
        _id: "pack2",
        title: "250g",
        subtitle: "Most popular",
        price: 649,
        originalPrice: 849,
        discount: 30,
        popular: true,
      },
      {
        _id: "pack3",
        title: "500g",
        subtitle: "Best value",
        price: 1199,
        originalPrice: 1599,
        discount: 35,
        popular: false,
      },
    ],
    features: [
      {
        icon: Leaf,
        title: "100% Organic",
        description: "Certified organic ingredients",
      },
      {
        icon: Award,
        title: "Premium Quality",
        description: "Highest grade turmeric",
      },
      {
        icon: Zap,
        title: "High Curcumin",
        description: "Rich in active compounds",
      },
      { icon: Shield, title: "Lab Tested", description: "Purity guaranteed" },
    ],
    benefits: [
      "Powerful anti-inflammatory properties",
      "Rich in antioxidants for cellular health",
      "Supports immune system function",
      "Promotes healthy digestion",
      "May help reduce joint discomfort",
      "Natural mood and brain support",
    ],
    offers: [
      {
        code: "WELCOME20",
        discount: "20% OFF",
        minOrder: "₹500",
        type: "first-time",
      },
      { code: "BULK30", discount: "30% OFF", minOrder: "₹1000", type: "bulk" },
      {
        code: "SAVE15",
        discount: "15% OFF",
        minOrder: "No minimum",
        type: "general",
      },
    ],
  };

  const reviews = [
    {
      id: 1,
      name: "Priya S.",
      rating: 5,
      comment: "Excellent quality! The color and aroma are amazing.",
      verified: true,
      helpful: 23,
    },
    {
      id: 2,
      name: "Rajesh K.",
      rating: 5,
      comment: "Using it daily in my golden milk. Great product!",
      verified: true,
      helpful: 18,
    },
    {
      id: 3,
      name: "Meera P.",
      rating: 4,
      comment: "Good quality turmeric, packaging could be better.",
      verified: true,
      helpful: 12,
    },
  ];

  const selectedVariantData = productData.variants.find(
    (v) => v._id === selectedVariant
  );

  const handleQuantityChange = (delta) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} × ${selectedVariantData?.title} to cart!`);
  };

  return (
    <div className="min-h-screen">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-[90%] mx-auto px-6 py-4">
          <button className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="font-medium">Back to Shop</span>
          </button>
        </div>
      </header>

      <div className="pt-20 max-w-[90%] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Enhanced Image Gallery */}
          {/* variant 4 */}

          <div className="space-y-6 h-fit sticky top-20">
            {/* Main Image with Floating Elements */}
            <div className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden cream relative">
                <img
                  src={getImageUrl(productData.images[selectedImage])}
                  alt="Product"
                  className="w-full h-full object-cover"
                />

                {/* Floating Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {productData.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-lg"
                    >
                      {badge}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 ${isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-500"
                      }`}
                  >
                    <Heart
                      size={20}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:text-gray-900 transition-all transform hover:scale-110">
                    <Share2 size={20} />
                  </button>
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:text-gray-900 transition-all transform hover:scale-110">
                    <Eye size={20} />
                  </button>
                </div>

                {/* Quick View Indicator */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {selectedImage + 1} / {productData.images.length}
                </div>
              </div>
            </div>

            {/* Enhanced Thumbnails */}
            <div className="flex gap-4 justify-center">
              {/* {productData.images.map((img, index) => (
                <button
                  key={index}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                    selectedImage === index
                      ? "ring-4 ring-[#EA8932] shadow-lg"
                      : "ring-2 ring-gray-200 hover:ring-gray-300"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-[#EA8932]/20"></div>
                  )}
                </button>
              ))} */}
            </div>
          </div>

          {/* Enhanced Product Info */}

          {/* variant3 */}

          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {productData.name}
                  </h1>
                  <p className="text-md text-gray-600">
                    {productData.subtitle}
                  </p>
                </div>
              </div>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${i < Math.floor(productData.rating)
                          ? "fill-orange-400 text-orange-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {productData.rating}
                  </span>
                  <span className="text-gray-500">
                    ({productData.reviewCount})
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2 text-green-600">
                  <Users size={16} />
                  <span className="font-medium">{productData.soldCount}</span>
                </div>
              </div>
            </div>

            {/* Price Section with Animation */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{selectedVariantData?.price}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ₹{selectedVariantData?.originalPrice}
                </span>
                <div className="bg-gradient-to-r from-[#07490C] to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Save {selectedVariantData?.discount}%
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Free shipping • Easy returns • Best price guaranteed
              </p>
            </div>

            {/* Variant Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Choose Your Pack
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {productData.variants.map((variant) => (
                  <button
                    key={variant._id}
                    className={`relative p-4 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${selectedVariant === variant._id
                      ? "border-orange-400 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setSelectedVariant(variant._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-gray-900">
                            {variant.title}
                          </span>
                          {variant.popular && (
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Most Popular
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {variant.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{variant.price}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ₹{variant.originalPrice}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedVariant === variant._id
                          ? "border-orange-400 bg-orange-400"
                          : "border-gray-300"
                          }`}
                      >
                        {selectedVariant === variant._id && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center bg-gray-100 rounded-xl">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 greenOne text-black py-4 px-8 rounded-2xl font-bold hover:bg-green-400 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
              >
                <ShoppingCart size={22} />
                Add to Cart
              </button>
              <button className="greenTwo text-white py-4 px-8 rounded-2xl font-bold hover:bg-green-900 transition-all transform hover:scale-105 shadow-lg">
                Buy Now
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {productData.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Icon size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {feature.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offers Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Special Offers
                </h3>
              </div>
              <div className="space-y-3">
                {productData.offers.map((offer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Sparkles size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <span className="font-bold text-purple-700">
                          {offer.code}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {offer.discount}
                        </span>
                        {offer.minOrder !== "No minimum" && (
                          <span className="text-xs text-gray-500 block">
                            Min order: {offer.minOrder}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Details Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl p-8">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-8 bg-gray-100 p-2 rounded-2xl">
            {[
              { key: "overview", label: "Overview", icon: Eye },
              { key: "benefits", label: "Benefits", icon: Zap },
              { key: "reviews", label: "Reviews", icon: MessageCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all ${activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Product Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {showFullDescription
                      ? productData.fullDescription
                      : productData.shortDescription}
                  </p>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-3 text-orange-600 font-medium hover:text-orange-700 transition-colors flex items-center gap-1"
                  >
                    {showFullDescription ? "Show Less" : "Read More"}
                    {showFullDescription ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-green-50 rounded-2xl">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Usage Instructions
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Add 1/2 teaspoon to warm milk, tea, or smoothies. Perfect
                      for cooking curries, soups, and golden milk lattes.
                    </p>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-2xl">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Storage
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Store in a cool, dry place away from direct sunlight. Keep
                      container tightly sealed for freshness.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "benefits" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Health Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productData.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-green-50 rounded-xl"
                    >
                      <div className="p-1 greenOne rounded-full mt-1">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Customer Reviews
                  </h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedReviewFilter}
                      onChange={(e) => setSelectedReviewFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Reviews</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 border border-gray-200 rounded-2xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {review.name}
                            </span>
                            {review.verified && (
                              <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                Verified
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${i < review.rating
                                  ? "fill-orange-400 text-orange-400"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                          <ThumbsUp size={14} />
                          Helpful ({review.helpful})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProdDetThree;
