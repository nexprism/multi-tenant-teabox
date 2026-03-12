"use client";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import useTokenRefresh from "../hooks/useTokenRefresh";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "./store/slices/settingSlice";
import { fetchCategoryWithSubcategories } from "./store/slices/categorySlice";
import { closeCart, restoreCartState } from "./store/slices/cartSlice";
import { restoreCheckoutState } from "./store/slices/checkOutSlice";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth ?? {});
  const dispatch = useDispatch();
  const { settings, lastFetched } = useSelector((state) => state.setting);
  const [categories, setCategories] = useState([]);
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  // Check if we're on the checkout page
  const isCheckoutPage = pathname === "/checkout";

  // Always call hooks at top level
  // useTokenRefresh();

  // Suppress canceled errors globally for this component
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      const isCanceled =
        error?.name === 'CanceledError' ||
        error?.code === 'ERR_CANCELED' ||
        error?.code === 'ECONNABORTED' ||
        error?.message === 'canceled' ||
        (error?.message && typeof error.message === 'string' && error.message.toLowerCase().includes('canceled')) ||
        (error?.config && error.config.signal && error.config.signal.aborted);

      if (isCanceled) {
        event.preventDefault(); // Prevent Next.js from logging the error
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Close cart immediately on mount (synchronous, before useEffect)
  React.useEffect(() => {
    dispatch(closeCart());
    dispatch(restoreCartState());
    dispatch(restoreCheckoutState());
  }, [dispatch]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);

    // Fetch settings once on client side if not present or cache expired
    if (!settings || !settings.activeHomepageLayout || !isCacheValid) {
      dispatch(fetchSettings());
    }

    // Fetch categories once and pass to Navbar
    // Use AbortController to properly handle request cancellation
    const abortController = new AbortController();
    let mounted = true;

    // Wrap in promise that suppresses canceled errors
    const fetchCategories = async () => {
      try {
        const res = await fetchCategoryWithSubcategories(abortController.signal);
        // Only set categories if component is still mounted and response is valid
        if (mounted && res && !res.canceled && Array.isArray(res)) {
          setCategories(res);
        }
      } catch (err) {
        // This catch should rarely be hit since fetchCategoryWithSubcategories
        // now suppresses canceled errors, but handle real errors just in case
        const isCanceled =
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED' ||
          err.message === 'canceled' ||
          (err.message && err.message.toLowerCase().includes('canceled'));

        if (!isCanceled) {
          console.warn("Error loading categories in ClientLayout:", err);
        }
      }
    };

    // Call and add catch to prevent unhandled rejection
    fetchCategories().catch(() => {
      // Silently ignore - errors are already handled in fetchCategories
    });

    return () => {
      mounted = false;
      abortController.abort(); // Cancel the request when component unmounts
    };
  }, []);

  return (
    <>
      {!isCheckoutPage && <Navbar initialCategories={categories} />}
      {children ?? null}
      {!isCheckoutPage && <Footer />}
    </>
  );
}
