import axiosInstance from "@/axiosConfig/axiosInstance";
import {
  Instagram,
  Facebook,
  Youtube,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Custom SVG Icons
const TikTokIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.849-1.359-2.02-1.359-3.338h-3.064v13.814c0 1.355-1.104 2.459-2.459 2.459s-2.459-1.104-2.459-2.459 1.104-2.459 2.459-2.459c.26 0 .509.041.743.117V8.407c-.234-.023-.472-.035-.715-.035-3.384 0-6.123 2.739-6.123 6.123s2.739 6.123 6.123 6.123 6.123-2.739 6.123-6.123V9.25c1.336.95 2.97 1.513 4.73 1.513v-3.064c-1.14 0-2.184-.459-2.938-1.201-.481-.476-.812-1.089-.942-1.768a3.058 3.058 0 0 1-.094-.765V5.562h-.444z" />
  </svg>
);

const PinterestIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.160 1.219-5.160s-.219-.438-.219-1.085c0-1.016.592-1.776 1.332-1.776.627 0 .929.469.929 1.032 0 .629-.399 1.569-.606 2.441-.172.725.363 1.315 1.077 1.315 1.292 0 2.284-1.364 2.284-3.331 0-1.742-1.252-2.96-3.046-2.96-2.074 0-3.293 1.554-3.293 3.16 0 .626.241 1.296.542 1.66.059.073.068.137.05.211-.055.229-.177.717-.201.817-.031.129-.101.157-.233.094-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.969-.527-2.292-1.156 0 0-.502 1.911-.624 2.378-.226.868-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017.001z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// Feature Icons (simplified line art style)
const ShippingIcon = () => (
  <svg
    className="w-16 h-16 mb-4"
    stroke="currentColor"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15l-2-2m0 0l2-2m-2 2h6"
    />
  </svg>
);

