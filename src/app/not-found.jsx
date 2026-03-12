"use client";

import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Text */}

        <h1 className="text-9xl font-bold text-green-600 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/"
            className="inline-flex items-center gap-2 greenOne text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Home size={20} />
            Go Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white text-green-600 border-2 border-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
