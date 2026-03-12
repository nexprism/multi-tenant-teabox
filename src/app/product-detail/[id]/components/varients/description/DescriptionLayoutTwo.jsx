export default function DescriptionLayoutTwo({ data }) {
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

  // Static data with real images and video
  const staticData = {
    description: `<p>Discover the revolutionary approach to modern workspace design that combines functionality with aesthetic appeal. Our innovative solutions transform ordinary spaces into extraordinary environments that inspire creativity and productivity.</p>`,
    
    descriptionVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    
    descriptionImages: [
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop&crop=center" },
      { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&crop=center" }
    ]
  };

  const displayData = data || staticData;

  return (
    <div className="py-10 lg:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Description and Video */}
          <div className="space-y-8">
            {/* Description Text */}
            <div className="sticky top-10">
                {/* Header */}
        <div className="mb-5">
          <h1 className="text-4xl md:text-5xl text-black bebas mb-2">
            DESCRIPTION
          </h1>
        </div>
              <div
                className="text-black poppins-medium leading-relaxed text-lg prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: displayData?.description }}
              />
            {/* Video */}
            <div className="rounded-lg overflow-hidden shadow-lg mt-4">
              <div className="aspect-video">
                {displayData?.descriptionVideo && (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(
                      displayData.descriptionVideo
                    )}`}
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 0 }}
                    title="Description Video"
                    onError={(e) => console.error("Iframe error:", e)}
                  />
                )}
              </div>
            </div>

            </div>
          </div>

          {/* Right Column - Images Grid */}
          <div className="space-y-4">
            {/* First Large Image */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="aspect-[4/3] bg-gray-200"
                style={{
                  backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[0]?.url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>

            {/* Two Medium Images Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[1]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
              <div className="rounded-lg overflow-hidden">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[2]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
            </div>

            {/* Three Small Images in a Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg overflow-hidden">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[3]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
              <div className="rounded-lg overflow-hidden">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[4]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
              <div className="rounded-lg overflow-hidden">
                <div
                  className="aspect-square bg-gray-200"
                  style={{
                    backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[5]?.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
            </div>

            {/* One More Large Image */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="aspect-[3/2] bg-gray-200"
                style={{
                  backgroundImage: `url(${displayData?.descriptionImages?.[6]?.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}