"use client ";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function TeaPartyBanner({ content }) {
  // console.log("secondaryBanner content:", content);

  // Check if link exists
  const hasLink = content?.cta?.link;

  // Image component to reuse
  const ImageContent = () => (
    <>
      {/* Desktop / large screens image  */}
      <Image
        src={getImageUrl(content?.image) || "/images/teabanner.webp"}
        alt="Tea Party Banner"
        fill
        style={{ objectFit: "cover", color: "transparent" }}
        className="rounded-2xl hidden md:block z-0"
      />

      {/* Mobile image (shown on small screens) */}
      <Image
        src={getImageUrl(content?.mobileImage) || "/images/teabanner.webp"}
        alt="Tea Party Banner Mobile"
        fill
        style={{ objectFit: "cover", color: "transparent" }}
        className="rounded-2xl block md:hidden z-0"
      />
    </>
  );

  return (
    <div className="w-full max-w-full mx-auto  relative py-10 lg:py-20 px-4">
      {/* Main banner container */}
      <div className="relative rounded-2xl bg-gray-300 min-h-[450px] overflow-hidden">
        {hasLink ? (
          <Link href={content.cta.link}>
            <ImageContent />
          </Link>
        ) : (
          <div>
            <ImageContent />
          </div>
        )}

        {/* New Launch Badge */}
        {/* <div
          className="absolute -top-6 -left-10 rotate-[-20deg] bg-[#F1FAEE] rounded-lg px-4 py-2 z-10"
          style={{ boxShadow: "0 4px 6px #F1FAEE" }}
        >
          <span className="text font-medium text-lg md:text-3xl transform !rotate-[60deg]">
            New launch
          </span>
        </div> */}
      </div>
    </div>
  );
}
