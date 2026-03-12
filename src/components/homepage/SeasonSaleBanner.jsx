"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import timeBanner from '../../../public/images/timeBanner.jpg';

const SeasonSaleBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 13,
    minutes: 24,
    seconds: 56
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        let { days, hours, minutes, seconds } = prevTime;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-96 md:h-[500px] overflow-hidden">
    {/* Background Image */}
    <Image
        src={timeBanner}
        alt="Season Sale Banner"
        fill
        className="absolute inset-0 object-cover"
    />
      <div className="absolute inset-0 bg-black/60 bg-opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center ">
        {/* Season Sale Label */}
        <div className="mb-4">
          <span className="text-sm md:text-base font-medium tracking-wider uppercase">
            Season Sale
          </span>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl leading-tight">
          OFFER IN SPECIAL PRODUCTS.
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-lg mb-8 max-w-2xl opacity-90">
          Shop now and save big on your favorite brands and styles.
        </p>
        
        {/* Countdown Timer */}
        <div className="flex space-x-4 md:space-x-8 mb-8 ">
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold">
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm uppercase tracking-wider opacity-75">
              Days
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm uppercase tracking-wider opacity-75">
              Hours
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm uppercase tracking-wider opacity-75">
              Minutes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm uppercase tracking-wider opacity-75">
              Seconds
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <button className="bg-transparent border-2 border-white text-white px-8 py-3 uppercase tracking-wider font-medium hover:bg-white hover:text-black transition-all duration-300">
          Order Now
        </button>
      </div>
    </div>
  );
};

export default SeasonSaleBanner;