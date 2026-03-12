export default function DescriptionLayoutFour({ data }) {
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
    description: `<p>Transform your business with cutting-edge solutions designed for the modern enterprise. Our comprehensive platform delivers unmatched performance, scalability, and reliability.</p>
    
    <p>Built by industry experts, our technology stack empowers organizations to achieve breakthrough results while maintaining the highest standards of security and compliance.</p>`,
    
    descriptionVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    
    descriptionImages: [
      { url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop" },
      { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop" },
      { url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=300&fit=crop" },
      { url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=300&fit=crop" },
      { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop" }
    ]
  };

  const displayData = data || staticData;

  return (
    <div className="py-10 lg:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <h1 className="text-4xl md:text-5xl text-black mb-8 text-center font-black">
          DESCRIPTION
        </h1>

        {/* Top Section - Video and Description Side by Side */}
        <div className="grid lg:grid-cols-5 gap-8 mb-16">
          {/* Video - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
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

          {/* Description - Takes 2 columns */}
          <div className="lg:col-span-2 flex items-center">
            <div
              className="text-black poppins-medium leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: displayData?.description }}
            />
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-8">
          {/* Large Featured Image */}
          <div className="w-full">
            <div
              className="aspect-[2/1] rounded-lg bg-gray-200"
              style={{
                backgroundImage: `url(${getImageUrl(displayData?.descriptionImages?.[0]?.url)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          </div>

          {/* Four Images Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayData?.descriptionImages?.slice(1, 5).map((image, index) => (
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
            Join thousands of satisfied customers who have transformed their business with our solutions.
          </p>
          <button className="bg-black text-white poppins-medium px-12 py-4 rounded-lg hover:bg-gray-800 transition-colors">
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}