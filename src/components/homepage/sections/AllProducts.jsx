"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/app/store/slices/productSlice";
import ProductCard from "@/app/search/ProductCard";
import AnimatedGradientBorder from "@/components/ui/AnimatedGradientBorder";
import { LoadingSpinner } from "@/components/common/Loading";

const AllProducts = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);
  const [displayLimit, setDisplayLimit] = useState(8);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if products are not already loaded
    const productList = products?.products || products || [];
    if (!hasFetchedRef.current && productList.length === 0) {
      hasFetchedRef.current = true;
      dispatch(fetchProducts({}));
    }
  }, [dispatch, products]);

  // Get products array - handle both products.products and products array
  const productList = (products?.products || products || []);

  const handleLoadMore = () => {
    // Show all fetched products
    setDisplayLimit(productList.length);
  };

  const handleViewLess = () => {
    setDisplayLimit(8);
  };

  const displayedProducts = productList.slice(0, displayLimit);
  const hasMore = displayLimit < productList.length;

  if (loading && productList.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!productList || productList.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-20">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-gray-800 leading-tight mb-2">
          All Products
        </h2>
        <AnimatedGradientBorder />
        <p className="text-gray-600 font-medium text-lg mt-2">
          Explore our complete collection
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            showDes={false}
            buyNow={true}
          />
        ))}
      </div>

      {/* View More/Less Button */}
      {productList.length > 8 && (
        <div className="flex justify-center mt-12 gap-4">
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              className="bg-[#3C950D] text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              View More Products
            </button>
          ) : (
            <button
              onClick={handleViewLess}
              className="bg-[#3C950D] text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              View Less Products
            </button>
          )}
        </div>
      )}

      {/* Loading indicator for load more */}
      {loading && productList.length > 0 && (
        <div className="flex justify-center mt-8">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default AllProducts;
