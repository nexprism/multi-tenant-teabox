"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/app/store/slices/productSlice";
import ProductCard from "@/app/search/ProductCard";
import AnimatedGradientBorder from "@/components/ui/AnimatedGradientBorder";

const ProductGrid = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);

  const [displayLimit, setDisplayLimit] = React.useState(8);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Always fetch to ensure we respect the current limit (e.g. 8 vs 1000)
    // regardless of previously loaded state
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchProducts({ limit: 100 }));
    }
  }, [dispatch, products]);

  const handleLoadMore = () => {
    setDisplayLimit(productList.length);
  };

  const handleViewLess = () => {
    setDisplayLimit(8);
  };

  // Get products array from the response
  const productList = products?.products || products || [];
  const displayedProducts = productList.slice(0, displayLimit);
  const hasMore = displayLimit < productList.length;

  return (
    <div className="w-full py-20">
      {/* Section Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl w-full font-black text-gray-800 leading-tight mb-2 text-center">
          All Products
        </h1>
        <AnimatedGradientBorder />
        <p className="text-gray-600 text-center mt-4 text-lg">
          Explore our complete collection of premium products
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && productList.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:px-4">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                showDes={false}
                buyNow={true}
              />
            ))}
          </div>

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
        </>
      )}

      {/* Empty State */}
      {!loading && productList.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No products available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
