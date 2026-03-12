"use client";

import { Award, CheckCircle, Leaf, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { motion } from "motion/react";

const certifications = [
  {
    icon: Award,
    title: "Organic Certified",
    description: "USDA & India Organic",
  },
  {
    icon: CheckCircle,
    title: "FSSAI Approved",
    description: "Food Safety Standards",
  },
  {
    icon: Leaf,
    title: "Fair Trade",
    description: "Ethical Sourcing",
  },
  {
    icon: Star,
    title: "ISO Certified",
    description: "Quality Management",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export function Certifications() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-[#3C950D]/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent">
            Our Certifications
          </h2>
          <p className="text-gray-600">
            Trusted quality backed by international standards
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {certifications.map((cert, index) => {
            const Icon = cert.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="w-20 h-20 bg-gradient-to-br from-[#3C950D] to-[#2d7009] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-[#3C950D]/30"
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="mb-1 group-hover:text-[#3C950D] transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{cert.description}</p>
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