const ResizingIcon = () => (
  <svg
    className="w-16 h-16 mb-4"
    stroke="currentColor"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1"
  >
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

const WarrantyIcon = () => (
  <svg
    className="w-16 h-16 mb-4"
    stroke="currentColor"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const CustomizationIcon = () => (
  <svg
    className="w-16 h-16 mb-4"
    stroke="currentColor"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export default function Footer() {
  const [data, setData] = useState(null);
  const [openAccordions, setOpenAccordions] = useState({
    quickLinks: false,
    aboutUs: false,
    clientCare: false,
  });
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState(null);

  const toggleAccordion = (section) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getData = async () => {
    try {
      const response = await axiosInstance.get("/page?groupByMainTitle=true", {
        timeout: 30000, // Increase timeout to 30 seconds for this request
      });
      const footerData = {};

      response.data.data.map((item) => {
        footerData[item._id] = item.pages;
      });
      //console.log("Response from API: ==>", footerData);
      setData(footerData);
    } catch (error) {
      //console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setNewsletterMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage(null);

    try {
      const response = await axiosInstance.post("/crm/leads", {
        email: newsletterEmail.trim(),
        source: "newsletter",
        status: "new",
        fullName: newsletterEmail.split("@")[0], // Use email prefix as name if no name provided
      });

      if (response.data.success !== false) {
        setNewsletterMessage({ 
          type: "success", 
          text: response.data.message || "Thank you for subscribing! Check your email for confirmation." 
        });
        setNewsletterEmail("");
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setNewsletterMessage(null);
        }, 5000);
      } else {
        throw new Error(response.data.message || "Subscription failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to subscribe. Please try again.";
      
      // Check if email already exists
      if (errorMessage.toLowerCase().includes("already") || 
          errorMessage.toLowerCase().includes("duplicate")) {
        setNewsletterMessage({ 
          type: "error", 
          text: "This email is already subscribed to our newsletter." 
        });
      } else {
        setNewsletterMessage({ 
          type: "error", 
          text: errorMessage 
        });
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setNewsletterMessage(null);
      }, 5000);
    } finally {
      setNewsletterLoading(false);
    }
  };

  //console.log("current path == > " , pathname)

  if (
    pathname.includes("/signup") ||
    pathname.includes("/login") ||
    pathname.includes("/builder") ||
    pathname.includes("/dashboard")
  ) {
    return null; // Don't render Navbar on product detail page
  }

  return (
    <footer className="bg-[#236339] text-white">
      {/* Top Features Section */}
      <div className="border-b border-emerald-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 font-gintoNord lg:grid-cols-5 gap-8">
            <div className="text-center flex flex-col  items-center">
              <ShippingIcon />
              <h3 className="font-bold text-sm mb-1">WORLDWIDE</h3>
              <h3 className="font-bold text-sm">EXPRESS SHIPPING</h3>
            </div>
            <div className="text-center flex flex-col items-center">
              <ResizingIcon />
              <h3 className="font-bold text-sm mb-1">FREE</h3>
              <h3 className="font-bold text-sm">RESIZING</h3>
            </div>
            <div className="text-center flex flex-col items-center">
              <WarrantyIcon />
              <h3 className="font-bold text-sm mb-1">LIFETIME</h3>
              <h3 className="font-bold text-sm">WARRANTY</h3>
            </div>
            <div className="text-center flex flex-col items-center">
              <CustomizationIcon />
              <h3 className="font-bold text-sm mb-1">FREE RING</h3>
              <h3 className="font-bold text-sm">CUSTOMISATION</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div>
              {/* Desktop/Large tablet view */}
              <div className="hidden lg:block">
                <h3 className="font-bold text-sm mb-3">QUICK LINKS</h3>
                <ul className="space-y-1 flex flex-col">
                  {/* {data?.["quick-links"]?.map?.((link, index) => (
                    <Link
                      href={`/pages/${link?._id ?? ""}`}
                      key={index}
                      className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord block"
                    >
                      {link?.title ?? ""}
                    </Link>
                  ))} */}
                  <Link
                    href={`/pages/68cbb81892f12535adaa3894`}
                    className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord block"
                  >
                    About
                  </Link>
                  <Link
                    href={`/blogs`}
                    className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord block"
                  >
                    Blogs
                  </Link>
                </ul>
              </div>

              {/* Mobile/Tablet accordion view */}
              <div className="lg:hidden">
                <button
                  onClick={() => toggleAccordion("quickLinks")}
                  className="w-full flex justify-between items-center py-3 border-b border-emerald-800"
                >
                  <h3 className="font-bold text-sm">QUICK LINKS</h3>
                  {openAccordions.quickLinks ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {openAccordions.quickLinks && (
                  <ul className="space-y-1 flex flex-col">
                    {data?.["quick-links"]?.map?.((link, index) => (
                      <Link
                        href={`/pages/${link?._id ?? ""}`}
                        key={index}
                        className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord block"
                      >
                        {link?.title ?? ""}
                      </Link>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* About Us */}
            <div>
              {/* Desktop/Large tablet view */}
              <div className="hidden lg:block">
                <h3 className="font-bold text-sm mb-3">ABOUT US</h3>
                <ul className="space-y-1 flex flex-col">
                  {data?.["about-us"]?.map?.((link, index) => (
                    <Link
                      href={`/pages/${link?._id ?? ""}`}
                      key={index}
                      className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                    >
                      {link?.title ?? ""}
                    </Link>
                  ))}
                </ul>
              </div>

              {/* Mobile/Tablet accordion view */}
              <div className="lg:hidden">
                <button
                  onClick={() => toggleAccordion("aboutUs")}
                  className="w-full flex justify-between items-center py-3 border-b border-emerald-800"
                >
                  <h3 className="font-bold text-sm">ABOUT US</h3>
                  {openAccordions.aboutUs ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {openAccordions.aboutUs && (
                  <ul className="space-y-1 flex flex-col">
                    {data?.["about-us"]?.map?.((link, index) => (
                      <Link
                        href={`/pages/${link?._id ?? ""}`}
                        key={index}
                        className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                      >
                        {link?.title ?? ""}
                      </Link>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Client Care */}
            <div>
              {/* Desktop/Large tablet view */}
              <div className="hidden lg:block">
                <h3 className="font-bold text-sm mb-3">CLIENT CARE</h3>
                <ul className="space-y-1 flex flex-col">
                  {data?.["Client Care"]?.map?.((link, index) => (
                    <Link
                      href={`/pages/${link?._id ?? ""}`}
                      key={index}
                      className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                    >
                      {link?.title ?? ""}
                    </Link>
                  ))}
                </ul>
              </div>

              {/* Mobile/Tablet accordion view */}
              <div className="lg:hidden">
                <button
                  onClick={() => toggleAccordion("clientCare")}
                  className="w-full flex justify-between items-center py-3 border-b border-emerald-800"
                >
                  <h3 className="font-bold text-sm">CLIENT CARE</h3>
                  {openAccordions.clientCare ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {openAccordions.clientCare && (
                  <ul className="space-y-1 pt-4">
                    {data?.["Client Care"]?.map?.((link, index) => (
                      <Link
                        href={`/pages/${link?._id ?? ""}`}
                        key={index}
                        className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                      >
                        {link?.title ?? ""}
                      </Link>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Contact Us - Always visible, no accordion */}
            <div>
              <h3 className="font-bold text-sm mb-3">CONTACT US</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-sm">
                    {data?.["contact-us"]?.[0]?.contactData?.phone ?? ""}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">
                    ✉ {data?.["contact-us"]?.[0]?.contactData?.email ?? ""}
                  </span>
                </div>
                <div className="text-sm">
                  <span>📅 Appointment Only</span>
                </div>
                <div className="text-sm">
                  <div className="font-bold mb-1">CONTACT HOURS</div>
                  <div>
                    MON-WED:{" "}
                    {data?.["contact-us"]?.[0]?.contactData?.contactHours
                      ?.monWed ?? ""}
                  </div>
                  <div>
                    THU-FRI:{" "}
                    {data?.["contact-us"]?.[0]?.contactData?.contactHours
                      ?.thuFri ?? ""}
                  </div>
                  <div>
                    SAT:{" "}
                    {data?.["contact-us"]?.[0]?.contactData?.contactHours
                      ?.sat ?? ""}
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <a
                      href="#"
                      className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                    >
                      Get In Touch
                    </a>
                  </div>
                  <div>
                    <a
                      href="#"
                      className="text-[10px] hover:text-emerald-300 transition-colors font-gintoNord"
                    >
                      Feedback
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-emerald-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-lg font-normal mb-4">
            RING ADVICE, STRAIGHT TO YOUR INBOX
          </h3>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row justify-center items-center gap-0 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              disabled={newsletterLoading}
              className="w-full sm:w-auto flex-1 px-4 py-3 text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={newsletterLoading || !newsletterEmail.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 text-white font-medium hover:bg-emerald-600 transition-colors font-gintoNord disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newsletterLoading ? "SUBSCRIBING..." : "SUBMIT"}
            </button>
          </form>
          {newsletterMessage && (
            <p className={`mt-3 text-sm ${
              newsletterMessage.type === "success" 
                ? "text-emerald-300" 
                : "text-red-300"
            }`}>
              {newsletterMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-emerald-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Certifications and Social */}
          <div className="flex lg:flex-row justify-between items-center mb-8">
            {/* Left: Certifications */}
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="text-[10px]">
                <div>Proudly endorsed by</div>
                <div className="font-bold">DQA</div>
                <div>Design Institute</div>
                <div>of Australia</div>
              </div>
              <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">IGI</span>
              </div>
            </div>

            {/* Right: Clear Neutral Badge */}
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-md text-center">
              <div className="text-[10px] font-bold">CLEAR</div>
              <div className="text-[10px] font-bold">NEUTRAL</div>
              <div className="text-[10px]">CERTIFIED</div>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center space-x-6 mb-3">
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <TikTokIcon />
            </a>
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <Youtube className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <PinterestIcon />
            </a>
            <a
              href="#"
              className="hover:text-emerald-300 transition-colors font-gintoNord"
            >
              <LinkedInIcon />
            </a>
          </div>

          {/* Legal Links */}
          <div className="text-center text-[10px] mb-4">
            <div className="flex flex-wrap justify-center items-center space-x-1">
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Terms and Conditions
              </a>
              <span>|</span>
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Terms of Sale
              </a>
              <span>|</span>
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Privacy
              </a>
              <span>|</span>
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Returns
              </a>
              <span>|</span>
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Site Map
              </a>
              <span>|</span>
              <a
                href="#"
                className="hover:text-emerald-300 transition-colors font-gintoNord"
              >
                Engagement Rings
              </a>
            </div>
          </div>

          {/* Security Text */}
          <div className="text-center text-[10px] mb-4">
            All payments are 256-bit SSL secure and encrypted.
          </div>

          {/* Payment Methods */}
          <div className="flex justify-center items-center space-x-2 mb-4 flex-wrap gap-2">
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">
              AMEX
            </div>
            <div className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold">
              Apple Pay
            </div>
            <div className="bg-gray-600 text-white px-2 py-1 rounded text-[10px] font-bold">
              Generic
            </div>
            <div className="bg text-white px-2 py-1 rounded text-[10px] font-bold">
              G Pay
            </div>
            <div className="bg-orange-600 text-white px-2 py-1 rounded text-[10px] font-bold">
              Discover
            </div>
            <div className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold">
              MC
            </div>
            <div className="bg-blue-800 text-white px-2 py-1 rounded text-[10px] font-bold">
              PayPal
            </div>
            <div className="bg-purple-600 text-white px-2 py-1 rounded text-[10px] font-bold">
              Shop Pay
            </div>
            <div className="bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold">
              Visa
            </div>
            <div className="bg-gray-700 text-white px-2 py-1 rounded text-[10px] font-bold">
              Zip
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-[10px]">© 2025 Cullen Jewellery</div>
        </div>
      </div>
    </footer>
  );
}
