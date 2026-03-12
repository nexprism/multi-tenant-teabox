"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { fetchFaqs } from "@/app/store/slices/faqSlice";

export function FAQ({ content }) {
  const [showAll, setShowAll] = useState(false);
  const { faqs, loading, error } = useSelector((state) => state.faq);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!faqs || faqs.length === 0) {
      dispatch(fetchFaqs());
    }
  }, [dispatch, faqs]);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Determine how many FAQs to show
  const maxVisible = 5;
  const hasMoreThanFive = faqs.length > maxVisible;
  const visibleFAQs = showAll ? faqs : faqs.slice(0, maxVisible);
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#3C950D] to-[#2d7009] bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Find answers to common questions about our teas
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {visibleFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl px-6 hover:shadow-xl transition-shadow"
                >
                  <AccordionTrigger className="hover:text-[#3C950D] hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* View More / View Less Button */}
          {hasMoreThanFive && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center mt-8"
            >
              <button
                onClick={toggleShowAll}
                className="px-6 py-2 bg-gradient-to-r from-[#3C950D] to-[#2d7009] text-white rounded-lg hover:from-[#2d7009] hover:to-[#3C950D] transition-all font-medium shadow-lg hover:shadow-xl"
              >
                {showAll ? "View Less" : `View More (${faqs.length - maxVisible} more)`}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
