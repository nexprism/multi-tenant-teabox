"use client";

import { fetchProducts } from "@/app/store/slices/productSlice";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function FrequentlyPurchased() {
  const { products } = useSelector((state) => state.product);
  const dispatch = useDispatch();
  const scrollLeft = () => {
    const container = document.getElementById("products-slider");
    container.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = document.getElementById("products-slider");
    container.scrollBy({ left: 300, behavior: "smooth" });
  };

  // const products = [
  //   {
  //     id: 1,
  //     name: "Glamorous Garnets",
  //     rating: 5,
  //     reviews: 238,
  //     price: 563,
  //     outOfStock: false,
  //   },
  //   {
  //     id: 2,
  //     name: "Luxury Limelight",
  //     rating: 4,
  //     reviews: 839,
  //     price: 238,
  //     outOfStock: true,
  //   },
  //   {
  //     id: 3,
  //     name: "Sumptuous Splendor",
  //     rating: 4,
  //     reviews: 435,
  //     price: 183,
  //     outOfStock: false,
  //   },
  //   {
  //     id: 4,
  //     name: "Enchanting Ensembles",
  //     rating: 5,
  //     reviews: 954,
  //     price: 39,
  //     outOfStock: false,
  //   },
  // ];

  const StarRating = ({ rating, reviews }) => (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < rating ? "fill-green-500 text-green-500" : "text-gray-300"
              }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1">{reviews} Reviews</span>
    </div>
  );

  useEffect(() => {
    dispatch(
      fetchProducts({
        frequentlyPurchased: true,
      })
    );
  }, []);
  return (
    <div className="py-10 lg:py-20 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl text-black bebas mb-4 md:mb-0">
          FREQUENTLY PURCHASED
        </h1>
        <p className="text-black max-w-xl relative poppins-medium leading-tight text-lg mb-8">
          Lorem ipsum dolor sit amet,{" "}
          <span className="text font-semibold">consectetur</span> eiusmod tempor
          incididunt ut labore et dolor magna aliquaLorem ipsum dolor sit amet,
          consectetur.
        </p>
      </div>

      {/* Products Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        <div id="products-slider" className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 justify-between pb-4 w-full">
            {products?.products?.length > 0 &&
              products.products.map((product) => {
                const imgSrc =
                  (typeof product?.thumbnail === 'string' ? product.thumbnail : product?.thumbnail?.url) ||
                  (typeof product?.images?.[0] === 'string' ? product.images[0] : product?.images?.[0]?.url) ||
                  null;
                return (
                  <Link key={product._id} href={`/product-detail/${product.slug}`}>
                    <div className="bg-white flex-shrink-0 min-w-64 max-w-[300px] w-1/4">
                      {/* Product Image */}
                      <div className="relative bg-gray-400 rounded-lg aspect-square mb-4">
                        {imgSrc ? (
                          <img
                            src={getImageUrl(imgSrc)}
                            alt={
                              product?.thumbnail?.alt ||
                              product?.images?.[0]?.alt ||
                              "Product"
                            }
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : null}

                        {/* Heart Icon */}
                        <div className="absolute top-3 right-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Heart className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Out of Stock Badge */}
                        {product.outOfStock && (
                          <div className="absolute top-3 left-3">
                            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                              OUT OF STOCK
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div>
                        <h3 className="font-medium poppins text-black mb-2">
                          {product.name}
                        </h3>
                        {product?.reviews > 0 && (
                          <StarRating
                            rating={product.rating}
                            reviews={product.reviews}
                          />
                        )}
                        <div className="text-lg poppins-medium font-bold text-black">
                          $
                          {product.variants?.[0]?.salePrice ||
                            product.variants?.[0]?.price ||
                            200}
                          {product.variants?.[0]?.salePrice && (
                            <span className="line-through ml-2 text-gray-500">
                              ${product.variants?.[0]?.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      {/* Green Circle Button */}
      {/* <div className="fixed bottom-8 right-8">
        <div className="w-12 h-12 greenOne rounded-full flex items-center justify-center shadow-lg cursor-pointer">
          <span className="text-white text-lg">→</span>
        </div>
      </div> */}
    </div>
  );
}
