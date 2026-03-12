"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import {
  BookOpen,
  Star,
  Image as ImageIcon,
  FileText,
  ShoppingCart,
  Heart,
  Share2,
  Eye,
  Check,
  Award,
  Clock,
  Users,
  Zap,
  Shield,
  Truck,
  Gift,
} from "lucide-react";
import { getImageUrl } from "@/app/utils/imageHelper";

// Component types
export const COMPONENT_TYPES = {
  IMAGES: "images",
  DETAILS: "details",
  HOW_TO_USE: "howToUse",
  REVIEWS: "reviews",
};

// Component variants configuration
export const COMPONENT_VARIANTS = {
  [COMPONENT_TYPES.IMAGES]: {
    modern: {
      label: "Modern",
      description: "Clean modern design with hover effects",
    },
    gallery: {
      label: "Gallery",
      description: "Grid-based image gallery",
    },
    showcase: {
      label: "Showcase",
      description: "Premium showcase with detailed view",
    },
  },
  [COMPONENT_TYPES.DETAILS]: {
    modern: {
      label: "Modern",
      description: "Professional clean layout",
    },
    card: {
      label: "Card",
      description: "Compact card-style layout",
    },
    premium: {
      label: "Premium",
      description: "Luxury showcase design",
    },
  },
  [COMPONENT_TYPES.HOW_TO_USE]: {
    guided: {
      label: "Guided",
      description: "Interactive step-by-step guide",
    },
    visual: {
      label: "Visual",
      description: "Modern card-based layout",
    },
    minimal: {
      label: "Minimal",
      description: "Clean and simple format",
    },
  },
  [COMPONENT_TYPES.REVIEWS]: {
    cards: {
      label: "Cards",
      description: "Modern card-based layout",
    },
    testimonial: {
      label: "Testimonial",
      description: "Featured testimonial style",
    },
    compact: {
      label: "Compact",
      description: "Minimal and clean format",
    },
  },
};

