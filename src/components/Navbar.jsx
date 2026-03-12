"use client";

import {
  Search,
  Bell,
  ShoppingCart,
  User,
  Menu,
  Heart,
  ChevronDown,
  X,
  ChevronRight,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategories,
  fetchCategoryWithSubcategories,
} from "@/app/store/slices/categorySlice";
import { getCartItems, toggleCart, closeCart } from "@/app/store/slices/cartSlice";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
// Dynamic import for CartSidebar to reduce initial bundle size
const CartSidebar = dynamic(() => import('./CartSidebar'), {
  loading: () => null,
  ssr: false
});
import {
  fetchWishlist,
  selectWishlistItems,
} from "@/app/store/slices/wishlistSlice";
import Image from "next/image";
import { fetchProducts } from "@/app/store/slices/productSlice";
import { fetchBlogs } from "@/app/store/slices/blogSclie";
import axiosInstance from "@/axiosConfig/axiosInstance";
import { getImageUrl } from "@/app/utils/imageHelper";
import { getDisplayPrice } from "@/app/utils/priceHelper";

export default function Navbar({ initialCategories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null); // For desktop hover
  const { cartItems = [] } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.blogs);
  const reduxProducts = useSelector((state) => {
    const products = state.product?.products;
    if (Array.isArray(products)) return products;
    if (products && Array.isArray(products.products)) return products.products;
    return [];
  });
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const searchRef = useRef(null);
  const searchToggleRef = useRef(null);

  const LikedProducts = useSelector(selectWishlistItems);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const hasInitialized = useRef(false);

  const initialData = async () => {
    // Prevent duplicate calls
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Use categories provided by parent (e.g. ClientLayout) when available
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      try {
        const res = await fetchCategoryWithSubcategories();
        if (res) setCategories(res || []);
      } catch (err) {
        // Error handling is done in fetchCategoryWithSubcategories, but catch here too for safety
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && err.message !== 'canceled') {
          console.warn("Error fetching categories in Navbar:", err);
        }
      }
    }

    // Only fetch products if not already in Redux store AND not on the search page
    // The search page does its own fetching with specific filters.
    if ((!Array.isArray(reduxProducts) || reduxProducts.length === 0) && pathname !== "/search") {
      const payload = {
        page: 1,
        limit: 20,
        sort: "createdAt",
        order: "desc",
        filters: {},
      };
      dispatch(fetchProducts(payload));
    }

    // Only fetch wishlist if authenticated and not already fetched
    if (isAuthenticated && (!LikedProducts || LikedProducts.length === 0)) {
      dispatch(fetchWishlist());
    }

    // Only fetch blogs if not already fetched
    if (!items || items.length === 0) {
      dispatch(fetchBlogs());
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      const abortController = new AbortController();

      // Wrap initialData call to handle cancellation
      const loadData = async () => {
        try {
          await initialData();
        } catch (err) {
          // Ignore canceled errors
          if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && err.message !== 'canceled') {
            console.warn("Error in initialData:", err);
          }
        }
      };

      loadData();

      return () => {
        abortController.abort(); // Cancel any ongoing requests on unmount
      };
    }
  }, []); // Only run once on mount

  // Close cart immediately on mount (synchronous, before paint)
  useLayoutEffect(() => {
    dispatch(closeCart());
  }, [dispatch]);

  // Removed: Load cart items on mount - this was causing unnecessary API calls
  // Cart items will be loaded from localStorage instead, and synced with server only when:
  // 1. User opens the cart sidebar
  // 2. User adds/removes items
  // 3. User logs in/out

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  // Close search dropdown when clicking outside of it or the toggle button
  useEffect(() => {
    function handleClickOutside(e) {
      if (!showSearch) return;
      const target = e.target;
      if (
        searchRef.current &&
        !searchRef.current.contains(target) &&
        searchToggleRef.current &&
        !searchToggleRef.current.contains(target)
      ) {
        setShowSearch(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  // Ensure mobile menu subcategory is collapsed when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setExpandedCategory(null);
    }
  }, [isOpen]);

  const handelCartToggle = () => {
    dispatch(toggleCart());
  };

  const handleUserDashboardClick = () => {
    //console.log("Navigating to user dashboard");
    if (isAuthenticated) {
      //console.log("Navigating to user dashboard 2");
      router.push("/dashboard");
      //console.log("Navigating to user dashboard 3");
    } else {
      //console.log("Navigating to user dashboard 4a");
      router.push("/login");
    }
    setIsOpen(false);
  };

  const [displayName, setDisplayName] = useState("User");
  useEffect(() => {
    if (isAuthenticated && user?.name) {
      setDisplayName(user.name);
    } else if (isAuthenticated) {
      setDisplayName("User");
    } else {
      setDisplayName("Guest");
    }
  }, [isAuthenticated, user?.name]);

  const fetchProductsFromApi = async () => {
    try {
      const quaryParams = new URLSearchParams();

      if (searchTerm) {
        quaryParams.append(
          "searchFields",
          JSON.stringify({ name: searchTerm })
        );
      }

      const response = await axiosInstance.get("/product", {
        params: quaryParams,
      });
      const fetchedProducts = response?.data?.products?.data?.products || response?.data?.products?.data || [];
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
    } catch (error) {
      //console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const filterBlogs = (term) => {
    if (term.trim() === "") {
      setFilteredBlogs([]);
      return;
    }
    const filtered = items?.filter((blog) =>
      blog?.title?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredBlogs(filtered);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProductsFromApi();
      filterBlogs(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Toggle category expansion for mobile
  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (
    pathname.includes("/signup") ||
    pathname.includes("/login") ||
    pathname.includes("/builder")
  ) {
    return null;
  }

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-[999] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-2 md:px-8 py-2 md:py-2">
          {/* <div className="container mx-auto px-2 md:px-8 py-2 md:py-2"> */}
          <div className="flex items-center justify-between gap-2 md:gap-6">
            {/* Mobile Menu & Logo */}
            {/* <div className="flex items-center w-2/3 justify-between   gap-2 md:gap-4"> */}
            {/* Hamburger Menu - Mobile Only */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              {!pathname.includes("/dashboard") && (
                <SheetTrigger asChild>
                  <button type="button" className="md:hidden text-[#3C950D] hover:text-[#3C950D] transition-colors p-2 pr-4">
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
              )}
              <SheetContent
                side="left"
                className="w-auto sm:w-[320px] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-[#3C950D]">Menu</SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-2">
                  <div
                    onClick={handleUserDashboardClick}
                    className="flex mx-4 px-2 py-2 rounded-md bg-green-100 items-center gap-2 cursor-pointer hover:text-[#3C950D] transition-all hover:scale-105"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-[#3C950D]  rounded-full flex items-center justify-center">
                      {displayName ? (
                        <span className="text-white font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-white font-semibold">User</span>
                      )}
                    </div>
                    <span className=" text-sm text-[#3C950D]">
                      {displayName ?? "User"}
                    </span>
                  </div>
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-left px-4 py-1 text-gray-800 hover:bg-[#3C950D]/10 rounded-lg transition-colors font-semibold block"
                  >
                    Home
                  </Link>
                  <Link
                    href="/search"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-left px-4 py-1 text-gray-800 hover:bg-[#3C950D]/10 rounded-lg transition-colors font-semibold block"
                  >
                    All Products
                  </Link>

                  <div className="border-t border-gray-200 my-2"></div>

                  <p className="px-4 py-2 text-sm font-semibold text-gray-800">
                    Categories
                  </p>
                  {categories?.map((category, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/search?category=${category._id}`}
                          prefetch={true}
                          onClick={() => setIsOpen(false)}
                          className="w-full text-left px-4 py-2 text-gray-500 hover:bg-[#3C950D]/10 rounded-lg transition-colors block"
                        >
                          {category?.name}
                        </Link>

                        {/* Toggle button for subcategories */}
                        {category.subcategories?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(category._id)}
                            className="px-3 py-2 hover:bg-[#3C950D]/10 rounded-lg transition-colors"
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedCategory === category._id
                                ? "rotate-180"
                                : ""
                                }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Collapsible subcategories */}
                      {category.subcategories?.length > 0 && (
                        <div
                          className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${expandedCategory === category._id
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                            }`}
                        >
                          {category?.subcategories?.map((sub) => (
                            <Link
                              key={sub._id}
                              href={`/search?subcategory=${sub._id}`}
                              prefetch={true}
                              onClick={() => setIsOpen(false)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-[#3C950D]/5 rounded-lg transition-colors block"
                            >
                              • {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="border-t border-gray-200 my-2"></div>

                  <Link
                    href="/pages/68fb0ce58b4cf00083b826d2"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-[#3C950D]/10 rounded-lg transition-colors block"
                  >
                    About Us
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-[#3C950D]/10 rounded-lg transition-colors block"
                  >
                    Contact Us
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="text-black">
                <Image
                  src="/bg removed.png"
                  alt="TeaHaven Logo"
                  width={200}
                  height={200}
                  className=" md:h-[100px] h-[50px] w-auto max-sm:h-auto max-sm:w-[65px] object-contain "
                />
              </Link>

            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center  gap-6 ml-1/2">
              {/* Categories with Mega Menu - LEFT/RIGHT LAYOUT */}

              <Link
                href="/"
                className="text-gray-700 hover:text-[#3C950D] transition-colors font-medium"
              >
                Home
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setShowCategoryMenu(true)}
                onMouseLeave={() => {
                  setShowCategoryMenu(false);
                  setHoveredCategory(null);
                }}
              >
                <button type="button" className="flex items-center gap-1 text-gray-700 hover:text-[#3C950D] transition-colors py-2 font-medium">
                  Categories
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showCategoryMenu ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Categories Mega Menu Dropdown - NEW LAYOUT */}
                {showCategoryMenu && (
                  <div className="absolute left-0 top-full pt-2 w-[700px] -ml-4">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="flex h-[500px]">
                        {/* LEFT SIDE - Categories List */}
                        <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                          <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="w-1 h-5 bg-[#3C950D] rounded-full"></span>
                              All Categories
                            </h3>
                            <div className="space-y-1">
                              {categories?.map((category) => {
                                if (category?.status !== "Active") return null;
                                return (
                                  <div
                                    key={category._id}
                                    onMouseEnter={() =>
                                      setHoveredCategory(category._id)
                                    }
                                    className={`group cursor-pointer rounded-lg transition-all ${hoveredCategory === category._id
                                      ? "bg-white shadow-sm"
                                      : "hover:bg-white/50"
                                      }`}
                                  >
                                    <Link
                                      href={`/search?category=${category._id}`}
                                      prefetch={true}
                                      onClick={() => {
                                        setShowCategoryMenu(false);
                                        setHoveredCategory(null);
                                      }}
                                      className="flex items-center gap-3 p-3"
                                      style={{ cursor: "pointer" }}
                                    >
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                        {category?.image ? (
                                          <Image
                                            src={getImageUrl(category?.image || category?.thumbnail) || "/placeholder.png"}
                                            alt={category?.name || ''}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <Image
                                              src="/placeholder.png"
                                              alt="Placeholder"
                                              width={20}
                                              height={20}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4
                                          className={`font-medium text-sm transition-colors truncate ${hoveredCategory === category._id
                                            ? "text-[#3C950D]"
                                            : "text-gray-700"
                                            }`}
                                        >
                                          {category?.name}
                                        </h4>
                                        {category?.subcategories?.length > 0 && (
                                          <p className="text-xs text-gray-500">
                                            {category.subcategories.length}{" "}
                                            items
                                          </p>
                                        )}
                                      </div>
                                      {category.subcategories?.length > 0 && (
                                        <ChevronRight
                                          className={`w-4 h-4 transition-colors ${hoveredCategory === category._id
                                            ? "text-[#3C950D]"
                                            : "text-gray-400"
                                            }`}
                                        />
                                      )}
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT SIDE - Subcategories */}
                        <div className="flex-1 bg-white overflow-y-auto">
                          <div className="p-6">
                            {hoveredCategory ? (
                              <>
                                {(() => {
                                  const selectedCategory = categories.find(
                                    (cat) => cat._id === hoveredCategory
                                  );
                                  return (
                                    <>
                                      <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                          {selectedCategory?.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                          {selectedCategory?.subcategories
                                            ?.length > 0
                                            ? `${selectedCategory.subcategories.length} subcategories`
                                            : "No subcategories"}
                                        </p>
                                      </div>

                                      {selectedCategory?.subcategories?.length >
                                        0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                          {selectedCategory?.subcategories?.map(
                                            (subcategory) => {
                                              if (
                                                subcategory?.status !== "Active"
                                              )
                                                return null;
                                              return (
                                                <Link
                                                  key={subcategory._id}
                                                  href={`/search?category=${selectedCategory._id}&subcategory=${subcategory._id}`}
                                                  onClick={() => {
                                                    setShowCategoryMenu(false);
                                                    setHoveredCategory(null);
                                                  }}
                                                >
                                                  <div className="group/sub flex items-center gap-3 p-3 rounded-lg hover:bg-[#3C950D]/5 transition-all cursor-pointer border border-transparent hover:border-[#3C950D]/20">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                                                      {subcategory?.image ? (
                                                        <Image
                                                          src={getImageUrl(subcategory?.image || subcategory?.thumbnail) || "/placeholder.png"}
                                                          alt={subcategory?.name || ''}
                                                          width={48}
                                                          height={48}
                                                          className="w-full h-full object-cover"
                                                        />
                                                      ) : (
                                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                          <Image
                                                            src="/placeholder.png"
                                                            alt="Placeholder"
                                                            width={24}
                                                            height={24}
                                                          />
                                                        </div>
                                                      )}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 group-hover/sub:text-[#3C950D] transition-colors">
                                                      {subcategory?.name}
                                                    </span>
                                                  </div>
                                                </Link>
                                              );
                                            }
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center h-48">
                                          <p className="text-gray-400 text-sm">
                                            No subcategories available
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-[#3C950D]/10 rounded-full flex items-center justify-center mb-4">
                                  <ChevronRight className="w-8 h-8 text-[#3C950D]" />
                                </div>
                                <p className="text-gray-500 text-sm">
                                  Hover over a category to see subcategories
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* View All Button */}
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <Link
                          href="/search"
                          onClick={() => {
                            setShowCategoryMenu(false);
                            setHoveredCategory(null);
                          }}
                        >
                          <button type="button" className="w-full py-2.5 bg-gradient-to-r from-[#3C950D] to-[#2d7009] text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm">
                            View All Categories →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Products with Mega Menu */}
              <div
                className="relative"
                onMouseEnter={() => setShowProductMenu(true)}
                onMouseLeave={() => setShowProductMenu(false)}
              >
                <button type="button" className="flex items-center gap-1 text-gray-700 hover:text-[#3C950D] transition-colors py-2 font-medium">
                  Products
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showProductMenu ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Products Mega Menu Dropdown */}
                {showProductMenu && (
                  <div className="absolute -left-[32vw] top-full pt-2 w-screen  max-w-6xl -ml-4">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-100 p-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#3C950D] rounded-full"></span>
                        Featured Products
                      </h3>
                      <div className="grid grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
                        {(() => {
                          const displayProducts = (Array.isArray(products) && products.length > 0) ? products : reduxProducts;
                          return (Array.isArray(displayProducts) ? displayProducts : [])
                            .filter(product => product?.variants?.length > 0) // Filter first
                            .slice(0, 10) // Then slice to exactly 10
                            .map((product) => (
                              <Link
                                key={product._id}
                                href={`/productDetail/${product.slug}`}
                                onClick={() => setShowProductMenu(false)}
                              >
                                <div className="group cursor-pointer">
                                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                                    <Image
                                      src={getImageUrl(product?.thumbnail || product.images?.[0]) || "/Image-not-found.png"}
                                      alt={
                                        product?.thumbnail?.alt ||
                                        product.images?.[0]?.alt ||
                                        product?.name ||
                                        "Product Image"
                                      }
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                  </div>
                                  <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-[#3C950D] transition-colors line-clamp-2">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const { salePrice, originalPrice, hasSale } = getDisplayPrice(product);
                                      return (
                                        <>
                                          <span className="text-[#3C950D] font-semibold text-sm">
                                            ₹{salePrice}
                                          </span>
                                          {hasSale && (
                                            <span className="text-black/50 font-semibold text-xs line-through">
                                              ₹{originalPrice}
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </Link>
                            ))
                        })()}
                      </div>

                      <Link
                        href="/search"
                        onClick={() => setShowProductMenu(false)}
                      >
                        <button type="button" className="mt-6 w-full py-3 bg-gradient-to-r from-[#3C950D] to-[#2d7009] text-white rounded-lg hover:shadow-lg transition-all font-medium">
                          Explore More Products →
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/pages/68fb0ce58b4cf00083b826d2"
                className="text-gray-700 hover:text-[#3C950D] transition-colors font-medium"
              >
                About Us
              </Link>

              <Link
                href="/contact"
                className="text-gray-700 hover:text-[#3C950D] transition-colors font-medium"
              >
                Contact Us
              </Link>
            </div>
            {/* </div> */}

            {/* Spacer for centering */}
            {/* <div className="flex-1"></div> */}

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4 ">
              {/* Search Icon */}
              <button
                type="button"
                ref={searchToggleRef}
                onClick={() => setShowSearch(!showSearch)}
                className="hover:text-[#3C950D] max-sm:hidden text-black outline-none transition-all hover:scale-110"
              >
                <Search className="w-5 h-5 mb-1/2  md:w-6 md:h-6" />
              </button>

              {/* Wishlist */}
              {isClient && (
                <Link
                  href={isAuthenticated ? "/dashboard?tab=wishlist" : "/login"}
                >
                  <button type="button" className="relative flex hover:text-[#3C950D] text-black transition-all hover:scale-110">
                    <Heart className="w-5 h-5 md:w-6 md:h-6" />
                    <Badge className="absolute text-white -top-1 -right-1 md:-top-1 md:-right-2  bg-[#3C950D]  w-4 h-4  rounded-full p-0 flex items-center justify-center text-[10px]  shadow-lg">
                      {LikedProducts?.length || 0}
                    </Badge>
                  </button>
                </Link>
              )}

              {/* Cart */}
              <button
                type="button"
                onClick={handelCartToggle}
                className="relative flex max-sm:mr-2 hover:text-[#3C950D] text-black transition-all hover:scale-110"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                <Badge className="absolute text-white -top-1 -right-1 md:-top-1 md:-right-2  bg-[#3C950D]  w-4 h-4  rounded-full p-0 flex items-center justify-center text-[10px]  shadow-lg">
                  {Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0}
                </Badge>
              </button>

              {/* User */}
              <div
                onClick={handleUserDashboardClick}
                className="flex max-sm:hidden items-center gap-2 cursor-pointer hover:text-[#3C950D] transition-all hover:scale-105"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-[#3C950D]  rounded-full flex items-center justify-center">
                  {displayName ? (
                    <span className="text-white font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-white font-semibold">User</span>
                  )}
                </div>
                <span className="hidden lg:block text-sm text-[#3C950D]">
                  {displayName ?? "User"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        <div
          ref={searchRef}
          className={`overflow-hidden transition-all duration-300 ease-in-out ${showSearch ? "max-h-fit opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="container mx-auto px-2 md:px-8 pb-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search for products..."
                className="pl-10 pr-10 w-full outline-none ring-0 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                autoFocus={showSearch}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3C950D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="container flex flex-col gap-2 mx-auto px-2 md:px-8 pb-4">
            {filteredBlogs?.length > 0 && (
              <div>
                <h2 className="text-black">Blogs</h2>

                <div className="mt-2">
                  {filteredBlogs?.length === 0 ? (
                    <p className="text-gray-500">No blogs found.</p>
                  ) : (
                    <div className="flex gap-4 max-sm:flex-wrap">
                      {filteredBlogs?.map((blog) => (
                        <div
                          key={blog._id}
                          className="border-2 cursor-pointer p-2 rounded-md flex gap-2 border-gray-200"
                        >
                          <Image
                            src={getImageUrl(blog?.thumbnail || blog?.images?.[0])}
                            alt={blog?.thumbnail?.alt || blog?.images?.[0]?.alt}
                            width={100}
                            height={60}
                            className="w-24 h-16 max-sm:w-20 max-sm:h-14 object-cover rounded-md"
                          />
                          <h3 className="text-gray-800 w-20 line-clamp-2 text-xs font-medium">
                            {blog.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-black">Products</h2>

              <div className="mt-2">
                {!Array.isArray(products) || products?.length === 0 ? (
                  <p className="text-gray-500">No products found.</p>
                ) : (
                  <div className="flex gap-4 max-sm:flex-wrap">
                    {products?.map((product) => {
                      if (product?.variants?.length == 0) return null;
                      return (
                        <Link
                          href={`/productDetail/${product.slug}`}
                          key={product._id}
                        >
                          <div className="border-2 cursor-pointer p-2 rounded-md flex gap-2 border-gray-200">
                            <Image
                              src={getImageUrl(product?.thumbnail || product?.images?.[0]) || "/Image-not-found.png"}
                              alt={
                                product?.thumbnail?.alt ||
                                product?.images?.[0]?.alt ||
                                "Product Image"
                              }
                              width={100}
                              height={60}
                              className="w-24 h-16 max-sm:w-20 max-sm:h-14 object-cover rounded-md"
                            />


                            <div>
                              <h3 className="text-gray-800 w-20 text-xs font-medium">
                                {product?.name}
                              </h3>
                              {product?.variants?.[0]?.salePrice ? (
                                <p className="text-gray-600 text-xs">
                                  RS{" "}
                                  <span className="font-semibold text-gray-800">
                                    {product?.variants?.[0]?.salePrice}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-gray-600 text-xs">
                                  RS{" "}
                                  <span className="font-semibold text-gray-800">
                                    {product?.variants?.[0]?.price}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CartSidebar />
    </>
  );
}
