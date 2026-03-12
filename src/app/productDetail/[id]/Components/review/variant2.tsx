import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Filter,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function RenderTestimonialVariant() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [animateStats, setAnimateStats] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(6);
  const productData = useSelector(selectSelectedProduct);
  console.log("product data ===> ", productData);
  // Mock data - replace with your actual data
  const mockData = {
    Average: 4.3,
    totalReviews: 247,
    ratingBreakdown: [
      { rating: 5, count: 124, percentage: 65 },
      { rating: 4, count: 68, percentage: 35 },
      { rating: 3, count: 32, percentage: 16 },
      { rating: 2, count: 15, percentage: 8 },
      { rating: 1, count: 8, percentage: 4 },
    ],
    Reviews: [
      {
        userId: { name: "Sarah Johnson" },
        rating: 5,
        comment:
          "Absolutely amazing product! The quality exceeded my expectations and the delivery was super fast. The packaging was professional and everything arrived in perfect condition.",
        likes: 24,
        dislikes: 2,
        comments: 8,
        date: "2024-01-15",
        verified: true,
        images: ["image1.jpg", "image2.jpg"],
      },
      {
        userId: { name: "Michael Chen" },
        rating: 4,
        comment:
          "Great value for money. The product works exactly as described and the customer service was helpful when I had questions.",
        likes: 18,
        dislikes: 1,
        comments: 5,
        date: "2024-01-12",
        verified: true,
        images: [],
      },
      {
        userId: { name: "Emily Rodriguez" },
        rating: 5,
        comment:
          "This has completely changed my workflow! Highly recommended for anyone looking for a reliable solution. The build quality is exceptional.",
        likes: 31,
        dislikes: 0,
        comments: 12,
        date: "2024-01-10",
        verified: true,
        images: ["image3.jpg"],
      },
      {
        userId: { name: "David Kumar" },
        rating: 3,
        comment:
          "Good product overall, but there's room for improvement in the user interface. Customer support was responsive though.",
        likes: 12,
        dislikes: 5,
        comments: 3,
        date: "2024-01-08",
        verified: false,
        images: [],
      },
      {
        userId: { name: "Lisa Thompson" },
        rating: 5,
        comment:
          "Perfect! Exactly what I was looking for. The attention to detail is impressive and it works flawlessly.",
        likes: 19,
        dislikes: 1,
        comments: 6,
        date: "2024-01-05",
        verified: true,
        images: ["image4.jpg", "image5.jpg"],
      },
      {
        userId: { name: "Alex Morgan" },
        rating: 4,
        comment:
          "Very satisfied with this purchase. It arrived quickly and works as expected. Would definitely buy again.",
        likes: 15,
        dislikes: 2,
        comments: 4,
        date: "2024-01-03",
        verified: true,
        images: [],
      },
    ],
  };

  const StarRating = ({ rating, size = "w-4 h-4" }) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${size} transition-colors duration-200 ${
            i < rating ? "fill-orange-400 text-orange-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const AnimatedCounter = ({ end, duration = 1000, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!animateStats) return;

      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [end, duration, animateStats]);

    return (
      <span>
        {count}
        {suffix}
      </span>
    );
  };

  useEffect(() => {
    setAnimateStats(true);
  }, []);

  const filteredReviews = productData?.reviews?.Reviews.filter((review) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "verified") return review.verified;
    if (selectedFilter === "images") return review.images.length > 0;
    return review.rating === parseInt(selectedFilter);
  });

  return (
    <div className="py-10 lg:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Clean and Bold */}
        <div className="flex justify-between flex-col lg:flex-row gap-12 mb-16">
          <div className="max-w-2xl">
            <h1
              className="text-4xl md:text-5xl text-black bebas mb-4"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              PRODUCT REVIEW
            </h1>
            <p
              className="text-black max-w-sm poppins-medium leading-tight text-lg mb-8"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Discover what our{" "}
              <span className="font-semibold text-green-500">customers</span>{" "}
              are saying about their experience
            </p>

            {/* Quick Stats */}
            <div className="flex !flex-col gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-1">
                  <AnimatedCounter end={productData.reviews.Reviews.length} />
                </div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-1">
                  <AnimatedCounter
                    end={productData.reviews.Average}
                    suffix="/50"
                  />
                </div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </div>

          {/* Rating Overview - Your Original Design Enhanced */}
          <div className="flex items-start justify-between max-w-md w-full gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center bg-white shadow-lg mb-4">
                <span className="text-3xl font-bold text-black">
                  {productData?.reviews?.Average?.toFixed(1) || 0}
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <StarRating
                  rating={Math.floor(mockData.Average)}
                  size="w-3 h-3"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {productData?.reviews?.ratingBreakdown?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-black font-medium">
                      {item.rating}
                    </span>
                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <div
                      className="greenOne h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animateStats ? `${item.percentage}%` : "0%",
                        transitionDelay: `${index * 100}ms`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Controls - Clean Design */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Filter by:
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All Reviews" },
                  { key: "verified", label: "Verified Only" },
                  { key: "images", label: "With Photos" },
                  { key: "5", label: "5 Stars" },
                  { key: "4", label: "4 Stars" },
                  { key: "3", label: "3 Stars" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      selectedFilter === filter.key
                        ? "greenOne text-white border-green-500 shadow-md"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </div>

        {/* Review Cards - Your Original Layout Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {filteredReviews.slice(0, visibleReviews).map((review, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              {/* User Info - Your Original Design */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {review.userId.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-black">
                      {review.userId.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="w-3 h-3" />
                      <span className="text-xs text-gray-500">
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>

                {review.verified && (
                  <div className="w-5 h-5 greenOne rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Review Text */}
              <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-4">
                {review.comment}
              </p>

              {/* Review Images - Your Original Concept */}
              {review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.slice(0, 3).map((_, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="bg-gray-200 rounded h-16 w-16 border border-gray-300"
                    >
                      <Image
                        src={getImageUrl(`${review.images[imgIndex]}`)}
                        alt={`Review Image ${imgIndex + 1}`}
                        className="w-full h-full object-cover rounded"
                        width={64}
                        height={64}
                      />
                    </div>
                  ))}
                  {review.images.length > 3 && (
                    <div className="bg-gray-100 rounded h-16 w-16 border border-gray-300 flex items-center justify-center text-gray-500 text-xs">
                      +{review.images.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons - Your Original Icons */}
              <div className="flex items-center gap-6 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{review.likeCount}</span>
                </button>
                {/* <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <ThumbsDown className="w-3 h-3" />
                  <span>{review.dislikes}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-3 h-3" />
                  <span>{review.comments}</span>
                </button> */}

                {/* <h2>
                  {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                </h2> */}

                {review.likes > 15 && (
                  <span className="ml-auto bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium">
                    Popular
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More - Simple and Clean */}
        {visibleReviews < filteredReviews.length && (
          <div className="text-center">
            <button
              onClick={() => setVisibleReviews((prev) => prev + 6)}
              className="greenOne hover:greenOne text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Show More Reviews ({filteredReviews.length - visibleReviews}{" "}
              remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
