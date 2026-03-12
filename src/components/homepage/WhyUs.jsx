"use client";
import React from 'react';

export default function WhyUs() {
  return (
    <div className="min-h-screen bg-white py-10 lg:py-20 px-4">
      {/* Top Section - Why Us */}
      <div className="flex items-start flex-col md:flex-row gap-8 mb-16">
        {/* Left gray rectangle */}
        <div className="aspect-5/4 max-w-[400px] w-full lg:w-1/3 bg-gray-400 rounded-lg flex-shrink-0"></div>
        
        {/* Right content */}
        <div className="">
          <h1 className="text-[50px] text-black -mt-[2vh] md:-mt-[4vh] lg:-mt-10 text-center">
            WHY US?
          </h1>
          
          <p className="text-black poppins text-sm leading-relaxed mb-8 max-w-full">
            Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod 
            tempor incididunt ut labore et dolor magna aliqua. Lorem Ipsum dolor sit 
            amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut 
            labore et dolor magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation
          </p>
          
          {/* Two column list */}
          <div className="flex gap-16">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-600 text-sm">Lorem Ipsum dolor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-600 text-sm">Lorem Ipsum dolor</span>
            </div>
          </div>
        </div>
      </div>

    
    </div>
  );
}