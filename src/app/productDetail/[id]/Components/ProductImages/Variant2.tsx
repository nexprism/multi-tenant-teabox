import { selectSelectedProduct, selectCurrentVariantImage } from "@/app/store/slices/productSlice";
import { ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL;

const RenderVariant2 = () => {
  const [selectedImage, setSelectedImage] = useState<number>(-1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const productData = useSelector(selectSelectedProduct);
  const currentVariantImage = useSelector(selectCurrentVariantImage);

  const mainImage = currentVariantImage
    ? getImageUrl(currentVariantImage)
    : (selectedImage > -1 && productData?.images?.[selectedImage])
    ? getImageUrl(productData.images[selectedImage].url)
    : (productData?.images?.[0] ? getImageUrl(productData.images[0].url) : "");


  const nextImage = () => {
    setSelectedImage((prev) =>
      prev === productData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImage((prev) =>
      prev === 0 ? productData.images.length - 1 : prev - 1
    );
  };
  return (
    <div className="lg:col-span-6">
      <div className="bg-white rounded-2xl sticky top-20 p-6 shadow-sm">
        {/* Main Image */}
        <div className="relative mb-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
            {mainImage ? (
              <Image
                src={mainImage}
                alt="Product"
                className="w-full h-full object-cover"
                layout="fill"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg">
                Select a pack to view image
              </div>
            )}

            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            >
              <ChevronRight size={18} />
            </button>

            {/* Wishlist & Share */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all ${isWishlisted
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-600 hover:text-red-500"
                  }`}
              >
                <Heart
                  size={18}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </button>
              <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-4 gap-3">
          {productData.images.map((img, index) => (
            <button
              key={index}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                  ? "border-green-500 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
                }`}
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={getImageUrl(img.url)}
                alt={`View ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RenderVariant2;
