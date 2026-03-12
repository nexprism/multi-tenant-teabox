"use client";

import React, { use, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchBlogById, fetchBlogs } from "@/app/store/slices/blogSclie";
import { toast } from "react-toastify";

import Link from "next/link";
import { getImageUrl } from "@/app/utils/imageHelper";

export function formatToReadableDate(isoDateString) {
  const date = new Date(isoDateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

export default function BlogDetailPage() {
  const { items, loading, selectedBlog, error } = useSelector((state) => state.blogs);


  const dispatch = useDispatch();
  const params = useParams();
  const blogId = params.id;
  const hasFetchedRef = useRef(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: selectedBlog?.title || "Check out this blog",
      text: selectedBlog?.excerpt || "I found this interesting blog post!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast.success(!isLiked ? "Added to favorites" : "Removed from favorites");
  };
  const relatedPosts = [
    {
      id: 1,
      date: "February 20, 2024",
      title: "The Art of Tea Brewing: A Beginner's Guide",
      excerpt:
        "Learn the fundamental techniques and secrets behind brewing the perfect cup of tea, from water temperature to steeping times",
      image:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=250&fit=crop&crop=entropy&cs=tinysrgb",
    },
    {
      id: 2,
      date: "February 18, 2024",
      title: "Exploring Premium Ceylon Tea Gardens",
      excerpt:
        "Journey through the misty highlands of Sri Lanka and discover the rich heritage behind some of the world's finest teas",
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=250&fit=crop&crop=entropy&cs=tinysrgb",
    },
    {
      id: 3,
      date: "February 15, 2024",
      title: "Health Benefits of Green Tea",
      excerpt:
        "Discover the scientifically-backed health benefits of green tea and why it should be part of your daily routine",
      image:
        "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&h=250&fit=crop&crop=entropy&cs=tinysrgb",
    },
  ];

  useEffect(() => {
    if (blogId) {
      dispatch(fetchBlogById(blogId));
    }
    if (!hasFetchedRef.current && (!items || items.length === 0)) {
      hasFetchedRef.current = true;
      dispatch(fetchBlogs());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]); // Re-fetch when blogId changes

  // Use selectedBlog from Redux store
  const data = selectedBlog;

  useEffect(() => {
    if (data) {
      console.log("Blog Data:", data);
      console.log("Main Image Raw:", data?.images?.[0]?.url);
      console.log("Main Image Processed:", getImageUrl(data?.images?.[0]?.url));
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/blogs`}
            className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Tea Blog</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Share"
            >
              <Share2 size={18} />
            </button>
            {/* <button
              onClick={toggleLike}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={isLiked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={18}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
            </button> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-96 bg-gradient-to-br from-green-100 to-amber-50 overflow-hidden">



          <img
            src={getImageUrl(data?.images?.[0]?.url) || getImageUrl(data?.image?.[0]?.url) ||
              "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=1200&h=600&fit=crop&crop=entropy&cs=tinysrgb"
            }
            alt={data?.thumbnail?.alt || "Blog Hero Image"}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {formatToReadableDate(
                    data ? data.createdAt : "February 23, 2024"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span> {data?.author || "Unknown"}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>3.2k views</span>
              </div> */}
            </div>

            <h1 className="bebas text-6xl md:text-7xl font-bold leading-tight mb-4 text-gray-900">
              {data ? data.title : "Loading..."}
            </h1>

            <p className="text-xl text-gray-700 max-w-3xl">
              author: {data ? data.author : "Loading..."}
            </p>
          </div>
        </div>
      </div>




      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        {/* Article Stats */}
        {/* <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-500">
              <Heart size={18} />
              <span>156 likes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MessageCircle size={18} />
              <span>23 comments</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">6 min read</div>
        </div> */}

        {/* Article Body */}
        <div
          dangerouslySetInnerHTML={{
            __html: data?.content || "<p>Loading...</p>",
          }}
          className="prose prose-lg max-w-none"
        ></div>

        {/* Tags */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="flex flex-wrap gap-3">
            {data?.tags?.length > 0 &&
              data?.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
          </div>
        </div>

        {/* Author Info */}
        {/* <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg min-w-16 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">CW</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Chen Wei
              </h3>
              <p className="text-gray-600 mb-2">
                Tea Master & Cultural Historian
              </p>
              <p className="text-sm text-gray-500">
                Chen Wei has been practicing traditional tea ceremonies for over
                15 years and teaches the art of mindful tea preparation across
                the globe.
              </p>
            </div>
          </div>
        </div> */}
      </article>

      {/* Related Posts */}
      <section className="border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="bebas text-5xl font-bold text-gray-900 mb-4">
              More Blogs Stories
            </h2>
            <p className="text-gray-600 text-lg">
              Continue your journey into natural wellness with our Ayurvedic insights, health tips, and traditional remedies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {items.slice(0, 3).map((post) => (
              <article key={post._id} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-4">
                  <img
                    src={
                      getImageUrl(post.thumbnail?.url) ||
                      getImageUrl(post.images?.[0]?.url) ||
                      getImageUrl(post.image?.[0]?.url) ||
                      "/placeholder.png"
                    }
                    alt={
                      post.thumbnail?.alt ||
                      post.image?.[0]?.alt ||
                      "Blog Image"
                    }
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    {formatToReadableDate(post.createdAt)}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {post.title}
                  </h3>

                  <Link href={`/blogs/${post._id}`} className="pt-2">
                    <span className="text-green-600 bebas text-sm font-medium group-hover:text-green-700 transition-colors">
                      Read More →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div >
  );
}