// Product Images Component with Enhanced Variations
export function ProductImages({
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
  const imageSettings = {
    ...{
      showThumbnails: true,
      imageSize: "medium",
      span: component.span || 1,
      variant: "modern",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "modern",
  };

  // Dummy images if product images are not available
  const dummyImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop",
  ];

  const images =
    product?.images?.length > 0
      ? product.images.map((img: string) => `${img}`)
      : dummyImages;

  // Modern/Elegant Variant - Clean modern design with hover effects
  const renderModernVariant = () => (
    <div className="space-y-4">
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={getImageUrl(images[0])}
          alt="Main product"
          className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
            <Heart size={16} className="text-gray-600" />
          </button>
          <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
            <Share2 size={16} className="text-gray-600" />
          </button>
        </div>
        {!product?.images?.length && (
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
              Demo Product
            </span>
          </div>
        )}
      </div>

      {imageSettings.showThumbnails && images.length > 1 && (
        <div className="flex gap-3 justify-center">
          {images.slice(1, 4).map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100"
            >
              <img
                src={getImageUrl(img)}
                alt={`Product view ${idx + 2}`}
                className="w-16 h-16 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Gallery Variant - Grid-based layout with zoom functionality
  const renderGalleryVariant = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 relative group overflow-hidden rounded-xl">
          <img
            src={getImageUrl(images[0])}
            alt="Main product"
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-white font-semibold text-lg mb-1">
                  {product?.name || "Premium Product"}
                </h4>
                <p className="text-white/80 text-sm">
                  Gallery View • {images.length} Photos
                </p>
              </div>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <Eye size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {images.slice(1, 3).map((img: string, idx: number) => (
          <div key={idx} className="relative group overflow-hidden rounded-xl">
            <img
              src={getImageUrl(img)}
              alt={`Product ${idx + 2}`}
              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="p-2 bg-white/90 rounded-full">
                <Eye size={14} className="text-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Showcase Variant - Premium showcase with detailed view
  const renderShowcaseVariant = () => (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-transparent rounded-tr-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Award size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Featured Product
                </h3>
                <p className="text-sm text-gray-600">Premium Collection</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                ✨ Best Seller
              </span>
            </div>
          </div>

          <div className="relative group">
            <img
              src={getImageUrl(images[0])}
              alt="Showcase product"
              className="w-full h-72 object-cover rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end">
                <div className="text-white">
                  <h4 className="font-bold text-xl mb-1">
                    {product?.name || "Premium Wireless Headphones"}
                  </h4>
                  <p className="text-white/90 text-sm">
                    Professional Grade • Limited Edition
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                    <Heart size={18} className="text-white" />
                  </button>
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <ShoppingCart size={18} className="text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {imageSettings.showThumbnails && images.length > 1 && (
        <div className="flex gap-4 justify-center">
          {images.slice(1, 4).map((img: string, idx: number) => (
            <div key={idx} className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-3 border-transparent group-hover:border-blue-200 transition-colors duration-300">
                <img
                  src={getImageUrl(img)}
                  alt={`Showcase ${idx + 2}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVariant = () => {
    switch (imageSettings.variant) {
      case "gallery":
        return renderGalleryVariant();
      case "showcase":
        return renderShowcaseVariant();
      default:
        return renderModernVariant();
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
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-blue-100 rounded-xl">
              <ImageIcon size={20} className="text-blue-600" />
            </div>
            Product Gallery
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
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

// Product Details Component with Enhanced Variations
export function ProductDetails({
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
  const detailSettings = {
    ...{
      showPrice: true,
      showDescription: true,
      showFeatures: true,
      span: component.span || 1,
      variant: "modern",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "modern",
  };

  // Dummy data for missing product details
  const dummyProduct = {
    name: "Premium Wireless Headphones",
    price: 199.99,
    originalPrice: 299.99,
    description:
      "Experience premium sound quality with our latest wireless headphones featuring active noise cancellation, premium comfort, and extended battery life.",
    features: [
      "Active Noise Cancellation",
      "30-hour Battery Life",
      "Premium Comfort Fit",
      "Hi-Fi Audio Quality",
      "Quick Charge Technology",
    ],
    rating: 4.8,
    reviews: 1247,
    availability: "In Stock",
    brand: "TechPro",
  };

  const productData = {
    name: product?.name || dummyProduct.name,
    price: product?.price || dummyProduct.price,
    originalPrice: product?.originalPrice || dummyProduct.originalPrice,
    description: product?.description || dummyProduct.description,
    features: product?.features || dummyProduct.features,
    rating: product?.rating || dummyProduct.rating,
    reviews: product?.reviews || dummyProduct.reviews,
    availability: product?.availability || dummyProduct.availability,
    brand: product?.brand || dummyProduct.brand,
  };

  // Modern/Professional Variant - Clean and minimalist design
  const renderModernVariant = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {productData.brand}
              </span>
              <div className="flex items-center gap-1">
               
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {productData.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              <Heart size={18} className="text-gray-600" />
            </button>
            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              <Share2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Price Section */}
        {detailSettings.showPrice && (
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ${productData.price}
              </span>
              {productData.originalPrice > productData.price && (
                <span className="text-lg text-gray-500 line-through">
                  ${productData.originalPrice}
                </span>
              )}
              {productData.originalPrice > productData.price && (
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  Save $
                  {(productData.originalPrice - productData.price).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-2 h-2 greenOne rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                {productData.availability}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {detailSettings.showDescription && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Description
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {productData.description}
          </p>
        </div>
      )}

      {/* Features */}
      {detailSettings.showFeatures && productData.features && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productData.features.map((feature: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Check size={14} className="text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-black px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
          <ShoppingCart size={18} />
          Add to Cart
        </button>
        <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-colors">
          Buy Now
        </button>
      </div>
    </div>
  );

  // Card Variant - Compact card-style layout
  const renderCardVariant = () => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="space-y-5">
        {/* Header with Badge */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full">
              ⭐ FEATURED
            </span>
            <div className="flex gap-1">
              <button className="p-1.5 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
                <Heart size={14} className="text-gray-500" />
              </button>
              <button className="p-1.5 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
                <Share2 size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {productData.name}
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${
                    i < Math.floor(productData.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {productData.rating} • {productData.reviews} reviews
            </span>
          </div>
        </div>

        {/* Price */}
        {detailSettings.showPrice && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  ${productData.price}
                </span>
                {productData.originalPrice > productData.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${productData.originalPrice}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {Math.round(
                  ((productData.originalPrice - productData.price) /
                    productData.originalPrice) *
                    100
                )}
                % OFF
              </span>
            </div>
          </div>
        )}

        {/* Quick Features */}
        {detailSettings.showFeatures && productData.features && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Highlights</h4>
            <div className="space-y-2">
              {productData.features
                .slice(0, 3)
                .map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check size={12} className="text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action */}
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
          <ShoppingCart size={16} />
          Quick Add
        </button>
      </div>
    </div>
  );

  // Premium Variant - Luxury showcase design
  const renderPremiumVariant = () => (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-3xl"></div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full blur-2xl"></div>

      <div className="relative z-10 p-8 space-y-6">
        {/* Premium Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-amber-600">
                  PREMIUM
                </span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-amber-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {productData.name}
              </h1>
              <p className="text-sm text-gray-600">
                {productData.brand} • Limited Edition
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:bg-white transition-colors">
              <Heart size={18} className="text-gray-600" />
            </button>
            <button className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:bg-white transition-colors">
              <Share2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Premium Price Display */}
        {detailSettings.showPrice && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${productData.price}
                  </span>
                  {productData.originalPrice > productData.price && (
                    <span className="text-lg text-gray-500 line-through">
                      ${productData.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    💰 Best Value
                  </span>
                  <span className="text-sm text-gray-600">
                    ⚡ Limited Time Offer
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <div className="w-2 h-2 greenOne rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">In Stock</span>
                </div>
                <p className="text-xs text-gray-600">Fast & Free Shipping</p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Description */}
        {detailSettings.showDescription && (
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={18} className="text-blue-600" />
              Product Excellence
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {productData.description}
            </p>
          </div>
        )}

        {/* Premium Features Grid */}
        {detailSettings.showFeatures && productData.features && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield size={18} className="text-green-600" />
              Premium Features
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {productData.features.map((feature: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-colors"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Check size={16} className="text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">{feature}</span>
                  <div className="ml-auto">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Actions */}
        <div className="flex gap-4 pt-4">
          <button className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
            <ShoppingCart size={20} />
            Add to Premium Cart
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          </button>
          <button className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-blue-600 text-blue-600 hover:bg-white rounded-2xl font-bold transition-colors">
            Buy Now
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield size={14} className="text-green-600" />
            <span>2-Year Warranty</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck size={14} className="text-blue-600" />
            <span>Free Shipping</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Gift size={14} className="text-purple-600" />
            <span>Gift Wrapping</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVariant = () => {
    switch (detailSettings.variant) {
      case "card":
        return renderCardVariant();
      case "premium":
        return renderPremiumVariant();
      default:
        return renderModernVariant();
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
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-green-100 rounded-xl">
              <FileText size={20} className="text-green-600" />
            </div>
            Product Details
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

// How to Use Component with Enhanced Variations
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
      showIcon: true,
      bgColor: "blue",
      span: component.span || 1,
      variant: "guided",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "guided",
  };

  // Dummy data for missing how-to-use steps
  const dummySteps = [
    {
      title: "Unbox & Setup",
      description:
        "Carefully remove your device from the packaging and locate all included accessories.",
      icon: "📦",
      duration: "2 mins",
    },
    {
      title: "Power On & Pair",
      description:
        "Press and hold the power button until you see the LED indicator, then enable Bluetooth on your device.",
      icon: "🔌",
      duration: "3 mins",
    },
    {
      title: "Connect & Configure",
      description:
        "Select your device from the Bluetooth list and follow the on-screen setup instructions.",
      icon: "📱",
      duration: "2 mins",
    },
    {
      title: "Enjoy Your Experience",
      description:
        "Start using your device with all features enabled and enjoy the premium experience.",
      icon: "🎉",
      duration: "Ongoing",
    },
  ];

  const steps =
    product?.howToUseSteps?.length > 0 ? product.howToUseSteps : dummySteps;

  // Guided/Step-by-Step Variant - Interactive step guide
  const renderGuidedVariant = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold mb-4">
          <BookOpen size={20} />
          Quick Start Guide
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Get Started in Minutes
        </h3>
        <p className="text-gray-600">
          Follow these simple steps to set up and start using your product
        </p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>

        <div className="space-y-8">
          {steps.map((step: any, idx: number) => (
            <div key={idx} className="relative flex items-start gap-6">
              {/* Step Indicator */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  {step.icon || `${idx + 1}`}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full text-xs font-bold text-blue-600 border-2 border-blue-100">
                  {step.duration}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-xl font-bold text-gray-900">
                    Step {idx + 1}: {step.title}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <Clock size={14} />
                    {step.duration}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {step.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {idx + 1}/{steps.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Badge */}
      <div className="text-center pt-6 border-t border-gray-200">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full font-medium">
          <Check size={16} />
          Setup Complete! You&apos;re ready to go.
        </div>
      </div>
    </div>
  );

  // Visual/Card Variant - Modern card-based layout
  const renderVisualVariant = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-2 rounded-xl font-semibold mb-4">
          <Zap size={18} />
          Instructions
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">How to Use</h3>
        <p className="text-gray-600">Simple steps for the best experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step: any, idx: number) => (
          <div key={idx} className="group">
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
              {/* Card Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                {idx + 1}
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{step.icon || "📋"}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Clock size={14} />
                      <span>{step.duration}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                      style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {Math.round(((idx + 1) / steps.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center gap-3 text-center justify-center">
          <div className="p-2 greenOne rounded-xl">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-green-900">Need Help?</h4>
            <p className="text-sm text-green-700">
              Our support team is here 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Minimal/Compact Variant - Clean and simple
  const renderMinimalVariant = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl">
          <BookOpen size={20} className="text-gray-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quick Guide</h3>
          <p className="text-sm text-gray-600">
            Easy setup in {steps.length} steps
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step: any, idx: number) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {/* Simple Number */}
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
              {idx + 1}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {step.duration}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Icon */}
            <div className="text-2xl opacity-60">{step.icon || "📝"}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Shield size={16} />
            <span className="text-sm font-medium">
              Setup guaranteed in under 10 minutes
            </span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Need help? →
          </button>
        </div>
      </div>
    </div>
  );

  const renderVariant = () => {
    switch (howToUseSettings.variant) {
      case "visual":
        return renderVisualVariant();
      case "minimal":
        return renderMinimalVariant();
      default:
        return renderGuidedVariant();
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
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-purple-100 rounded-xl">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            How to Use
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

// Reviews Component with Enhanced Variations
export function Reviews({
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
  const reviewSettings = {
    ...{
      showRating: true,
      maxReviews: 3,
      layout: "card",
      span: component.span || 1,
      variant: "cards",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "cards",
  };

  // Enhanced dummy reviews with more realistic data
  const dummyReviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b62c113e?w=40&h=40&fit=crop&crop=face",
      comment:
        "Absolutely love this product! The quality is outstanding and it exceeded my expectations. Highly recommend to anyone looking for premium features.",
      rating: 5,
      date: "2 days ago",
      verified: true,
      helpful: 12,
    },
    {
      id: 2,
      name: "Mike Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      comment:
        "Great value for money. Setup was easy and the performance is solid. Only minor issue is the delivery took a bit longer than expected.",
      rating: 4,
      date: "1 week ago",
      verified: true,
      helpful: 8,
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      comment:
        "Perfect for my needs! The design is sleek and modern. Customer service was also very helpful when I had questions.",
      rating: 5,
      date: "2 weeks ago",
      verified: true,
      helpful: 15,
    },
    {
      id: 4,
      name: "David Thompson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      comment:
        "Good product overall. Works as advertised and the build quality feels premium. Would purchase again.",
      rating: 4,
      date: "3 weeks ago",
      verified: false,
      helpful: 6,
    },
  ];

  const displayReviews =
    product?.reviews?.length > 0 ? product.reviews : dummyReviews;
  const averageRating =
    displayReviews.reduce(
      (acc: number, review: any) => acc + review.rating,
      0
    ) / displayReviews.length;

  // Cards Variant - Modern card-based layout
  const renderCardsVariant = () => (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Customer Reviews
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${
                      i < Math.floor(averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({displayReviews.length} reviews)
              </span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(averageRating * 20)}%
          </div>
          <div className="text-sm text-gray-600">Satisfaction</div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayReviews
          .slice(0, reviewSettings.maxReviews)
          .map((review: any, idx: number) => (
            <div
              key={review.id || idx}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      review.avatar ||
                      `https://ui-avatars.com/api/?name=${review.name}&background=random`
                    }
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {review.name}
                      </h4>
                      {review.verified && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
                          <Check size={12} />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={`${
                        i < review.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Review Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <Heart size={14} />
                  <span>Helpful ({review.helpful || 0})</span>
                </button>
                <div className="flex gap-2">
                  <button className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* View All Reviews Button */}
      {displayReviews.length > reviewSettings.maxReviews && (
        <div className="text-center">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">
            View All {displayReviews.length} Reviews
          </button>
        </div>
      )}
    </div>
  );

  // Testimonial Variant - Featured testimonial style
  const renderTestimonialVariant = () => (
    <div className="space-y-8">
      {/* Main Featured Review */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl"></div>
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl text-blue-200">&ldquo;</div>
          </div>

          <div className="text-center mb-8">
            <blockquote className="text-xl text-gray-900 font-medium leading-relaxed mb-6 max-w-3xl mx-auto">
              {displayReviews[0]?.comment ||
                "This product has completely transformed my experience. The quality and attention to detail are exceptional."}
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <img
                src={
                  displayReviews[0]?.avatar ||
                  `https://ui-avatars.com/api/?name=${
                    displayReviews[0]?.name || "Customer"
                  }&background=random`
                }
                alt={displayReviews[0]?.name || "Customer"}
                className="w-16 h-16 rounded-full object-cover shadow-lg"
              />
              <div className="text-left">
                <h4 className="font-bold text-gray-900 text-lg">
                  {displayReviews[0]?.name || "Satisfied Customer"}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${
                          i < (displayReviews[0]?.rating || 5)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {displayReviews[0]?.date || "Recently"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 pt-6 border-t border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayReviews.length}+
              </div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-600">Would Recommend</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayReviews.slice(1, 4).map((review: any, idx: number) => (
          <div
            key={review.id || idx}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100"
          >
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${
                    i < review.rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              &ldquo;{review.comment.substring(0, 100)}...&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <img
                src={
                  review.avatar ||
                  `https://ui-avatars.com/api/?name=${review.name}&background=random`
                }
                alt={review.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {review.name}
                </p>
                <p className="text-xs text-gray-600">{review.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Compact Variant - Minimal and clean
  const renderCompactVariant = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Star size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={`${
                      i < Math.floor(averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-600">
                ({displayReviews.length})
              </span>
            </div>
          </div>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All →
        </button>
      </div>

      {/* Compact Review List */}
      <div className="space-y-4">
        {displayReviews
          .slice(0, reviewSettings.maxReviews)
          .map((review: any, idx: number) => (
            <div
              key={review.id || idx}
              className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <img
                src={
                  review.avatar ||
                  `https://ui-avatars.com/api/?name=${review.name}&background=random`
                }
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {review.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={`${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">{review.date}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment.length > 120
                    ? `${review.comment.substring(0, 120)}...`
                    : review.comment}
                </p>
                {review.verified && (
                  <div className="flex items-center gap-1 mt-2">
                    <Check size={12} className="text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      Verified Purchase
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {Math.round(averageRating * 20)}%
          </div>
          <div className="text-xs text-gray-600">Satisfaction</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {displayReviews.filter((r: any) => r.rating >= 4).length}
          </div>
          <div className="text-xs text-gray-600">4+ Stars</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {displayReviews.filter((r: any) => r.verified).length}
          </div>
          <div className="text-xs text-gray-600">Verified</div>
        </div>
      </div>
    </div>
  );

  const renderVariant = () => {
    switch (reviewSettings.variant) {
      case "testimonial":
        return renderTestimonialVariant();
      case "compact":
        return renderCompactVariant();
      default:
        return renderCardsVariant();
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

// Component renderer
export function ComponentRenderer({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  totalColumns = 3,
  isPreviewMode = false,
  COMPONENT_SPANS,
}: {
  component: { id: string; type: string; span: number; variant: string };
  product: object;
  settings: object;
  onUpdateSettings: (componentId: string, newSettings: object) => void;
  onUpdateSpan: (componentId: string, newSpan: number) => void;
  totalColumns?: number;
  isPreviewMode?: boolean;
  COMPONENT_SPANS: { [key: string]: { value: number; label: string } };
}) {
  const isFullWidth = component.span === totalColumns;

  const commonProps = {
    component,
    product,
    settings,
    onUpdateSettings,
    onUpdateSpan,
    isFullWidth,
    isPreviewMode,
    COMPONENT_SPANS,
  };

  switch (component.type) {
    case COMPONENT_TYPES.IMAGES:
      return <ProductImages {...commonProps} />;
    case COMPONENT_TYPES.DETAILS:
      return <ProductDetails {...commonProps} />;
    case COMPONENT_TYPES.HOW_TO_USE:
      return <HowToUse {...commonProps} />;
    case COMPONENT_TYPES.REVIEWS:
      return <Reviews {...commonProps} />;
    default:
      return null;
  }
}
