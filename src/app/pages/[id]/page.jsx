"use client";

import axiosInstance from "@/axiosConfig/axiosInstance";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";

function Page() {
  const params = useParams();
  const { id } = params;
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/page/${id}`);
        const result = response.data.body.data;
        console.log("Fetched data:", result);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen pt-10 bg-gradient-to-br from-white via-green-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-16 sm:px-8 lg:px-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#3c950d] rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {/* Title Section */}
            <div className="mb-12">
              <h1 className="poppins text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                {data?.title || "Untitled Page"}
              </h1>
              <div className="mt-4 w-20 h-1 bg-gradient-to-r from-[#3c950d] to-green-400 rounded-full"></div>
            </div>

            {/* Content Section */}
            <article
              className="poppins max-w-none text-gray-700 leading-relaxed text-base"
              style={{
                "--tw-prose-headings": "#1a1a1a",
                "--tw-prose-links": "#3c950d",
                "--tw-prose-bold": "#1a1a1a",
                "--tw-prose-code": "#3c950d",
              }}
              dangerouslySetInnerHTML={{
                __html: data?.content || "<p>No content available.</p>",
              }}
            ></article>
          </>
        )}
      </div>

      <style jsx global>{`
        article a {
          color: #3c950d;
          text-decoration: none;
          border-bottom: 1px solid #3c950d;
          transition: all 0.2s ease;
        }

        article a:hover {
          color: #2d7009;
          border-bottom-color: #2d7009;
        }

        article h1,
        article h2,
        article h3,
        article h4,
        article h5,
        article h6 {
          color: #1a1a1a;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        article h2 {
          font-size: 1.875rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        article h3 {
          font-size: 1.5rem;
        }

        article p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
          font-size: 1rem;
        }

        article ul,
        article ol {
          margin-left: 1.5rem;
          margin-bottom: 1.25rem;
        }

        article li {
          margin-bottom: 0.5rem;
        }

        article code {
          background-color: #f0fdf4;
          color: #3c950d;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        article pre {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
        }

        article blockquote {
          border-left: 4px solid #3c950d;
          padding-left: 1rem;
          color: #4b5563;
          font-style: italic;
          margin: 1.5rem 0;
        }

        article img {
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}

export default Page;
