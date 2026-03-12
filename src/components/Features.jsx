import React from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { Leaf, Award, Truck, Shield } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% Organic",
    description:
      "All our teas are sourced from certified organic farms with no pesticides or chemicals.",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description:
      "Handpicked and carefully processed to ensure the finest quality in every cup.",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Enjoy free shipping on all orders above ₹500 across India.",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Your payment information is always safe and secure with us.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};
export function Features({ content }) {
  console.log("Features ===> ", content);
  return (
    <section className="max-w-7xl mx-auto py-20 relative overflow-hidden">
      <div className="absolute inset-0 " />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:hidden block"
        >
          <h1 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent">
            {content?.title || "Why Choose Us?"}
          </h1>
          <p className="text-gray-600">
            {content?.description ||
              "Discover what makes us the preferred choice for tea lovers"}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {content?.cards?.map((feature, index) => {
            // const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group h-full bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-20 h-20 bg-gradient-to-br from-[#3C950D] to-[#2d7009] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-[#3C950D]/30"
                    >
                      {/* <Icon className="w-10 h-10 text-white" /> */}
                      <h2 className="text-xl text-white"> {`0${index + 1}`}</h2>
                    </motion.div>
                    <h3 className="mb-3 group-hover:text-[#3C950D] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
