"use client";

import { Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchReviews } from "@/app/store/slices/Reviews";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";

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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function Reviews({ content }) {
  //console.log("reviews content ====>", content);
  const { reviews, loading, error, hasFetched } = useSelector((state: any) => state.reviews);
  const dispatch = useDispatch<any>();
  useEffect(() => {
    if (!hasFetched && !loading) {
      dispatch(fetchReviews());
    }
  }, [dispatch, hasFetched, loading]);
  return (
    <>
      <section className="max-w-7xl mx-auto py-20  px-4 ">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#3C950D]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#3C950D]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent">
              {content?.title || "What Our Customers Say"}
            </h2>
            <p className="text-gray-600">
              {content?.description || "Join thousands of satisfied tea lovers"}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {reviews.slice(0, 4).map((review, index) => (
              <motion.div key={review._id ?? review.id ?? index} variants={itemVariants}>
                <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg h-full group bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="bg-gradient-to-br from-[#3C950D] to-[#2d7009] text-white w-12 h-12 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br uppercase from-[#3C950D] to-[#2d7009] text-white">
                          {review?.userId?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="group-hover:text-[#3C950D] transition-colors">
                          {review?.userId?.name}
                        </h4>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600  text-sm leading-relaxed italic">
                      {"\u201C" + (review?.comment?.slice(0, 115) || "")}
                      {(review?.comment?.length || 0) > 120 ? "..." : "" + "\u201D"}
                    </p>

                    <div className="w-full h-32 mt-2 bg-gray-300 rounded-lg">
                      {/* Placeholder for image or additional content */}
                      <Image
                        src={
                          review?.images?.[0] ||
                          review?.productId?.images?.[0]?.url ||
                          "/images/testimonial-placeholder.webp"
                        }
                        alt="Testimonial Placeholder"
                        width={400}
                        height={128}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1617266982722-28a0deb420c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWElMjBsZWF2ZXMlMjBjbG9zZXVwfGVufDF8fHx8MTc2MDQyMTExNnww&ixlib=rb-4.1.0&q=80&w=1080)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#3C950D]/95 via-[#3C950D]/90 to-[#2d7009]/95" />
        </div>
        <section className="max-w-7xl mx-auto relative py-32 md:py-40 overflow-hidden">
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
                A JOURNEY INTO{" "}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-white/90 text-lg md:text-xl mb-10 leading-relaxed"
              >
                HOLISTIC HEALING,COMBINING TRADITION AND SCIENCE
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link href={"/search"}>
                  <Button className="bg-white text-[#3C950D] hover:bg-gray-100 px-8 py-6 text-lg shadow-2xl hover:scale-105 transition-all">
                    Explore Collection
                  </Button>
                </Link>
                <Link href={`/pages/68fb0ce58b4cf00083b826d2`}>
                  <Button
                    variant="outline"
                    className="border-2 border-white text-[#3C950D] hover:text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg shadow-2xl hover:scale-105 transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
