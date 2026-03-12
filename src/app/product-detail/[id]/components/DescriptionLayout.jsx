export default function DescriptionLayout({ data }) {
  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  // Import getImageUrl for image URL wrapping
  const getImageUrl = (url) => {
    if (!url) return "/placeholder.png";
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3000";
    return `${baseUrl}${url.startsWith("/") ? url : "/" + url}`;
  };
  return (
    <div className="py-10 lg:py-20 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex flex-col space-y-6 flex-1">
          {/* Description Text */}
          <div className="sticky top-10">
            <h1 className="text-4xl md:text-5xl text-black bebas mb-4 md:mb-0">
              DESCRIPTION
            </h1>
            <div
              className="text-black relative poppins-medium leading-tight text-lg ml-auto mb-8"
              dangerouslySetInnerHTML={{ __html: data?.description }}
            />

            {/* Large Square Image */}
            <div className=" rounded-lg w-full h-[350px] max-h-[400px] overflow-hidden">
              {console.log("Description Image:", data?.descriptionImages?.[0]?.url)}
              {data?.descriptionImages?.[0]?.url && (
                <div className="rounded-lg w-full h-[350px] max-h-[400px] overflow-hidden">
                  <img
                    src={getImageUrl(data.descriptionImages[0].url)}
                    alt="Description"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col flex-1 gap-4">
          {/* Top Row - Two Small Squares */}
          <div
            className=" rounded-lg flex-1 aspect-square"
            style={{
              backgroundImage: `url(${getImageUrl(data?.descriptionImages?.[0]?.url)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-4 flex-1">
              {data?.descriptionImages?.slice(1)?.map((image, index) => (
                <div
                  key={index}
                  className="bg-gray-400 rounded-lg flex-1 aspect-square"
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
