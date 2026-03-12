"use client";

import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function NewLaunchBanner() {
  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1617266982722-28a0deb420c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWElMjBsZWF2ZXMlMjBjbG9zZXVwfGVufDF8fHx8MTc2MDQyMTExNnww&ixlib=rb-4.1.0&q=80&w=1080)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#3C950D]/95 via-[#3C950D]/90 to-[#2d7009]/95" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Sparkles className="w-10 h-10 text-yellow-300" />
            </motion.div>
            <span className="text-yellow-300 uppercase tracking-widest text-lg">
              New Launch
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight"
          >
            Himalayan White Tea Collection
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white/90 text-lg md:text-xl mb-10 leading-relaxed"
          >
            Experience the delicate flavors of our exclusive Himalayan White
            Tea, harvested from the pristine mountains of North India. Limited
            edition available now.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Button className="bg-white text-[#3C950D] hover:bg-gray-100 px-8 py-6 text-lg shadow-2xl hover:scale-105 transition-all">
              Explore Collection
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg shadow-2xl hover:scale-105 transition-all"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
