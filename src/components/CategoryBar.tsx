"use client";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "@/app/store/slices/categorySlice";
import Link from "next/link";

export function CategoryBar() {
  const { categories } = useSelector((state: any) => state.category);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories() as any);
    }
  }, [dispatch, categories]);

  return (
    <div className="hidden md:block bg-gradient-to-r from-[#3C950D] via-[#45a610] to-[#3C950D] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
          {categories.map((category: any, index: number) => (
            <Link
              key={category._id || index}
              href={`/search?category=${category._id}`}
              className="px-5 py-2.5 whitespace-nowrap hover:bg-white/20 rounded-full transition-all hover:scale-105 hover:shadow-lg backdrop-blur-sm text-sm"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
