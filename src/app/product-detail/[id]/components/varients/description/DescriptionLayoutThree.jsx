export default function NewDescriptionLayout({ data }) {
  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  // Inline getImageUrl helper
  const getImageUrl = (url) => {
    if (!url) return "/placeholder.png";
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3000";
    return `${baseUrl}${url.startsWith("/") ? url : "/" + url}`;
  };

  // Only use actual data, no fallback
  const displayData = data;

  // Don't render if no description data
  if (!displayData?.descriptionVideo && (!displayData?.descriptionImages || displayData.descriptionImages.length === 0)) {
    return null;
  }

  return (
    <div className="pt-10 lg:pt-10  ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-black mb-8 text-center font-black">
          DESCRIPTION
        </h1>
        {/* Hero Video Section */}
        {displayData?.descriptionVideo && (
          <div className="mb-16">
            <div className="relative sm:h-auto">
              <div className="bg-white rounded-lg lg:rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500">
                <div className="!h-[182px] sm:!h-auto md:aspect-[21/9]">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(
                      displayData.descriptionVideo
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
        {displayData?.descriptionImages && displayData.descriptionImages.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Large Image - Spans 2 columns */}
          {displayData?.descriptionImages?.[0]?.url && (
            <div className="col-span-2 row-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData.descriptionImages[0].url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Small Images */}
          {displayData?.descriptionImages?.[1]?.url && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div
                className="aspect-square bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(displayData.descriptionImages[1].url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          )}

          {displayData?.descriptionImages?.[2]?.url && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div
                className="aspect-square bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(displayData.descriptionImages[2].url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          )}

          {displayData?.descriptionImages?.[3]?.url && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div
                className="aspect-square bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(displayData.descriptionImages[3].url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          )}

          {displayData?.descriptionImages?.[4]?.url && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div
                className="aspect-square bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(displayData.descriptionImages[4].url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
