"use client";

import { Leaf, Award, Truck, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { motion } from "motion/react";
import Image from "next/image";

export function WhyUs({ content }) {
  //console.log("why choose content ====>", content);
  return (
    <section className="max-w-7xl mx-auto py-20 relative overflow-hidden">
      <div className="absolute inset-0 " />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent">
            {content?.title || "Why Choose Us?"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-4xl mx-auto">
            <div className="h-full">
              {/* Mobile: show mobileImage if available */}
              <Image
                src={
                  content?.mobileImage || content?.image || "/why-choose-us.jpg"
                }
                alt="Why Choose Us"
                width={800}
                height={400}
                className="mx-auto mb-6 rounded-lg shadow-lg block md:hidden"
              />

              {/* Desktop: show regular image on md+ */}
              <Image
                src={
                  content?.image || content?.mobileImage || "/why-choose-us.jpg"
                }
                alt="Why Choose Us"
                width={800}
                height={400}
                className="mx-auto mb-6 rounded-lg shadow-lg hidden md:block"
              />
            </div>
            <p className="text-gray-600">
              {content?.description ||
                "Discover what makes us the preferred choice for tea lovers"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
