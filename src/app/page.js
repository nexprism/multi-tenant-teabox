"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "./store/slices/settingSlice";
import { LoadingSpinner } from "@/components/common/Loading";

// Dynamic imports for homepage components to reduce initial bundle size
const DynamicHomepage = dynamic(
  () => import("@/components/homepage/DynamicHomepage").then((mod) => {
    // Ensure we return a valid component
    if (mod && mod.default) {
      return mod;
    }
    // Fallback if module structure is unexpected
    console.error("DynamicHomepage module structure unexpected:", mod);
    return { default: () => <div>Error loading homepage component</div> };
  }).catch((err) => {
    console.error("Failed to load DynamicHomepage:", err);
    // Return a fallback component
    return { default: () => <div>Error loading homepage. Please refresh the page.</div> };
  }),
  {
    loading: () => (
      <div className="h-[90vh] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false // Disable SSR for client components
  }
);

const DynamicHomepage2 = dynamic(
  () => import("@/components/homepage/DynamicHomepage2"),
  {
    loading: () => (
      <div className="h-[90vh] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false // Disable SSR for client components
  }
);

export default function HomePage() {
  const { settings, loading } = useSelector((state) => state.setting);
  const dispatch = useDispatch();
  const settingsFetchedRef = useRef(false);

  // Fetch settings only once on mount (with error handling)
  useEffect(() => {
    if (!settingsFetchedRef.current) {
      settingsFetchedRef.current = true;
      // Add error handling to prevent page reloads
      dispatch(fetchSettings()).catch((err) => {
        console.warn("Failed to fetch settings:", err);
        // Don't let errors cause page reloads
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Track homepage view (best-effort)
  useEffect(() => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAGE_VIEW",
          url: window.location.pathname,
          title: document.title || "Home",
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch (e) {}
  }, []);

  if (loading) {
    return (
      <div className="h-[90vh] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main>
      {settings?.activeHomepageLayout == "Minimal & Organic UI" ? (
        <DynamicHomepage2 />
      ) : (
        <DynamicHomepage />
      )}
    </main>
  );
}
