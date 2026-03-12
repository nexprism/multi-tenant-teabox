"use client";

import { getImageUrl } from "@/app/utils/imageHelper";

const DynamicHeroSection = ({ content }) => {
  const { title, description, cta, image } = content;

  return (
    <div className="relative w-full min-h-[500px] overflow-hidden">
      {/* Fixed Left Leaf Image */}
      <div className="absolute -left-30 md:-left-50 top-1/2 transform -translate-y-1/2 z-50">
        <Image
          className='w-[40vh] md:w-[60vh] rotate-[210deg] max-h-[600px]'
          src={leaf}
          alt="Leaf"
          width='auto'
          height='auto'
        />
      </div>

      {/* Fixed Right Leaf Image */}
      <div className="absolute -right-50 top-1/2 transform -translate-y-1/2 z-50">
        <Image
          className='w-[60vh] -rotate-[40deg] max-h-[600px]'
          src={leaf}
          alt="Leaf"
          width='auto'
          height='auto'
        />
      </div>

      {/* Main Content */}
      <div className="relative h-full max-w-7xl mx-auto flex items-center justify-center px-4">
        <div className="flex items-center justify-between w-full flex-col md:flex-row py-12">
          {/* Left Content */}
          <div className="relative md:w-1/2 max-w-xl z-50">
            <h1 className="relative z-50 text-4xl md:text-5xl font-black text-gray-800 leading-tight mb-6">
              {title}
            </h1>
            <p className="text-black relative z-50 text-lg leading-relaxed mb-8">
              {description}
            </p>
            {cta && (
              <Link href={cta.link || '/shop'}>
                <button className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center gap-2">
                  {cta.title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>

          {/* Right Content - Dynamic Image */}
          <div className="md:w-1/2 relative flex items-center justify-center">
            {/* Center Elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-32 bg-yellow-100 rounded-lg flex items-center justify-center z-0">
                <span className="text-yellow-800 font-medium text-center">
                  Dynamic Content Elements
                </span>
              </div>
            </div>

            {/* Main Product Image */}
            {image && (
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-300">
                <div className="w-fit h-full lg:h-[80vh] max-h-[600px] rounded-2xl overflow-hidden">
                  <Image
                    src={getImageUrl(image)}
                    alt={title}
                    width={400}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-green-300 rounded-full opacity-60"></div>
        <div className="absolute bottom-32 right-1/4 w-3 h-3 bg-yellow-300 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-300 rounded-full opacity-80"></div>
      </div>
    </div>
  );
};

export default DynamicHeroSection;
