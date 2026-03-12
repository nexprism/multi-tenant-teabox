import { selectSelectedProduct, selectCurrentVariantImage } from "@/app/store/slices/productSlice";
import { ChevronLeft, ChevronRight, Eye, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL;
const RenderVariant4 = ({ imageSettings }) => {
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
    <div className="space-y-6">
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt="Main product"
            className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-80 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg">
            Select a pack to view image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Navigation Controls */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronRight size={18} />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 backdrop-blur-sm rounded-full shadow-lg transition-colors ${isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-600 hover:text-red-500"
              }`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
            <Share2 size={16} className="text-gray-600" />
          </button>
        </div>

        {productData?.images?.length && (
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
              Demo Product
            </span>
          </div>
        )}
      </div>

      {imageSettings.showThumbnails && productData.images.length > 1 && (
        <div className="flex gap-3 justify-center">
          {productData.images.slice(0, 4).map((img: string, idx: number) => (
            <div
              key={idx}
              className={`relative group cursor-pointer overflow-hidden rounded-xl transition-all ${selectedImage === idx ? "ring-2 ring-blue-500" : "bg-gray-100"
                }`}
              onClick={() => setSelectedImage(idx)}
            >
              <img
                src={getImageUrl(img.url)}
                alt={`Product view ${idx + 1}`}
                className="w-16 h-16 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenderVariant4;
