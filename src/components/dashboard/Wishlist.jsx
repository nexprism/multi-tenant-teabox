"use client";

import React, { useEffect } from "react";
import { Heart, ShoppingCart, Trash2, Star, Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWishlist,
  removeFromWishlist,
} from "@/app/store/slices/wishlistSlice";
import { addToCart, toggleCart } from "@/app/store/slices/cartSlice";
import Link from "next/link";
import { trackEvent } from "@/app/lib/tracking/trackEvent";

import { getImageUrl } from "@/app/utils/imageHelper";

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const loading = useSelector((state) => state.wishlist.loading);
  const error = useSelector((state) => state.wishlist.error);

  //console?.log("the data ====>", wishlistItems);
  useEffect(() => {
    //console.log("inside if ==?");
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemoveItemFromWishlist = async (itemOrId) => {
    // Accept either the whole wishlist item object or just a productId string
    const productId =
      typeof itemOrId === "string" ? itemOrId : itemOrId?.product?._id;
    const variantId =
      typeof itemOrId === "object" ? itemOrId?.variant?._id : undefined;

    if (!productId) return;

    await dispatch(
      removeFromWishlist({
        productId,
        variantId,
      })
    );
    trackEvent("REMOVE_FROM_WISHLIST", { productId });
    dispatch(fetchWishlist());
  };

  const addToCartHandler = (item) => {
    //console.log("Adding to cart:", item);
    dispatch(
      addToCart({
        product: item.product._id,
        quantity: 1,
        price: item?.variant?.salePrice || item?.price,
        variant: item?.variant?._id,
      })
    );
    dispatch(toggleCart());
  };

  const addAllToCart = () => {
    wishlistItems.forEach((item) => {
      dispatch(
        addToCart({
          product: item.product._id,
          quantity: 1,
          price: item?.variant?.salePrice || item?.price,
          variant: item?.variant?._id,
        })
      );
    });
    dispatch(toggleCart());
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={` ₹{
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const calculateSavings = (originalPrice, currentPrice) => {
    return (((originalPrice - currentPrice) / originalPrice) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600">
          {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""}{" "}
          saved for later
        </p>
      </div>

      {/* Wishlist Items */}
      {loading ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          Loading...
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm text-red-600">
          {error?.message}
        </div>
      ) : wishlistItems.length == 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 mb-4">
            Start adding items you love to your wishlist
          </p>
          <Link href="/search">
            <button className="px-4 py-2 greenOne text-white rounded-md hover:bg-green-700 transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item, index) => {
            const imgSrc =
              (typeof item?.product?.thumbnail === 'string' ? item.product.thumbnail : item?.product?.thumbnail?.url) ||
              (typeof item?.product?.images?.[0] === 'string' ? item.product.images[0] : item?.product?.images?.[0]?.url) ||
              null;

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative">
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={getImageUrl(imgSrc)}
                        alt={item?.product?.thumbnail?.alt || item?.product?.name}
                        className="object-contain h-full w-full p-2"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Product Image</span>
                    )}
                  </div>
                  {/* Discount Badge */}
                  {/* {item.product.originalPrice > item.product.price && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
                    {calculateSavings(
                      item.product.originalPrice,
                      item.product.price
                    )}
                    % OFF
                  </div>
                )} */}
                  {/* Stock Status */}
                  {/* {!item.product.inStock && (
                  <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md">
                    Out of Stock
                  </div>
                )} */}
                  {/* Remove from Wishlist */}
                  <button
                    onClick={() => handleRemoveItemFromWishlist(item)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow group"
                  >
                    <Heart
                      className="text-red-500 fill-current group-hover:scale-110 transition-transform"
                      size={16}
                    />
                  </button>
                </div>
                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    {/* <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {item?.product?.category}
                  </span> */}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item?.product?.name}
                  </h3>
                  {/* Rating */}
                  {item?.product?.rating > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      {renderStars(item?.product?.rating)}
                      <span className="text-xs text-gray-500">
                        {item?.product?.reviewCount} reviews
                      </span>
                    </div>
                  )}
                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-3">
                    {item?.variant?.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{item?.variant?.salePrice}
                        </span>
                        <span className="text-lg line-through font-bold text-gray-900">
                          ₹{item?.variant?.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ₹{item?.variant?.price}
                      </span>
                    )}
                  </div>
                  {/* Added Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    Added on{" "}
                    {item.addedAt
                      ? new Date(item.addedAt).toLocaleDateString()
                      : ""}
                  </p>
                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => addToCartHandler(item)}
                      disabled={!item.product}
                      className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2  ₹{
                      item.product
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    >
                      <ShoppingCart size={16} />
                      <span>{item.product ? "Add to Cart" : "Out of Stock"}</span>
                    </button>
                    <div className="flex space-x-2">
                      <Link
                        href={`/productDetail/${item?.product?.slug}`}
                        className="w-1/2"
                      >
                        <button className="flex-1 px-3 py-2 border w-full border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm">
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </Link>
                      <button
                        onClick={() => handleRemoveItemFromWishlist(item)}
                        className="flex-1 w-1/2 px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Wishlist Actions */}
      {wishlistItems?.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-600">
                Manage your entire wishlist
              </p>
            </div>
            <div className="flex space-x-3">
              {/* <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Share Wishlist
              </button> */}
              <button
                onClick={() => addAllToCart()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Add All to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
