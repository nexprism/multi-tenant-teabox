import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

type Props = {
  descriptionData?: any;
};

function Variant3({ descriptionData: propData }: Props) {
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propData || reduxProductData;

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };
  return (
    <div className="py-10 lg:py-20 px-4">
      <div className="max-w-7xl w-auto mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl text-black mb-8 text-center font-black">
          DESCRIPTION
        </h1>

        {/* Top Section - Video and Description Side by Side */}
        <div className={`${productData?.descriptionVideo ? "grid" : ""} lg:grid-cols-5 gap-8 mb-16`}>
          {/* Video - Takes 3 columns */}
          {productData?.descriptionVideo && (
            <div className="lg:col-span-3">
              <div className="aspect-video sticky top-10 rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(
                    productData.descriptionVideo
                  )}`}
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: 0 }}
                  title="Description Video"
                  onError={(e) => console.error("Iframe error:", e)}
                />
              </div>
            </div>
          )}

          {/* Description - Takes 2 columns */}
          <div className={`${productData?.descriptionVideo ? "lg:col-span-2" : "lg:col-span-5"} flex items-center`}>
            <div
              className="text-black poppins-medium leading-relaxed text-lg"
              dangerouslySetInnerHTML={{
                __html: productData?.description || "",
              }}
            />
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-8">
          {/* Large Featured Image */}
          {productData?.descriptionImages?.[0] && (
            <div className="w-full">
              <div
                className="aspect-[2/1] rounded-lg bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(productData?.descriptionImages?.[0]?.url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          )}

          {/* Four Images Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {productData?.descriptionImages
              ?.slice(1, 5)
              .map((image: any, index: number) => (
                <div key={index}>
                  <div
                    className="aspect-[4/3] rounded-lg bg-gray-200"
                    style={{
                      backgroundImage: `url(${getImageUrl(image.url)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                </div>
              ))}
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-20 text-center">
          <h2 className="bebas text-4xl lg:text-6xl text-black mb-6">
            READY TO GET STARTED?
          </h2>
          <p className="text-gray-700 poppins-medium text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their
            business with our solutions.
          </p>
          <button className="bg-black text-white poppins-medium px-12 py-4 rounded-lg hover:bg-gray-800 transition-colors">
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}

export default Variant3;