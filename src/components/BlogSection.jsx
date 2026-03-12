"use client";

import { fetchBlogs } from "@/app/store/slices/blogSclie";
import {
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import AnimatedGradientBorder from "./ui/AnimatedGradientBorder";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function BlogSection({ content }) {
  const { items, loading } = useSelector((state) => state.blogs);
  const dispatch = useDispatch();
  const scrollLeft = () => {
    const container = document.getElementById("products-slider");
    container.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = document.getElementById("products-slider");
    container.scrollBy({ left: 300, behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (typeof window === "undefined") return;
      setShowScrollButton(window.scrollY > 1.5 * window.innerHeight);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const products = [
    {
      id: 1,
      name: "Glamorous Garnets",
      rating: 5,
      reviews: 238,
      price: 563,
      outOfStock: false,
    },
    {
      id: 2,
      name: "Luxury Limelight",
      rating: 4,
      reviews: 839,
      price: 238,
      outOfStock: true,
    },
    {
      id: 3,
      name: "Sumptuous Splendor",
      rating: 4,
      reviews: 435,
      price: 183,
      outOfStock: false,
    },
    {
      id: 4,
      name: "Enchanting Ensembles",
      rating: 5,
      reviews: 954,
      price: 39,
      outOfStock: false,
    },
    {
      id: 5,
      name: "Radiant Rarities",
      rating: 3,
      reviews: 123,
      price: 99,
      outOfStock: true,
    },
    {
      id: 6,
      name: "Elegant Essentials",
      rating: 4,
      reviews: 512,
      price: 299,
      outOfStock: false,
    },
  ];

  const StarRating = ({ rating, reviews }) => (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < rating ? "fill-green-500 text-green-500" : "text-gray-300"
              }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1">{reviews} Reviews</span>
    </div>
  );

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current && (!items || items.length === 0)) {
      hasFetchedRef.current = true;
      dispatch(fetchBlogs());
    }
  }, [dispatch, items]);

  return (
    <div className="p-8 max-sm:px-4 bg-white">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl text-center font-black text-black mb-2">
          {content?.title || "Blogs"}
        </h1>
        <AnimatedGradientBorder />
        <p className="text-black lg:max-w-[80%] mx-auto mt-5 relative poppins-medium leading-tight text-center text-lg mb-8">
          {content?.description ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
        </p>
      </div>

      {/* Products Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="absolute -left-14 max-sm:-left-6 top-[26%] z-10 w-10 h-10 bg-[#00c950] rounded-full shadow-lg flex items-center justify-center hover:bg-[#00c950] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="absolute -right-14 max-sm:-right-6 top-[26%]  z-10 w-10 h-10 bg-[#00c950] rounded-full shadow-lg flex items-center justify-center hover:bg-[#00c950] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        <div id="products-slider" className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 justify-between pb-4 w-full">
            {items.map((product) => (
              <Link
                href={`/blogs/${product._id}`}
                key={product._id}
                className="w-full"
              >
                <div
                  key={product._id}
                  className="bg-gray-50/80 group border hover:bg-gray-100 cursor-pointer rounded-xl flex-shrink-0 min-w-64 max-w-[300px] w-full"
                >
                  {/* Product Image */}
                  <div className="relative bg-gray-400 overflow-hidden rounded-t-xl w-full h-48 mb-1 ">
                    <img
                      src={
                        getImageUrl(product?.thumbnail?.url) ||
                        getImageUrl(product?.images?.[0]?.url) ||
                        getImageUrl(product?.image?.[0]?.url) ||
                        "/Image-not-found.png"
                      }
                      alt={
                        product?.thumbnail?.alt ||
                        product?.images?.[0]?.alt ||
                        product?.image?.[0]?.alt ||
                        "Blog Thumbnail"
                      }
                      className="w-full h-full object-cover rounded-md group-hover:scale-[1.05] transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="px-3 py-2 pt-4 pb-4 group w-full ">
                    <h3 className="font-medium poppins line-clamp-2 min-h-12  text-black mb-1 ">
                      {product.title}
                    </h3>
                    <div className="flex mt-2  items-center gap-4  justify-between">
                      <h2 className="text-black text-sm font-semibold">
                        View More
                      </h2>
                      <div className="h-6 px-3 flex justify-center items-center border-2 group-hover:bg-gray-100  transition-colors duration-300 border-green-500 greenOne rounded-full">
                        <ArrowUpRight className="w-4 h-4 text-white group-hover:text-green-500 transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Green Circle Button (shows after 150vh scroll) */}
      {showScrollButton && (
        <div className="fixed z-[9999] bottom-8 right-8">
          <div
            role="button"
            tabIndex={0}
            onClick={scrollToTop}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToTop();
              }
            }}
            className="w-12 h-12 greenOne rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          >
            <ChevronUp className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
