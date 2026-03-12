"use client";

import React, { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

import 'swiper/css/pagination';
import AnimatedGradientBorder from "@/components/ui/AnimatedGradientBorder";

const DynamicUniqueSellingPoints = ({ content }) => {
  const { title, description, cta, cards, image } = content;
  // console.log("DynamicUniqueSellingPoints content:", content);

  const swiperRef = useRef(null);

  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      const swiper = swiperRef.current.swiper;
      // Set auto height based on the tallest slide
      swiper.updateAutoHeight(500);
    }
  }, [cards]);

  return (
    <div className="min-h-screen bg-white py-10 lg:py-20 px-4">
      <style>
        {`
          .swiper {
            position: relative;
          }

          .swiper-pagination-bullet {
            background-color: #16a34a ;
          }
          .swiper-pagination-bullet-active {
            background-color: #15803d ;
          }
        `}
      </style>
      {/* Heading at top */}
      <div className="text-center mb-2">
        <h2 className="text-3xl md:text-5xl leading-none text-black font-black">
          {title || "UNIQUE SELLING POINTS"}
        </h2>
      </div>
      <AnimatedGradientBorder />

      {/* Main Section */}
      <div className="flex items-start mx-auto lg:max-w-[80%] flex-col-reverse flex-wrap md:flex-row gap-8 mt-5">
        {/* Left content */}
        <div className="flex-1 w-full">
          <p className="text-black relative poppins-medium leading-tight text-lg mb-8 text-center ">
            {description || "gchj"}
          </p>
        </div>
      </div>

      {/* Right cards - Swiper slider */}
      <div className="flex-1 h-full w-full">
        <Swiper
          ref={swiperRef}
          modules={[Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop={true}
          navigation={false}
          pagination={{
            clickable: true,
          }}
          autoHeight={true}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-4 min-h-[520px]"
        >
          {cards && cards.length > 0 ? (
            cards.map((card, idx) => (
              <SwiperSlide key={idx}>
                <div
                  className={` min-h-[480px] w-full rounded-lg overflow-hidden ${idx % 2 === 0
                    ? "greenOne p-8 flex flex-col text-black"
                    : "bg-green-800 p-8 flex flex-col text-white"
                    }`}
                >
                  <div className="text-xs font-medium mb-2 tracking-wider">
                    {card.tag || "LOREM IPSUM"}
                  </div>
                  <div className="text-2xl font-bold mb-4 leading-tight">
                    {card.title ? card.title.toUpperCase() : "LOREM IPSUM"}
                    {card.subtitle && (
                      <>
                        <br />
                        {card.subtitle.toUpperCase()}
                      </>
                    )}
                  </div>
                  <p className="text-md leading-relaxed">
                    {card.description ||
                      "Lorem Ipsum dolor sit amet consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolor magna aliqua. Ut enim"}
                  </p>
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className="w-full bg-gray-400 rounded-lg overflow-hidden p-8 flex flex-col text-gray-400">
                {/* fallback card */}
                <div className="text-xs font-medium mb-2 tracking-wider">
                  LOREM IPSUM
                </div>
                <div className="text-green-400 text-2xl font-bold mb-4 leading-tight">
                  LOREM IPSUM
                  <br />
                  DOLOR
                </div>
                <p className="text-xs leading-relaxed">
                  Lorem Ipsum dolor sit amet consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolor magna aliqua. Ut
                  enim
                </p>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
      <center className="mt-7">
        {cta ? (
          <Link href={cta.link || "/pages/68fb0ce58b4cf00083b826d2"}>
            <button className="greenOne hover:bg-green-700 text-white px-6 py-3 rounded text-sm font-medium flex items-center gap-2 transition-colors">
              {cta.title}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </Link>
        ) : (
          <button className="greenOne hover:bg-green-700 text-white px-6 py-3 rounded text-sm font-medium flex items-center gap-2 transition-colors">
            Learn More
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </center>
    </div>
  );
};

export default DynamicUniqueSellingPoints;
