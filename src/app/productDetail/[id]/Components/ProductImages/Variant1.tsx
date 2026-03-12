import { selectSelectedProduct, selectCurrentVariantImage } from "@/app/store/slices/productSlice";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

const RenderVariant1 = () => {
  const [selectedImage, setSelectedImage] = useState<number>(-1);
  const productData = useSelector(selectSelectedProduct);
  const currentVariantImage = useSelector(selectCurrentVariantImage);

  // If a variant image is selected via Redux, we want to show it.
  // We can either bypass the selectedImage index or try to find it.
  // Bypassing is safer as it might not be in the main images list.

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
    <div className="flex-1 w-full ">
      <div className="gap-4 h-fit sticky top-16 flex flex-col-reverse sm:flex-row">
        {/* Thumbnail Images */}
        <div className="flex gap-3 flex-row sm:flex-col">
          {productData?.images?.length > 0 &&
            [...productData.images].map((img, index) => (
              <div
                key={index}
                className={`w-20 h-20 border-2 rounded-lg cursor-pointer overflow-hidden transition-all ${selectedImage === index
                    ? "border-green-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={getImageUrl(img.url)}
                  alt={productData.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
        </div>

        {/* Main Product Image */}
        <div className="flex-1 relative">
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden relative group">
            {/* Navigation arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 z-10"
            >
              <ChevronRight size={20} />
            </button>

            {mainImage ? (
              <img
                src={mainImage}
                alt="Product Image"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg">
                Select a pack to view image
              </div>
            )}

            {/* Image indicator dots */}
            {(productData?.images?.length > 1 && (selectedImage > -1 || currentVariantImage)) && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {productData.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${selectedImage === index ? "greenOne" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderVariant1;
