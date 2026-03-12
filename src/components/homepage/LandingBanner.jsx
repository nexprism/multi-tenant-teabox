"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "../ui/button";

import { getImageUrl } from "@/app/utils/imageHelper";

function LandingBanner({ content = [] }) {
  // console.log("content is ===> ", content);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Ensure content is an array and has items
  const safeContent = Array.isArray(content) ? content : [];
  const contentLength = safeContent.length || 1; // Prevent division by zero

  useEffect(() => {
    if (!content || !Array.isArray(content) || content?.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % content?.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [content]);

  // detect small screens and update on resize / orientation change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 640px)");
    const handle = (e) => setIsMobile(e.matches);
    // set initial
    setIsMobile(mql.matches);
    // listen for changes
    if (mql.addEventListener) {
      mql.addEventListener("change", handle);
    } else if (mql.addListener) {
      mql.addListener(handle);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handle);
      } else if (mql.removeListener) {
        mql.removeListener(handle);
      }
    };
  }, []);

  const nextSlide = () => {
    if (contentLength <= 1) return;
    if (!content || !Array.isArray(content) || content.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % contentLength);
  };

  const prevSlide = () => {
    if (contentLength <= 1) return;
    if (!content || !Array.isArray(content) || content.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + contentLength) % contentLength);
  };

  // Early return if no content
  if (!safeContent || safeContent.length === 0) {
    return null;
  }

  // Early return if no content
  if (!safeContent || safeContent.length === 0) {
    return null;
  }

  const currentContent = safeContent?.[currentSlide]?.content;
  const hasCtaLink = currentContent?.cta?.link;
  const hasCtaTitle = currentContent?.cta?.title;
  const ctaLinkHref = hasCtaLink?.includes("about")
    ? "/pages/68fb0ce58b4cf00083b826d2"
    : hasCtaLink || "/search";

  const BannerContent = () => (
    <div className=" h-full bg-gradient-to-b from-black/50 via-black/40 to-black/60 flex items-center justify-center">
      <div className="container max-w-7xl mx-auto px-4 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl  max-sm:w-full w-2/3 text-start  md:text-6xl lg:text-7xl mb-6 drop-shadow-2xl"
        >
          {currentContent?.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg  max-sm:w-full w-2/3 text-start  md:text-xl lg:text-2xl mb-10 text-white/90 drop-shadow-lg"
        >
          {currentContent?.description}
        </motion.p>
        {hasCtaTitle && (
          <motion.div
            className="w-2/3 max-sm:w-full text-start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href={ctaLinkHref}>
              <Button className="bg-gradient-to-r from-[#3C950D] to-[#2d7009] hover:from-[#2d7009] hover:to-[#3C950D] px-8 py-6 text-lg shadow-2xl hover:shadow-[#3C950D]/50 hover:scale-105 transition-all">
              {hasCtaTitle}
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative h-[527px] max-h-[527px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${getImageUrl(
                isMobile && currentContent?.mobileImage
                  ? currentContent?.mobileImage
                  : currentContent?.image
              )})`,
              backgroundSize: "cover", // Changed from 'contain' to 'cover' for better full-screen fill
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            {hasCtaLink && !hasCtaTitle ? (
              <Link href={ctaLinkHref} className="block h-full cursor-pointer">
                <BannerContent />
              </Link>
            ) : (
              <BannerContent />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 max-sm:p-2  -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full transition-all hover:scale-110 shadow-xl"
      >
        <ChevronLeft className="w-6 h-6 max-sm:h-4 max-sm:w-4  text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 max-sm:p-2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full transition-all hover:scale-110 shadow-xl"
      >
        <ChevronRight className="w-6 h-6 max-sm:h-4 max-sm:w-4  text-white" />
      </button>

      {/* Dots */}
      {contentLength > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {safeContent.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-10 shadow-lg"
                  : "bg-white/50 w-2 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LandingBanner;
