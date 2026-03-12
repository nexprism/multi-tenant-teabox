import { selectSelectedProduct } from "@/app/store/slices/productSlice";
import { useSelector } from "react-redux";

function Variant1() {
  const productData = useSelector(selectSelectedProduct);
  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };
  return (
    <section className="min-h-screen bg-white px-4 ">
      <div className="max-w-full mx-auto">
        {/* Heading with style matching the image */}
        <div className="text-start mb-16">
          <h2 className="text-4xl md:text-5xl text-black mb-4 md:mb-0 text-center font-black">
            HOW TO USE
          </h2>
          <p className="text-black lg:max-w-[80%] mx-auto text-center relative poppins-medium leading-tight text-lg mb-8">
            Unlock the full potential of your product with our easy-to-follow guide.{" "}
            <span className="text font-semibold">Watch the tutorial</span> or
            read the step-by-step instructions below to ensure the best results.
          </p>
        </div>

        {/* Video and Steps Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {productData?.howToUseVideo && (
            <div className="relative h-full">
              <div className="aspect-video sticky top-10 bg-gray-900/5 rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(
                    productData.howToUseVideo
                  )}`}
                  allowFullScreen
                  className="w-full h-full object-cover rounded-lg"
                  style={{ border: 0 }}
                  title="How To Use Video"
                  onError={(e) => console.error("Iframe error:", e)}
                />
              </div>
            </div>
          )}
          <div className="space-y-8">
            {productData?.howToUseSteps?.map((step, index) => (
              <div key={index} className="flex gap-6 group">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bebas bg text-white rounded-full flex items-center justify-center font-black text-lg group-hover:bg-gray-800 transition-colors duration-300">
                    {index + 1 < step.number ? step.number : `0${index + 1}`}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold poppins text-black mb-2 group-hover:text-gray-700 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <div
                    className="text-gray-600 poppins text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step.description }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Variant1;
