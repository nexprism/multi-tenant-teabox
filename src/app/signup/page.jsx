"use client";
import { Suspense, useState, useEffect } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { signUp } from "../store/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/common/Loading";
import { toast } from "react-toastify";
import Image from "next/image";
import Link from "next/link";

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.setting?.settings);
  const companyName = settings?.tenantInfo?.companyName || "E-Commerce Platform";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }
    try {
      const signupResult = await dispatch(
        signUp({ ...formData, role: "6888848d897c0923edbed1fb" })
      ).unwrap();

      // Track SIGNUP event (best-effort)
      try {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SIGNUP",
            user: {
              _id: signupResult?._id || signupResult?.id || null,
              email: signupResult?.email || formData.email,
              name: signupResult?.name || formData.name,
            },
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch (e) {
        // non-blocking
      }

      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error(error.message || "Signup failed. Please try again.");
    }
  };

  // Track page view for signup page (best-effort)
  useEffect(() => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAGE_VIEW",
          url: window.location.pathname,
          title: document.title || "Signup",
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Welcome Section */}
        <div className="flex-1 bg-gradient-to-br from-green-500 to-green-600 p-6 sm:p-8 lg:p-12 text-white flex flex-col justify-center">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center mb-4 lg:mb-6">
              <div className="text-2xl sm:text-3xl font-bold">
                <Link href="/" className="text-black">
                                                <Image
                                                  src="/logo.webp"
                                                  alt="TeaHaven Logo"
                                                  width={80}
                                                  height={80}
                                                  className="rounded-full h-[70px] w-[70px] max-sm:h-[60px] max-sm:w-[60px] object-cover "
                                                />
                                              </Link></div>
            </div>
            <h1 className="text-md sm:text-lg lg:text-xl text-white font-bold mb-3 lg:mb-4 leading-tight">
              {companyName}.
            </h1>
            <h1 className="text-2xl sm:text-xl lg:text-2xl font-bold mb-3 lg:mb-4 leading-tight">
              Trusted Indian (Ayurvedic) products for everyday families, from Kisan source to home.
            </h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-6 lg:mb-2">
              Login or Sign up to explore authentic Ayurvedic and Swadeshi
              products, quality-driven from Kisan sources to your home,
              supporting India’s rural traditions.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-3 lg:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 lg:p-6 border border-white/20">
              <div className="flex items-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 mr-2 flex-shrink-0" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Authentic Swadeshi Products
                </h3>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 lg:p-6 border border-white/20">
              <div className="flex items-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 mr-2 flex-shrink-0" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Made by kisan
                </h3>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 lg:p-6 border border-white/20">
              <div className="flex items-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 mr-2 flex-shrink-0" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Made for daily use
                </h3>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 lg:p-6 border border-white/20">
              <div className="flex items-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 mr-2 flex-shrink-0" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Trusted by 8 Lakh+ Customers Across India
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex-1 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-gray-50">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Sign Up Now
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 lg:mb-8">
              Create your account to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 flex-shrink-0"
                />
                <label
                  htmlFor="terms"
                  className="ml-3 text-xs sm:text-sm text-gray-600"
                >
                  I accept that I have read & understood TeaBox's{" "}
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    Privacy Policy
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    T&Cs
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!acceptTerms}
                className="w-full greenOne text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-5 lg:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Signup = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignupPage />
    </Suspense>
  );
};

export default Signup;
