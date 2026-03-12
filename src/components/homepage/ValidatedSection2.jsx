"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { fetchCertificates } from "@/app/store/slices/certificateSlice";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function ValidatedSection2({ content }) {
  const scrollContainerRef = useRef(null);
  const dispatch = useDispatch();
  const { certificates = [], loading: certLoading } = useSelector(
    (state) => state.certificate || {}
  );

  useEffect(() => {
    // fetch all certificates for this section (use a large limit)
    dispatch(fetchCertificates({ page: 1, limit: 10000 }));
  }, [dispatch]);
  // show all certificates if available; otherwise fallback to content.images or a few placeholders
  let certificatesForUI = [];
  if (Array.isArray(certificates) && certificates.length > 0) {
    certificatesForUI = certificates;
  } else if (Array.isArray(content?.images) && content.images.length > 0) {
    certificatesForUI = content.images.map((url) => ({ file: url }));
  } else {
    certificatesForUI = Array.from({ length: 5 }).map(() => null);
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full py-10 lg:py-20 px-4">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="flex justify-between flex-col max-w-4xl mx-auto text-center items-start mb-16">
          <div className="flex-1 mx-auto">
            <h1 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent text-center">
              {content?.title}
            </h1>
          </div>

          <div className="flex-1 flex justify-center w-full items-center">
            <div className="max-w-md text-center lg:max-w-[80%] mx-auto">
              <p className="text-gray-600">
                {content?.description}
                <span className="relative">
                  <img
                    src="/images/smile.webp"
                    alt="smiley face"
                    className="w-12 h-12 absolute -right-10 -bottom-10"
                  />
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Green Circles Section with Arrows */}
        <div className="relative">
          {/* Marquee wrapper */}
          <div className="overflow-hidden">
            {/* marquee content: duplicated items for seamless loop */}
            <div
              ref={scrollContainerRef}
              className="marquee__track flex gap-5 items-center"
              style={{ "--marquee-duration": "20s" }}
            >
              {/* First set: certificates from redux (fallback to placeholder) */}
              <div className="marquee__group flex gap-5">
                {certificatesForUI.map((item, index) => (
                  <div
                    key={`a-${index}`}
                    className="w-32 h-32 md:w-40 md:h-40 lg:w-[30vh] lg:h-[30vh] flex-shrink-0 rounded-full border-2 border-[#07490C] bg-white"
                  >
                    <Image
                      src={
                        item && item.file
                          ? getImageUrl(item.file)
                          : content?.images && content.images[index]
                            ? getImageUrl(content.images[index])
                            : "/logo-place-holder.png"
                      }
                      alt={`Certificate ${index + 1}`}
                      width={160}
                      height={160}
                      className="w-full h-full scale-75 object-cover rounded-full"
                    />
                  </div>
                ))}
              </div>

              {/* Duplicate set */}
              <div className="marquee__group flex gap-5">
                {certificatesForUI.map((item, index) => (
                  <div
                    key={`b-${index}`}
                    className="w-32 h-32 md:w-40 md:h-40 lg:w-[30vh] lg:h-[30vh] flex-shrink-0 rounded-full border-2 border-[#07490C] bg-white"
                  >
                    <Image
                      src={
                        item && item.file
                          ? getImageUrl(item.file)
                          : content?.images && content.images[index]
                            ? getImageUrl(content.images[index])
                            : "/logo-place-holder.png"
                      }
                      alt={`Certificate duplicate ${index + 1}`}
                      width={160}
                      height={160}
                      className="w-full h-full scale-75 object-cover rounded-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee__track {
          display: flex;
          align-items: center;
          /* ensure wide content so translation is meaningful */
          width: max-content;
          animation: marquee var(--marquee-duration) linear infinite;
        }

        /* pause on hover */
        .marquee__track:hover {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
