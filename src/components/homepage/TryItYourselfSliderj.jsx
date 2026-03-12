"use client"

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { fetchProducts } from '@/app/store/slices/productSlice';
import { addToWishlist, removeFromWishlist } from '@/app/store/slices/wishlistSlice';
import { addToCart, toggleCart } from '@/app/store/slices/cartSlice';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getImageUrl } from '@/app/utils/imageHelper';

const TryItYourselfSlider = memo(() => {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const dispatch = useDispatch();
  const { products: productData } = useSelector((state) => state.product);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userId = useSelector((state) => state.auth.user?._id);
  const { items: wishlistItems, initialized } = useSelector((state) => state.wishlist);

  // Fetch products on mount
  useEffect(() => {
    dispatch(
      fetchProducts({
        page: 1,
        limit: 8,
        sortBy: 'rating',
        order: 'desc',
        category: '',
        search: '',
      })
    );
  }, [dispatch]);

  // Function to check if a specific product is wishlisted
  const getIsWishlisted = useCallback((product) => {
    const isInReduxWishlist = wishlistItems.some((item) => {
      const itemProduct = item.product;
      const itemProductId = String(
        (typeof itemProduct === 'object'
          ? itemProduct?._id || itemProduct?.id
          : itemProduct) || ''
      );
      const productId = String(product._id || product.id || '');

      if (itemProductId !== productId) return false;

      const variantId = product?.variants?.[0]?._id;
      if (variantId) {
        const itemVariant = item.variant;
        const itemVariantId = String(
          (typeof itemVariant === 'object'
            ? itemVariant?._id || itemVariant?.id
            : itemVariant) || ''
        );
        return itemVariantId === String(variantId);
      }
      return true;
    });

    const isWishlistedFromProduct =
      isAuthenticated &&
      userId &&
      Array.isArray(product.wishlist) &&
      product.wishlist.some((id) => String(id) === String(userId));

    return initialized
      ? isInReduxWishlist
      : isInReduxWishlist || isWishlistedFromProduct;
  }, [wishlistItems, initialized, isAuthenticated, userId]);

  const handleWishlistClick = async (e, product) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const currentlyLiked = getIsWishlisted(product);

    if (currentlyLiked) {
      try {
        await dispatch(
          removeFromWishlist({
            productId: product._id,
            variantId: product?.variants?.[0]?._id,
          })
        ).unwrap();
      } catch (err) {
        console.error('Failed to remove from wishlist:', err);
      }
    } else {
      try {
        await dispatch(
          addToWishlist({
            product: product._id,
            variant: product?.variants?.[0]?._id,
          })
        ).unwrap();
      } catch (err) {
        console.error('Failed to add to wishlist:', err);
      }
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    e.preventDefault();

    const price = product?.variants?.[0]
      ? product?.variants?.[0]?.salePrice || product?.variants?.[0]?.price
      : product?.salePrice || product?.price;

    dispatch(
      addToCart({
        product: {
          id: product._id,
          name: product.name,
          image: product.thumbnail || product.images?.[0],
          variant: product?.variants?.[0]?._id,
          slug: product.slug,
        },
        quantity: 1,
        price: price,
        variant: product?.variants?.[0]?._id,
      })
    );
    dispatch(toggleCart());
  };

  const products = productData?.products || [];

  // Initialize scroll buttons on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const updateScrollButtons = useCallback(() => {
    const container = sliderRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  const scroll = useCallback((direction) => {
    const container = sliderRef.current;
    if (!container) return;

    const scrollAmount = 210; // Adjusted for your card width (200px + 16px gap)

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    // Update button states after scroll animation
    setTimeout(() => {
      updateScrollButtons();
    }, 300);
  }, [updateScrollButtons]);



  const handleScroll = () => {
    // Throttle the scroll updates
    clearTimeout(handleScroll.timeout);
    handleScroll.timeout = setTimeout(updateScrollButtons, 50);
  };

  return (
    <div className="flex relative flex-col lg:flex-row justify-between w-full h-fit py-20 md:px-4 lg:px-0">

      {/* Left Content */}
      <div className="flex-1 relative mb-8 lg:mb-0 lg:mr-8 z-20">
        <h1 className="text-5xl md:text-6xl font-black text-gray-800 leading-tight mb-6 text-center">
          TRY IT YOURSELF.
        </h1>
        <p className="text-gray-800 font-medium text-lg mt-2 lg:max-w-xl">
          Lorem ipsum dolor sit amet, {' '}
          <span className='text-green-600 font-semibold'>consectetur</span> adipiscing elit
        </p>
      </div>

      {/* Right Content - Slider */}
      <div className="flex-1 relative z-20 overflow-x-scroll">
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute -left-2 md:left-0 top-1/2 transform -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 ${canScrollLeft
              ? 'text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100'
              : 'text-gray-300 cursor-not-allowed opacity-50'
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute -right-2 md:right-0 top-1/2 transform -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 ${canScrollRight
              ? 'text-gray-700 hover:bg-gray-50 cursor-pointer opacity-100'
              : 'text-gray-300 cursor-not-allowed opacity-50'
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Slider Container - Desktop only, Grid for Mobile */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="grid grid-cols-2 gap-4 md:flex md:overflow-x-auto md:scrollbar-hide md:gap-0 md:space-x-4 md:px-12 py-4 md:scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.length > 0 ? products.map((product) => (
              <Link
                href={`/productDetail/${product.slug}`}
                key={product._id}
                className="w-full md:min-w-[280px] md:h-[380px] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-200"
              >
                {/* Product Header with Wishlist Button */}
                <div className="rounded-xl relative">
                  {/* Wishlist Heart Button */}
                  <button
                    className="absolute top-2 right-2 z-10 w-8 h-8 hover:scale-[1.1] bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                    onClick={(e) => handleWishlistClick(e, product)}
                    aria-label={
                      getIsWishlisted(product)
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transition: 'stroke 0.4s, fill 0.4s' }}
                    >
                      <path
                        d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.3947C21.7563 5.72729 21.351 5.1208 20.84 4.61V4.61Z"
                        stroke={getIsWishlisted(product) ? '#e63946' : 'black'}
                        fill={getIsWishlisted(product) ? '#e63946' : 'none'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <div className="flex h-40 pt-2 justify-center">
                    <ImageWithFallback
                      src={getImageUrl(product?.thumbnail || product?.images?.[0])}
                      alt={product?.thumbnail?.alt || product?.images?.[0]?.alt || product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  {/* Product Info */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{product.category?.name || 'Product'}</div>
                    <p className="text-sm text-black font-semibold mb-2 line-clamp-2">{product.name}</p>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-gray-800">
                        {product.variants?.[0]?.salePrice ? (
                          <>
                            ₹{product.variants[0].salePrice}
                            <span className="ml-1 text-sm line-through opacity-50">
                              ₹{product.variants[0].price}
                            </span>
                          </>
                        ) : (
                          `₹${product.variants?.[0]?.price || product.price || 'N/A'}`
                        )}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium text-gray-700">{product.rating || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full greenOne text-black py-2.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    ADD TO CART
                  </button>
                </div>
              </Link>
            )) : (
              // Loading state or empty state
              <div className="w-full text-center py-8 text-gray-500">
                Loading products...
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});

export default TryItYourselfSlider;