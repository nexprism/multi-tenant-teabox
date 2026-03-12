"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogs } from "../store/slices/blogSclie";
import Image from "next/image";

export default function BlogSection() {
  const { items, loading } = useSelector((state) => state.blogs);
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current && (!items || items.length === 0)) {
      hasFetchedRef.current = true;
      dispatch(fetchBlogs());
    }
  }, [dispatch, items]);
  return (
    <div className="py-10 px-5">
      <div className="max-w-7xl mx-auto">
        {/* Blogs Label */}
        <div className="text-sm poppins text-gray-600 mb-2">Blogs</div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl text-black bebas mb-5">
          Find Your Interesting One
        </h1>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {items.map((post) => (
            <div
              key={post._id}
              className="bg-gray-100/50 overflow-hidden  hover:shadow-lg transition-shadow duration-300"
            >
              {/* Blog Image Placeholder */}
              <div className=" h-56 w-full  bg-gray-300">
                <Image
                  src={
                    post?.thumbnail?.url ||
                    post?.images[0]?.url ||
                    "/Image-not-found.png"
                  }
                  alt={
                    post?.thumbnail?.alt ||
                    post?.images[0]?.alt ||
                    "/Image-not-found.png "
                  }
                  width={260}
                  height={224}
                  objectFit="cover"
                  className="rounded-md h-full w-full group-hover:scale-[1.05] transition-transform duration-300"
                />
              </div>

              {/* Blog Content */}
              <div className="pt-4 pb-4 px-2">
                {/* Date */}
                <div className="text-xs text-gray-500 mb-2">{post.date}</div>

                {/* Title */}
                <h3 className="text-base h-10 line-clamp-2  font-bold text-gray-800 mb-2 leading-tight">
                  {post.title}
                </h3>

                {/* Excerpt */}
                {/* <p
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  className="text-xs text-gray-600 leading-relaxed mb-4"
                ></p> */}

                {/* Read More Link */}
                <Link
                  href={`blogs/${post._id}`}
                  className="text-md bebas text-green-600  uppercase tracking-wide hover:underline"
                >
                  Read More &gt;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
