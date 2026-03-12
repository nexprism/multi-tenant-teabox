"use client";

import React, { useState, useEffect, Suspense } from "react";
import Filter from "./Filter";
import ProductCard from "./ProductCard";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, resetProductState } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import { LoadingSpinner } from "@/components/common/Loading";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    searchTerm: "",
    category: "",
    subcategory: "",
    priceRange: { min: "", max: "" },
  });

  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const { products, loading, pagination } = useSelector((state) => state.product);
  const { categories } = useSelector((state) => state.category);
  const dispatch = useDispatch();

  const paramCategories = searchParams.get("category");
  const paramSubcategories = searchParams.get("subcategory");
  const minPrice = searchParams.get("min");
  const maxPrice = searchParams.get("max");
  const paramSearchTerm = searchParams.get("search");

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories]);

  const selectedCategory = categories.find(c => c._id === paramCategories || c.slug === paramCategories);
  const selectedSubcategory = selectedCategory?.subcategories?.find(s => s._id === paramSubcategories || s.slug === paramSubcategories);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    // Force a reset of products state to ensure we don't show stale/cached data
    dispatch(resetProductState());

    const payload = {
      ignoreCache: true // Bypass Redux slice caching
    };

    // Helper to validate and add params to payload
    const addParam = (key, value) => {
      if (value && value !== "undefined" && value !== "null" && value !== "") {
        payload[key] = value;
      }
    };

    addParam("category", paramCategories);
    addParam("subcategory", paramSubcategories);
    addParam("minPrice", minPrice);
    addParam("maxPrice", maxPrice);
    addParam("searchTerm", paramSearchTerm);

    payload.page = currentPage;
    payload.sortBy = "createdAt";
    payload.sortOrder = "desc";
    payload.limit = 20; // Increased limit to ensure full results

    // Fetch products
    dispatch(fetchProducts(payload));
  }, [
    paramCategories,
    paramSubcategories,
    minPrice,
    maxPrice,
    paramSearchTerm,
    currentPage,
    dispatch,
  ]);

  console.log("Products:", products);
  return (
    <div className="min-h-screen bg-gray-50 p-4 py-16">
      <div className="max-w-[90%] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className="lg:w-1/4">
            <Filter onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="mb-2 sm:mb-0">
                <p className="text-gray-600 text-sm">
                  Results for
                  {selectedCategory && (
                    <span className="text-black font-bold mx-1">
                      {selectedCategory.name}
                      {selectedSubcategory && ` > ${selectedSubcategory.name}`}
                    </span>
                  )}
                  {paramSearchTerm && (
                    <span className="text-black font-bold mx-1">
                      "{paramSearchTerm}"
                    </span>
                  )}
                  <span className="font-semibold ml-2 text-black">
                    {loading ? "Loading..." : `(${pagination?.total || (products || []).length}) products`}
                  </span>
                </p>
              </div>
              {/* 
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-black rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="High Price">High Price</option>
                  <option value="Low Price">Low Price</option>
                  <option value="Rating">Rating</option>
                </select>
              </div> */}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-8">
                  {(products || [])
                    .map((product) => (
                      <ProductCard key={product._id} product={product} showDes={false} buyNow={true} />
                    ))}
                </div>

                {/* No Results */}
                {products?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No products found matching your criteria.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Load More Button */}
            {/* {totalPages > 1 && currentPage < totalPages && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  See more
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )} */}

            {/* Show All Button */}
            {/* {currentPage < totalPages && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Show all {totalItems} results
                </button>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

const Search = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPage />
    </Suspense>
  );
};

export default Search;
