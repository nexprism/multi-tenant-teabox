import React from "react";

const HowToUse = ({ data }) => {
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const steps = data?.howToUseSteps || [
    {
      number: "01",
      title: "Get Started",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      number: "02", 
      title: "Configure Settings",
      description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      number: "03",
      title: "Launch & Monitor", 
      description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    },
    {
      number: "04",
      title: "Optimize Results",
      description: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ];

  return (
    <section className=" text-white py-20 px-4 relative overflow-hidden">

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 
            className="text-4xl md:text-5xl text-black bebas mb-4 md:mb-0"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            HOW TO USE
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-2"></div>
          <p 
            className="text-lg md:text-lg text-black max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Follow our comprehensive guide to master the platform in just 4 simple steps
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-20">
          <div className="w-full mx-auto">
            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group">
              <iframe
                src={`${data?.howToUseVideo ? `https://www.youtube.com/embed/${extractVideoId(data.howToUseVideo)}` : "https://www.youtube.com/embed/hWVJucr3Il8"}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                allowFullScreen
                className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                style={{ border: 0 }}
                title="How To Use Tutorial Video"
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-20">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Step Card */}
              <div className=" backdrop-blur-sm border border-gray-700 rounded-3xl p-8 lg:p-10 h-full hover:border-gray-500 transition-all duration-500 hover:transform hover:scale-105">
                {/* Step Number */}
                <div className="flex items-center mb-6">
                  <div 
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br font-poppins from-white to-gray-200 text-black flex items-center justify-center text-2xl lg:text-3xl font-black"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="ml-4 flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                </div>

                {/* Step Content */}
                <h3 
                  className="text-3xl lg:text-4xl text-black xl:text-5xl font-black mb-2 leading-tight  transition-colors"
                >
                  {step.title}
                </h3>
                
                <div 
                  className="text-md text leading-relaxed mb-8 group-hover:text-gray-200 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: step.description }}
                />

                {/* Step Features */}
                <div className="space-y-4">
                  {[1, 2].map((feature) => (
                    <div key={feature} className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg"></div>
                      <span className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Key feature or benefit #{feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              </div>

              {/* Connection Lines for Desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -bottom-6 left-1/2 w-px h-12 bg-gradient-to-b from-gray-600 to-transparent transform -translate-x-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r bg/80 bg backdrop-blur-sm border border-gray-700 rounded-3xl p-12 lg:p-16">
            <h2 
              className="text-5xl lg:text-6xl xl:text-7xl font-black mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              READY TO BEGIN?
            </h2>
            <p 
              className="text-xl lg:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              You now have everything you need to get started. Launch your journey today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Start Now
              </button>
              <button 
                className="px-10 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:border-gray-400 hover:bg-gray-800/50 transition-all duration-300"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Watch Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToUse;