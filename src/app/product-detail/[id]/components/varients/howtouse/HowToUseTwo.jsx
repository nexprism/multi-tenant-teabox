import React, { useState } from "react";

const HowToUseTwo = ({ data }) => {
  const [activeStep, setActiveStep] = useState(0);

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const steps = data?.howToUseSteps || [
    {
      number: "01",
      title: "Get Started",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      number: "02", 
      title: "Configure Settings",
      description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
    },
    {
      number: "03",
      title: "Launch & Monitor", 
      description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
    },
    {
      number: "04",
      title: "Optimize Results",
      description: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
    },
  ];

  return (
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl text-black bebas mb-4 md:mb-0"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              HOW TO USE
            </h2>
            <div className="w-32 h-1 bg-black mx-auto mb-8 rounded-full"></div>
            <p 
              className="text-gray-700 max-w-2xl mx-auto text-lg lg:text-xl leading-relaxed"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}
            >
              Follow these simple steps to get the most out of our platform. 
              <span className="font-bold text-black"> Master the process</span> in just a few easy steps.
            </p>
          </div>

          {/* Single Video Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="mb-6 text-center">
              <h3 
                className="text-2xl lg:text-3xl font-black text-black mb-2"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                COMPLETE TUTORIAL
              </h3>
              <p 
                className="text-gray-600"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Watch the complete guide covering all steps
              </p>
            </div>
            
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl relative group">
              <iframe
                src={`${data?.howToUseVideo ? `https://www.youtube.com/embed/${extractVideoId(data.howToUseVideo)}` : "https://www.youtube.com/embed/hWVJucr3Il8"}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                allowFullScreen
                className="w-full h-full"
                style={{ border: 0 }}
                title="Complete How To Use Tutorial"
                allow="autoplay; encrypted-media"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-3 lg:space-x-6 bg-white rounded-full p-3 shadow-lg">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-14 h-14 lg:w-18 lg:h-18 rounded-full flex items-center justify-center font-black text-base lg:text-lg transition-all duration-500 relative ${
                    activeStep === index
                      ? 'bg-black text-white scale-110 shadow-xl'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  {String(index + 1).padStart(2, '0')}
                  {/* Active indicator */}
                  {activeStep === index && (
                    <div className="absolute -bottom-2 w-2 h-2 bg-black rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-lg mx-auto mb-16">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-700 rounded-full"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`text-xs transition-colors duration-300 ${
                    index <= activeStep ? 'text-black font-semibold' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Step {index + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Active Step Content - Main Content Area */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 lg:p-12">
              {/* Step Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div 
                    className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center font-black text-2xl mr-6"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {String(activeStep + 1).padStart(2, '0')}
                  </div>
                  <div className="text-left">
                    <h3 
                      className="text-4xl lg:text-5xl font-bold text-black mb-2"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {steps[activeStep]?.title}
                    </h3>
                    <div className="w-24 h-1 bg-black rounded-full"></div>
                  </div>
                </div>
                
                <div
                  className="text-gray-600 text-lg lg:text-xl leading-relaxed max-w-4xl mx-auto"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: steps[activeStep]?.description }}
                />
              </div>

              {/* Step Features/Benefits */}
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 
                    className="text-xl font-bold text-black mb-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Key Benefit
                  </h4>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Important advantage of completing this step correctly
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 
                    className="text-xl font-bold text-black mb-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Pro Tip
                  </h4>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Expert advice to maximize your results in this step
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center mt-12 space-x-4">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeStep === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              ← Previous Step
            </button>
            
            <button
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              disabled={activeStep === steps.length - 1}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeStep === steps.length - 1 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Next Step →
            </button>
          </div>
        </div>
      </section>
  );
};

export default HowToUseTwo; 