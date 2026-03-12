import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Quote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useRef } from "react";
import { useSelector } from "react-redux";

export default function RenderListVariant() {
  const [data, setData] = useState({
    Average: 4.3,
    Reviews: [
      {
        userId: { name: "Pablo Kahastoria" },
        rating: 5,
        comment:
          "The goods landed safely, arrived quickly, use instant delivery, the quality of the goods is okay and works well, the packing is safe and the delivery is fast, great, thank you.",
        likes: 10,
        dislikes: 16,
        comments: 14,
        images: ["/api/placeholder/100/100"],
      },
      {
        userId: { name: "Thomas Chan" },
        rating: 5,
        comment:
          "The goods landed safely, arrived quickly, use instant delivery, the quality of the goods is okay and works well, the packing is safe and the delivery is fast, great, thank you.",
        likes: 21,
        dislikes: 23,
        comments: 7,
        images: [],
      },
      {
        userId: { name: "Samuel Drya" },
        rating: 5,
        comment:
          "The laptop package has arrived complete with charger, 2 mics, 1 headset. The laptop is really cool, good performance and sturdy, hope it lasts long. Thank you. Good luck with the sale",
        likes: 8,
        dislikes: 12,
        comments: 0,
        images: ["/api/placeholder/100/100", "/api/placeholder/100/100"],
      },
    ],
    ratingBreakdown: [
      { rating: 5, percentage: 75 },
      { rating: 4, percentage: 15 },
      { rating: 3, percentage: 5 },
      { rating: 2, percentage: 3 },
      { rating: 1, percentage: 2 },
    ],
  });

  const productData = useSelector(selectSelectedProduct);

  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % data.Reviews.length);
  };

  const handlePrev = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + data.Reviews.length) % data.Reviews.length
    );
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Split Screen Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] mb-16">
          <div className="flex flex-col justify-center pr-0 lg:pr-12 mb-8 lg:mb-0">
            <div className="relative">
              <h1
                className="text-7xl md:text-9xl lg:text-[120px] leading-none font-bold mb-6"
                style={{ fontFamily: "Bebas Neue, cursive" }}
              >
                WHAT
                <br />
                PEOPLE
                <br />
                <span className="text-green-600">SAY</span>
              </h1>
              <div className="absolute -top-4 -left-4 w-24 h-24 border-4 border-green-600 rounded-full opacity-20"></div>
            </div>
            <p
              className="text-gray-600 text-lg max-w-md leading-relaxed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Real experiences from real customers. Every review tells a story
              of
              <span className="text-gray-900 font-semibold"> quality </span>
              and satisfaction.
            </p>
          </div>

          <div className="bg-gray-100 rounded-3xl p-8 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 greenOne rounded-full px-6 py-3 mb-4">
                <span className="text-3xl font-bold text-white">
                  {productData?.reviews?.Average?.toFixed(1)}
                </span>
                <div className="text-white text-sm font-medium">OUT OF 5</div>
              </div>
              <p className="text-gray-500">Average Rating</p>
            </div>

            <div className="space-y-4">
              {productData?.reviews?.ratingBreakdown?.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-gray-900 font-medium w-8">
                    {item.rating}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      className="greenOne h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${item.percentage}%`,
                        animationDelay: `${index * 0.1}s`,
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-500 text-sm w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section - Slider for Mobile, Grid for Desktop */}
        <div className="mb-8">
          <h2
            className="text-3xl font-bold mb-12 text-center"
            style={{ fontFamily: "Bebas Neue, cursive" }}
          >
            CUSTOMER REVIEWS
          </h2>

          <div className="relative">
            {/* Mobile Slider */}
            <div
              className="md:hidden overflow-hidden"
              ref={sliderRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {productData?.reviews?.Reviews.map((review, index) => (
                  <div
                    key={index}
                    className="min-w-full bg-white text-gray-900 rounded-2xl p-8 relative shadow-md"
                  >
                    <Quote className="absolute top-6 right-6 w-10 h-10 text-gray-300 rotate-12" />
                    <div className="flex mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < review.rating
                              ? "fill-green-600 text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 text-base leading-relaxed mb-8">
                      "{review?.comment}"
                    </p>
                    {review?.images?.length > 0 && (
                      <div className="flex gap-3 mb-6">
                        {review.images.map((image, idx) => (
                          <div
                            key={idx}
                            className="w-16 h-16 bg-gray-200 rounded-xl"
                          ></div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 greenOne rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {review.userId.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {review.userId.name}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          Verified Purchase
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 hover:text-green-600 cursor-pointer">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {review.likes}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 hover:text-red-600 cursor-pointer">
                          <ThumbsDown className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {review.dislikes}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {review.comments} replies
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Navigation Buttons */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 greenOne text-white p-2 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 greenOne text-white p-2 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              {/* Dots Navigation */}
              <div className="flex justify-center mt-4 space-x-2">
                {data.Reviews.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentSlide ? "greenOne" : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productData.reviews.Reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-white text-gray-900 rounded-2xl p-8 relative group hover:transform hover:scale-105 transition-all duration-300 shadow-md"
                >
                  <Quote className="absolute top-6 right-6 w-10 h-10 text-gray-300 rotate-12" />
                  <div className="flex mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < review.rating
                            ? "fill-green-600 text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed mb-8">
                    "{review?.comment}"
                  </p>
                  {review?.images?.length > 0 && (
                    <div className="flex gap-3 mb-6">
                      {review.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 bg-gray-200 rounded-xl"
                        ></div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 greenOne rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {review.userId.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {review.userId.name}
                      </h4>
                      <p className="text-gray-500 text-sm">Verified Purchase</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600 hover:text-green-600 cursor-pointer">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {review.likeCount}
                        </span>
                      </div>
                      {/* <div className="flex items-center gap-2 text-gray-600 hover:text-red-600 cursor-pointer">
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {review.dislikes}
                        </span>
                      </div> */}
                    </div>
                    {/* <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {review.comments} replies
                      </span>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gray-100 rounded-3xl p-12 mt-16">
          <h3
            className="text-4xl font-bold mb-4 text-green-600"
            style={{ fontFamily: "Bebas Neue, cursive" }}
          >
            SHARE YOUR EXPERIENCE
          </h3>
          <p
            className="text-gray-600 mb-6 max-w-md mx-auto"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Help others discover quality products through your honest feedback
          </p>
          <button className="greenOne text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
}
