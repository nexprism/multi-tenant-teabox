"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const DynamicCategoryPick = ({ content }) => {
  const { title, description, cta } = content;

  return (
    <div className="py-12 text-center">
      <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
        {title}
      </h2>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
        {description}
      </p>
      {cta && (
        <Link href={cta.link || '/shop'}>
          <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 mx-auto">
            {cta.title}
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      )}
    </div>
  );
};

export default DynamicCategoryPick;
