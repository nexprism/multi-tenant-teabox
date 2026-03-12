"use client";

import React from 'react';

const LoadingSpinner = ({ size = 'large' }) => {
  const sizeClass = size === 'large' ? 'h-32 w-32' : 'h-8 w-8';
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClass} border-b-2 border-gray-900`}></div>
    </div>
  );
};

const LoadingSection = () => {
  return (
    <div className="py-8 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-64 bg-gray-200 rounded mt-8"></div>
      </div>
    </div>
  );
};

export { LoadingSpinner, LoadingSection };
