import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

type Props = {
  descriptionData?: any;
};

function Variant2({ descriptionData: propData }: Props) {
  const reduxProductData = useSelector(selectSelectedProduct);
  const productData = propData || reduxProductData;

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };
  return (
    <div className="pt-10 lg:pt-10  ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-black mb-8 text-center font-black">
          DESCRIPTION
        </h1>
        {/* Hero Video Section */}
        {productData?.descriptionVideo && (
          <div className="mb-16">
            <div className="relative sm:h-auto">
              <div className="bg-white rounded-lg lg:rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500">
                <div className="!h-[182px] sm:!h-auto md:aspect-[21/9]">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(
                      productData.descriptionVideo
                    )}`}
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 0 }}
                    title="Main Video"
                    onError={(e) => console.error("Iframe error:", e)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Masonry Style Image Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Large Image - Spans 2 columns */}
          {productData?.descriptionImages?.[0] && (
            <div className="col-span-2 row-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(productData?.descriptionImages?.[0]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Small Images */}
          {productData?.descriptionImages?.slice(1, 5).map((image: any, index: number) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div
                className="aspect-square bg-gray-200"
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
    </div>
  );
}

export default Variant2;
