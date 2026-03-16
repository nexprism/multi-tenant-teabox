"use client";

import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { fetchPages } from "@/app/store/slices/pagesSlice";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axiosInstance from "@/axiosConfig/axiosInstance";
import store from "@/app/store";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function Footer() {
  const { list } = useSelector((state: any) => state.pages);
  const settings = useSelector((state: any) => state.setting.settings);
  const companyName = settings?.tenantInfo?.companyName || "E-Commerce Platform";
  const dispatch = useDispatch<typeof store.dispatch>();
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  useEffect(() => {
    dispatch(fetchPages());
  }, [dispatch]);
  const siteLogo = getImageUrl(settings?.logo || "");
  const siteColor = settings?.websiteColor || "#3C950D";

  useEffect(() => {
    if (typeof document !== 'undefined') {
      try {
        document.documentElement.style.setProperty('--site-color', siteColor);
        const favs = document.querySelectorAll("link[rel~='icon']");
        favs.forEach((el) => {
          if (siteLogo) el.href = siteLogo;
        });
      } catch (e) {}
    }
  }, [siteLogo, siteColor]);
  // Order the top-level page groups so important sections appear first.
  // We normalize using either `mainTitle` (if present) or `_id` and replace hyphens.
  const orderedTitles = [
    "quick links",
    "about us",
    "client care",
    "contact us",
  ];

  const normalizeTitle = (item: any) =>
    (item?.mainTitle ?? item?._id ?? "")
      .replace(/-/g, " ")
      .toString()
      .toLowerCase()
      .trim();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
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
          text: "Thank you for subscribing! Check your email for confirmation."
        });
        setNewsletterEmail("");

        // Clear success message after 5 seconds
        setTimeout(() => {
          setNewsletterMessage(null);
        }, 5000);
      } else {
        throw new Error(response.data.message || "Subscription failed");
      }
    } catch (error: any) {
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

  const sortedList = Array.isArray(list)
    ? [...list].sort((a: any, b: any) => {
      const aT = normalizeTitle(a);
      const bT = normalizeTitle(b);
      const ai = orderedTitles.indexOf(aT);
      const bi = orderedTitles.indexOf(bT);

      // If either is in the preferred order, use that ordering
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }

      // Fallback: alphabetical by normalized title
      return aT.localeCompare(bT);
    })
    : [];

  if (
    pathname.includes("/signup") ||
    pathname.includes("/login") ||
    pathname.includes("/builder") ||
    pathname.includes("/dashboard")
  ) {
    return null; // Don't render Navbar on product detail page
  }
  return (
    <footer className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden ${pathname.includes("/productDetail") ? "mb-[97px]" : "mb-0"}`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: siteColor + '1A' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: siteColor + '1A' }} />

      <div className="container mx-auto px-4 py-10 pb-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center ">
                <Image
                  src={siteLogo || "/logo.webp"}
                  alt="Site Logo"
                  width={30}
                  height={30}
                  className="object-contain h-full w-full"
                />
              </div>
              <span style={{ color: siteColor }} className="capitalize text-xl tracking-tight">
                {companyName}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Trusted Indian (Ayurvedic) products for everyday families, from Kisan source to home.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/bhratgramudyogsangh" },
                { Icon: Instagram, href: "https://www.instagram.com/bharatgramudyogsangh" },
                { Icon: Linkedin, href: "https://www.linkedin.com/company/bharat-gram-udyog-sangh" },
                { Icon: Youtube, href: "https://youtube.com/@bharatgramudyogsangh.?si=KO_t6qu1t0Z9WP0M", }
              ].map(({ Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-site hover:to-[#2d7009] rounded-full flex items-center justify-center transition-all shadow-lg"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          {sortedList.map((item: any, index: number) => {
            if (
              item.mainTitle?.includes("contact") ||
              item._id?.includes("contact")
            )
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h3 className="mb-6 capitalize bg-gradient-to-r from-site to-[#2d7009] bg-clip-text text-transparent">
                    {(item?.mainTitle ?? item?._id ?? "")
                      .toString()
                      .replace(/-/g, " ")}
                  </h3>

                  <div>
                    <div className="space-y-3 text-sm">
                      {item.pages.map((page: any) => (
                        <div
                          key={page._id}
                          className="space-y-3 text-sm flex flex-col  "
                        >
                          <p
                            dangerouslySetInnerHTML={{
                              __html: page.contactData?.appointmentNote ?? "",
                            }}
                            className="text-gray-400 text-sm"
                          ></p>
                          <a
                            href={`mailto:${page.contactData?.email}`}
                            className="text-gray-400 text-sm"
                          >
                            {page.contactData?.email}
                          </a>
                          <a
                            href={`tel:${page.contactData?.phone}`}
                            className="text-gray-400 text-sm"
                          >
                            {page.contactData?.phone}
                          </a>
                          <Link
                            className="text-gray-400 hover:text-site transition-colors flex items-center gap-2 group"
                            href={`contact`}
                          >
                            contact us
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="mb-6 capitalize bg-gradient-to-r from-site to-[#2d7009] bg-clip-text text-transparent">
                  {(item?.mainTitle ?? item?._id ?? "")
                    .toString()
                    .replace(/-/g, " ")}
                </h3>
                <ul className="space-y-3 text-sm">
                  {Array.isArray(item.pages) &&
                    item.pages
                      .filter((page: any) => page?.title?.toLowerCase() !== "client care")
                      .map((page: any, pageIndex: number) => (
                        <li key={pageIndex}>
                          <a
                            href={
                              page?.redirectBySlug
                                ? `/${page.slug}`
                                : `/pages/${page._id}`
                            }
                            className="text-gray-400 hover:text-site transition-colors flex items-center gap-2 group"
                          >
                            <span className="w-0 h-0.5 bg-site capitalize group-hover:w-2 transition-all" />
                            {page.title}
                          </a>
                        </li>
                      ))}
                </ul>
              </motion.div>
            );
          })}

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="mb-6 col-span-2 bg-gradient-to-r from-site to-[#2d7009] bg-clip-text text-transparent">
              Newsletter
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get special offers and updates
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex gap-2 mb-6"
            >
              <Input
                type="email"
                placeholder="Your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterLoading}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 backdrop-blur-sm"
              />
              <Button
                type="submit"
                disabled={newsletterLoading || !newsletterEmail.trim()}
                className="bg-gradient-to-r from-site to-[#2d7009] hover:from-[#2d7009] hover:to-site shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterLoading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            {newsletterMessage && (
              <p className={`text-sm ${newsletterMessage.type === "success"
                ? "text-green-400"
                : "text-red-400"
                }`}>
                {newsletterMessage.text}
              </p>
            )}
            {/* <div className="space-y-3 text-sm">
              {[
                { Icon: Phone, text: "+91 1234567890" },
                { Icon: Mail, text: "info@teahaven.com" },
                { Icon: MapPin, text: "Guwahati, Assam, India" },
              ].map(({ Icon, text }, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-gray-400 hover:text-site transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{text}</span>
                </div>
              ))}
            </div> */}

            <div className="mt-8">
              <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Available On</h3>
              <div className="flex gap-4">
                {[
                  { name: 'Flipkart', src: '/images/flipkart.png' },
                  { name: 'Amazon', src: '/images/amazon.png' },
                  { name: 'Tata 1mg', src: '/images/tata1mg.png' },
                  { name: 'Meesho', src: '/images/meesho.png' },
                  { name: 'Snapdeal', src: '/images/snapdeal.png' }
                ].map((store) => (
                  <div key={store.name} className="bg-white p-2 rounded-lg hover:scale-105 transition-transform cursor-pointer">
                    <Image
                      src={store.src}
                      alt={store.name}
                      width={80}
                      height={30}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400 lg:col-span-5"
          >
            <h2 className="mb-4">We Accept</h2>

            <div>
              {[
                { src: "/payments/gpay.png", alt: "Google Pay" },
                { src: "/payments/netbanking.png", alt: "Net Banking" },
                { src: "/payments/paypal.png", alt: "PayPal" },
                { src: "/payments/PhonePe.png", alt: "PhonePe" },
                { src: "/payments/Rupay.png", alt: "Rupa" },
                { src: "/payments/UPI.png", alt: "UPI" },
                { src: "/payments/visa.png", alt: "Visa" },
              ].map((payment, index) => (
                <Image
                  key={index}
                  src={payment.src}
                  alt={payment.alt}
                  width={50}
                  height={30}
                  className="h-8 min-w-8 w-fit rounded-md mb-2 inline-block mx-2"
                />
              ))}
            </div>
          </motion.div>
        </div>
        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-gray-800 pt-4 text-center text-sm text-gray-400"
        >
          <p>
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
