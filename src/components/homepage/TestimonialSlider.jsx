"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heart from "../../../public/images/heart.png";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews } from "@/app/store/slices/Reviews";
import AnimatedGradientBorder from "../ui/AnimatedGradientBorder";

export default function TestimonialSlider({ content }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const { reviews, loading, error, hasFetched } = useSelector((state) => state.reviews);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!hasFetched && !loading) {
      dispatch(fetchReviews());
    }
  }, [dispatch, hasFetched, loading]);

  const getTotalPages = (count, show) => Math.max(1, count - show + 1);

  const nextSlide = () => {
    const total = getTotalPages(reviews.length, slidesToShow);
    setCurrentSlide((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    const total = getTotalPages(reviews.length, slidesToShow);
    setCurrentSlide((prev) => (prev - 1 + total) % total);
  };

  // adjust slidesToShow based on window width
  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      // breakpoints: mobile=1, md>=768 ->2, lg>=1024 ->3, xl>=1280 ->4
      if (w >= 1280) setSlidesToShow(4);
      else if (w >= 1024) setSlidesToShow(3);
      else if (w >= 768) setSlidesToShow(2);
      else setSlidesToShow(1);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // ensure currentSlide remains within bounds when reviews or slidesToShow change
  useEffect(() => {
    const total = getTotalPages(reviews.length, slidesToShow);
    if (currentSlide > total - 1) setCurrentSlide(Math.max(0, total - 1));
  }, [reviews.length, slidesToShow]);

  const slideWidth = 100 / slidesToShow;
  const totalPages = getTotalPages(reviews.length, slidesToShow);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 bg-white">
      {/* Header Section */}
      <div className="mb-9">
        <h1 className="text-3xl md:text-5xl text-black mb-2 font-black text-center">
          {content?.title || "GENUI NE HEARTS. TRUE STORIES."}
        </h1>
        < AnimatedGradientBorder />
        <div className="text-start lg:max-w-[80%] mx-auto mt-5">
          <p className="text-black relative poppins-medium leading-tight text-lg ml-auto text-center">
            {content?.description ||
              "HEARTFELT TESTIMONIALS FROM OUR CUSTOMERS."}
            <span>
              <Image
                src={heart}
                className="absolute -right-7 -bottom-10 w-8"
                alt="heart-img"
              />
            </span>
          </p>
        </div>
      </div>

      {/* Testimonials Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {/* Slider Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * slideWidth}%)`,
            }}
          >
            {reviews.map((testimonial, index) => (
              <div
                key={index}
                className="px-3"
                style={{ flex: `0 0 ${slideWidth}%` }}
              >
                <div className="bg-white border border-gray-200 max-w-[280px] rounded-2xl p-4 h-fit flex flex-col">
                  {/* Name with green icon */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-md font-bold text-black uppercase tracking-wide">
                      {testimonial?.userId?.name}
                    </h3>
                    <Image className="h-4 w-4" src={heart} alt="heart-icon" />
                  </div>

                  {/* Gray placeholder box */}
                  <div className="w-full h-56 bg-gray-300 rounded-lg">
                    {/* Placeholder for image or additional content */}
                    <Image
                      src={
                        testimonial?.images?.[0] ||
                        testimonial?.productId?.images?.[0]?.url ||
                        "/images/testimonial-placeholder.webp"
                      }
                      alt="Testimonial Placeholder"
                      width={400}
                      height={128}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Quote */}
                  <div className="flex-1 mt-4">
                    <blockquote className="text-gray-700 line-clamp-5 text-lg font-medium leading-tight ">
                      "{testimonial?.comment?.slice(0, 130) || ""}
                      {(testimonial?.comment?.length || 0) > 115 ? "..." : ""}"
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slider Dots Indicator */}
      <div className="flex justify-center mt-8 space-x-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentSlide === index ? "greenOne" : "bg-gray-300"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
