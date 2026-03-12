"use client";

import {
  fetchCategories,
  fetchCategoryWithSubcategories,
} from "../store/slices/categorySlice";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useEffect, useRef, Suspense, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/Loading";

const Filter = ({ onFilterChange = () => {} }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedOther, setSelectedOther] = useState("");
  const [openCategories, setOpenCategories] = useState({}); // Track which categories are open
  const searchParams = useSearchParams();
  const router = useRouter();

  const newParams = new URLSearchParams(searchParams.toString());

  const paramCategories = searchParams.get("category");
  const paramSubcategories = searchParams.get("subcategory");
  const minPrice = searchParams.get("min");
  const maxPrice = searchParams.get("max");
  const paramSearchTerm = searchParams.get("search");

  const [categories, setCategories] = useState([]);

  const dispatch = useDispatch();

  // Toggle category open/close
  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === "") {
      newParams.delete("search");
      setSearchTerm("");
      startTransition(() => {
        router.push(`/search?${newParams.toString()}`);
      });
      onFilterChange({
        searchTerm: "",
        category: selectedCategory,
        priceRange,
        other: selectedOther,
      });
      return;
    }
    newParams.set("search", e.target.value);
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm: e.target.value,
      category: selectedCategory,
      priceRange,
      other: selectedOther,
    });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // clear any previously selected subcategory when category changes
    setSelectedSubcategory("");
    newParams.set("category", category);
    newParams.delete("subcategory");
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm,
      category,
      subcategory: "",
      priceRange,
      other: selectedOther,
    });
  };

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategory(subcategory);
    newParams.set("subcategory", subcategory);
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm,
      category: selectedCategory,
      priceRange,
      other: selectedOther,
    });
  };

  const handlePriceSubmit = () => {
    onFilterChange({
      searchTerm,
      category: selectedCategory,
      priceRange,
      other: selectedOther,
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (value === "") {
      newParams.delete(name);
      startTransition(() => {
        router.push(`/search?${newParams.toString()}`);
      });
      return;
    }
    newParams.set(name, value);
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm,
      category: selectedCategory,
      priceRange: { ...priceRange, [name]: value },
      other: selectedOther,
    });
  };

  const handleOtherChange = (option) => {
    setSelectedOther(option);
    onFilterChange({
      searchTerm,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      priceRange,
      other: option,
    });
  };

  const clearPriceRange = () => {
    setPriceRange({ min: "", max: "" });
    newParams.delete("min");
    newParams.delete("max");
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm,
      category: selectedCategory,
      priceRange: { min: "", max: "" },
      other: selectedOther,
    });
  };

  const clearCategory = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    newParams.delete("category");
    newParams.delete("subcategory");
    startTransition(() => {
      router.push(`/search?${newParams.toString()}`);
    });
    onFilterChange({
      searchTerm,
      category: "",
      subcategory: "",
      priceRange,
      other: selectedOther,
    });
  };

  useEffect(() => {
    // fetch categories without making the effect callback async (avoid returning a Promise)
    const abortController = new AbortController();
    const load = async () => {
      try {
        const res = await fetchCategoryWithSubcategories(abortController.signal);
        console.log("navCategorys  : :  ===> ", res);
        setCategories(res || []);
      } catch (err) {
        // Ignore canceled errors
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && err.message !== 'canceled') {
          console.warn("Error loading categories in Filter:", err);
        }
      }
    };
    load();
    
    return () => {
      abortController.abort(); // Cancel request on unmount
    };
  }, []);

  useEffect(() => {
    if (paramCategories) {
      setSelectedCategory(paramCategories);
      // Auto-open the selected category
      setOpenCategories((prev) => ({
        ...prev,
        [paramCategories]: true,
      }));
    }
    if (paramSubcategories) {
      setSelectedSubcategory(paramSubcategories);
    }
    if (minPrice) {
      setPriceRange((prev) => ({ ...prev, min: minPrice }));
    }
    if (maxPrice) {
      setPriceRange((prev) => ({ ...prev, max: maxPrice }));
    }
    if (paramSearchTerm) {
      setSearchTerm(paramSearchTerm);
    }
  }, [searchParams]);

  return (
    <div className="w-full sticky top-10 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter</h2>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="What are you looking for..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="absolute right-0 top-0 h-full px-3 greenOne text-white rounded-r-md hover:bg-green-700 transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Category */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Category</h3>
          <div
            className="text-sm text-gray-500 cursor-pointer"
            onClick={clearCategory}
          >
            <h2>Clear</h2>
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            if (category.status !== "Active") {
              return null;
            }
            const isOpen = openCategories[category._id];
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;

            return (
              <div key={category._id}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="category"
                      value={category._id}
                      checked={selectedCategory === category._id}
                      onChange={() => handleCategoryChange(category._id)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                  
                  {/* Toggle button for subcategories */}
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 text-gray-600 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
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
                  )}
                </div>

                {/* Subcategories - only shown when category is open */}
                {hasSubcategories && isOpen && (
                  <div className="pl-6 mt-2 space-y-1">
                    {category.subcategories.map((sub) => {
                      if (sub.status !== "Active") {
                        return null;
                      }
                      return (
                        <label
                          key={sub._id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="subcategory"
                            value={sub._id}
                            checked={selectedSubcategory === sub._id}
                            onChange={() => handleSubcategoryChange(sub._id)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">
                            {sub.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-800 ">Price</h3>
          <div
            className="text-sm text-gray-500 cursor-pointer"
            onClick={clearPriceRange}
          >
            <h2>Clear</h2>
          </div>
        </div>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min"
            name="min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange(e)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            placeholder="Max"
            name="max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange(e)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handlePriceSubmit}
            className="w-full greenOne text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const mainFilter = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Filter />
    </Suspense>
  );
};

export default mainFilter;