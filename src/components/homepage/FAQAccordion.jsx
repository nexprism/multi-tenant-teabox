"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import smile from "../../../public/images/smile.png";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { fetchFaqs } from "../../app/store/slices/faqSlice";
import AnimatedGradientBorder from "../ui/AnimatedGradientBorder";

export default function FAQAccordion({ content }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { faqs, loading, error, lastFetched } = useSelector((state) => state.faq);
  const dispatch = useDispatch();

  const hasFetchedRef = useRef(false);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
    
    if (!hasFetchedRef.current && (!faqs || faqs.length === 0 || !isCacheValid)) {
      hasFetchedRef.current = true;
      dispatch(fetchFaqs());
    }
  }, [dispatch, faqs, lastFetched]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Determine how many FAQs to show
  const maxVisible = 5;
  const hasMoreThanFive = faqs.length > maxVisible;
  const visibleFAQs = showAll ? faqs : faqs.slice(0, maxVisible);

  return (
    <div className="w-full py-10 lg:py-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-7">
        {/* Left Section */}
        <div className="flex-1 w-full lg:w-1/2">
          <h1 className="text-4xl md:text-5xl leading-none font-black text-black mb-2">
            {content?.title || "NO CONFUSION. JUST CLARITY."}
            <span className="relative">
              <Image
                src={smile}
                alt="smiley face"
                className="w-12 h-12 absolute -right-10 -bottom-1"
              />
            </span>
          </h1>
          <AnimatedGradientBorder align="left"/>

          {/* Green smiley face */}

          <p className="text-black relative poppins-medium leading-tight text-lg ml-auto mb-8 mt-5">
            {content?.description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
          </p>

          <button className="bg text-white px-6 py-3 rounded-md font-medium hover:bg transition-colors flex items-center gap-2">
            {content?.cta?.title || "Get Started"}
            <span>→</span>
          </button>
        </div>

        {/* Right Section - FAQ Accordion */}
        <div className=" w-full lg:w-1/2 ">
          <div className="space-y-1">
            {loading && <div className="text-gray-500">Loading FAQs...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && faqs.length === 0 && (
              <div className="text-gray-500">No FAQs found.</div>
            )}
            {!loading &&
              !error &&
              visibleFAQs.map((faq, index) => (
                <div
                  key={faq._id || index}
                  className="border-b border-gray-200"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full py-4 px-0 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-black poppins font-medium text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text transition-transform duration-200 flex-shrink-0 ml-4 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Accordion Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === index ? "max-h-96 pb-4" : "max-h-0"
                    }`}
                  >
                    <div className="text-black poppins text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* View More / View Less Button */}
          {hasMoreThanFive && (
            <div className="text-center mt-6">
              <button
                onClick={toggleShowAll}
                className="px-6 py-2 bg-[#3C950D] text-white rounded-lg hover:bg-[#2d7009] transition-colors font-medium"
              >
                {showAll ? "View Less" : `View More (${faqs.length - maxVisible} more)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
