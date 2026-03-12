import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import React from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

type DescriptionImage = {
  url?: string;
};

type DescriptionData = {
  description?: string;
  descriptionVideo?: string;
  descriptionImages?: DescriptionImage[];
};

type Props = {
  descriptionData?: DescriptionData;
};

function Variant1({ descriptionData: propData }: Props) {
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
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col space-y-6 flex-1">
          {/* Description Text */}
          <div className="sticky top-10 self-start z-10 w-full">
            <h1 className="text-4xl md:text-5xl text-black bebas mb-4">
              DESCRIPTION
            </h1>
            <div
              className="text-black relative poppins-medium leading-tight text-lg ml-auto mb-8"
              dangerouslySetInnerHTML={{
                __html: productData?.description ?? "",
              }}
            />

            {/* Large Square Image / Video */}
            {productData?.descriptionVideo && (
              <div className=" rounded-lg w-full h-[350px] max-h-[400px] overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(
                    productData?.descriptionVideo ?? ""
                  )}`}
                  allowFullScreen
                  className="w-full h-full object-cover rounded-lg"
                  style={{ border: 0 }}
                  title="Description Video"
                  onError={(e) => console.error("Iframe error:", e)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col flex-1 gap-4 w-full">
          {/* Top Row - Two Small Squares */}
          {productData?.descriptionImages?.[0]?.url && (
            <div
              className=" rounded-lg flex-1 aspect-square min-h-[300px]"
              style={{
                backgroundImage: `url(${getImageUrl(productData?.descriptionImages?.[0]?.url)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          )}
          <div className="flex gap-4">
            <div className="flex flex-col gap-4 flex-1">
              {productData?.descriptionImages
                ?.slice(1)
                ?.map((image: DescriptionImage, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-400 rounded-lg flex-1 aspect-square min-h-[300px]"
                    style={{
                      backgroundImage: `url(${getImageUrl(image.url)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Variant1;
