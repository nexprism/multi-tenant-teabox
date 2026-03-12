"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const ImageWithFallback = ({ src, fallbackSrc, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

import { getImageUrl } from "@/app/utils/imageHelper";

const DynamicWhyUs = ({ content }) => {
  const { title, description, points, image, mobileImage } = content;
  // console.log("DynamicWhyUs content:", content);

  const placeholder = "/images/teabanner.webp"; // Using an existing image as fallback
  const desktopSrc = image ? getImageUrl(image) : placeholder;
  const mobileSrc = mobileImage ? getImageUrl(mobileImage) : desktopSrc;

  console.log("sdfdsfsd", image);
  console.log("sdfsdfsd", mobileImage);


  return (
    <div className="min-h-screen bg-white py-10 lg:py-20 px-4">
      {/* Top Section - Why Us */}
      <div className="flex items-start flex-col gap-8 mb-16">
        {/* Left gray rectangle */}

        {/* Right content */}
        <div className="">
          <div className="mt-10 flex flex-col md:flex-row gap-6 lg:gap-20">
            <div className="max-sm:w-full sm:w-full md:w-[45%] h-full md:sticky md:top-28 bg-gray-400 rounded-lg flex-shrink-0 relative md:aspect-square">
              {/* Desktop Image */}
              <div className="hidden md:block w-full h-full relative">
                <ImageWithFallback
                  src={desktopSrc}
                  fallbackSrc={placeholder}
                  alt="Why Us"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              {/* Mobile Image */}
              <div className="md:hidden w-full h-full relative aspect-square">
                <ImageWithFallback
                  src={mobileSrc}
                  fallbackSrc={placeholder}
                  alt="Why Us"
                  fill
                  sizes="100vw"
                  className="object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2  max-sm:w-full">
              <h1 className="text-3xl md:text-5xl leading-none mb-5 text-black font-black">
                {title || "WHY US?"}
              </h1>
              <p className="text-black text-[16px] leading-relaxed mb-8 max-w-full">
                {description || "Loading description..."}
              </p>

              {/* Two column list */}
              {points && points.length > 0 && (
                <div className="flex gap-16 mb-6">
                  {points.map((point, index) => (
                    <div key={index} className="flex items-center gap-2 ">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-600 text-[16px]">{point}</span>
                    </div>
                  ))}
                </div>
              )}

              <Link
                className="w-fit text-[16px] underline font-medium hover:text-greenTwo text-black"
                href={content?.cta?.link || "/pages/68fb0ce58b4cf00083b826d2"}
              >
                {content?.cta?.title || "View More"}{" "}
                <ArrowRight size={16} className="inline-block ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
    </div>
  );
};

export default DynamicWhyUs;
