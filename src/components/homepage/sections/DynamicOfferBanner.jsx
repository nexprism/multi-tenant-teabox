"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getImageUrl } from "@/app/utils/imageHelper";

const DynamicOfferBanner = ({ content }) => {
  const { tagline, title, description, countdown, cta, image, mobileImage } =
    content;
  // Only show countdown if countdown object is present
  let effectiveEndDate = null;
  if (countdown) {
    effectiveEndDate =
      countdown.endDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const imageToShow = getImageUrl(isMobile && mobileImage ? mobileImage : image);

  useEffect(() => {
    if (!effectiveEndDate) return;
    const calculateTimeLeft = () => {
      const endTime = new Date(effectiveEndDate).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [effectiveEndDate]);

  return (
    <div className="relative bg-gradient-to-r from-green-600 to-green-800 text-white py-16 overflow-hidden">
      {/* Background Image */}
      {imageToShow && (
        <div className="absolute inset-0 opacity-20">
          <Image src={imageToShow} alt={title} fill className="object-cover" />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 text-center">
        {tagline && (
          <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2">
            {tagline}
          </p>
        )}

        <h2 className="text-3xl md:text-5xl font-black mb-4">{title}</h2>

        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          {description}
        </p>

        {/* Countdown Timer */}
        {effectiveEndDate && (
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-white text-black bg-opacity-20 rounded-lg p-4 min-w-[80px]">
              <div className="text-2xl md:text-3xl font-bold">
                {timeLeft.days}
              </div>
              <div className="text-sm uppercase">Days</div>
            </div>
            <div className="bg-white text-black bg-opacity-20 rounded-lg p-4 min-w-[80px]">
              <div className="text-2xl md:text-3xl font-bold">
                {timeLeft.hours}
              </div>
              <div className="text-sm uppercase">Hours</div>
            </div>
            <div className="bg-white text-black bg-opacity-20 rounded-lg p-4 min-w-[80px]">
              <div className="text-2xl md:text-3xl font-bold">
                {timeLeft.minutes}
              </div>
              <div className="text-sm uppercase">Minutes</div>
            </div>
            <div className="bg-white text-black bg-opacity-20 rounded-lg p-4 min-w-[80px]">
              <div className="text-2xl md:text-3xl font-bold">
                {timeLeft.seconds}
              </div>
              <div className="text-sm uppercase">Seconds</div>
            </div>
          </div>
        )}

        {/* {console.log("check content ====> " , cta)} */}
        {cta && (
          <Link href={cta.link || "/search"}>
            <button className="bg-white text-green-600 px-8 py-3 rounded-full font-bold uppercase hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 mx-auto">
              {cta.title}
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DynamicOfferBanner;
