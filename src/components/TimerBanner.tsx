"use client";

import { useState, useEffect, use } from "react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import Link from "next/link";

export function TimerBanner({ content }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 15,
    minutes: 30,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const end = content?.countdown?.endDate;
    if (!end) return;

    const computeTimeLeft = (iso: string) => {
      const endTime = new Date(iso).getTime();
      const now = Date.now();
      let diff = Math.max(0, endTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * 1000 * 60 * 60 * 24;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * 1000 * 60;
      const seconds = Math.floor(diff / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(computeTimeLeft(end));
  }, [content?.countdown?.endDate]);

  return (
    <section className="relative  py-32 md:py-40 overflow-hidden">
      {/* Mobile background: use mobileImage when available */}
      <div
        className="absolute inset-0 bg-cover bg-center block md:hidden"
        style={{
          backgroundImage: `url(${
            content?.mobileImage ||
            content?.image ||
            "https://images.unsplash.com/photo-1589009649715-641c60b982ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwdGVhJTIwc2V0fGVufDF8fHx8MTc2MDQyMTExN3ww&ixlib=rb-4.1.0&q=80&w=1080"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Desktop background: original image for md+ */}
      <div
        className="absolute inset-0 bg-cover bg-center hidden md:block"
        style={{
          backgroundImage: `url(${
            content?.image ||
            "https://images.unsplash.com/photo-1589009649715-641c60b982ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwdGVhJTIwc2V0fGVufDF8fHx8MTc2MDQyMTExN3ww&ixlib=rb-4.1.0&q=80&w=1080"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-4 px-6 py-2 bg-gradient-to-r from-[#3C950D] to-[#2d7009] rounded-full text-sm tracking-wider uppercase shadow-lg"
          >
            {content?.tagline || "Limited Time Only"}
          </motion.div>

          <h2 className="text-4xl md:text-6xl mb-4 drop-shadow-lg">
            {content?.title || "Limited Time Offer!"}
          </h2>
          <p className="text-lg md:text-2xl mb-10 text-white/90">
            {content?.description ||
              "Get 50% off on our premium tea collection"}
          </p>

          <div className="flex justify-center max-sm:flex-wrap gap-4 mb-10">
            {Object.entries(timeLeft).map(([unit, value], index) => (
              <motion.div
                key={unit}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-sm:p-2 max-sm:py-4 min-w-[100px] max-sm:min-w-[75px] border border-white/20 shadow-2xl"
              >
                <div className="text-4xl max-sm:text-2xl md:text-5xl mb-2 bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="text-xs max-sm:text-[0.65rem] md:text-sm uppercase tracking-wider text-white/70">
                  {unit}
                </div>
              </motion.div>
            ))}
          </div>

          <Link href={content?.cat?.link || "search"}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Button className="bg-gradient-to-r from-[#3C950D] to-[#2d7009] hover:from-[#2d7009] hover:to-[#3C950D] text-white px-8 py-6 text-lg shadow-2xl hover:shadow-[#3C950D]/50 transition-all hover:scale-105">
                {content?.cta?.title || "Shop Now"}
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
