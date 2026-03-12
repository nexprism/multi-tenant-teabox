import {
  fetchFrequentlyPurchasedProducts,
  selectSelectedProduct,
} from "@/app/store/slices/productSlice";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { getImageUrl } from "@/app/utils/imageHelper";
import {
  addToWishlist,
  removeFromWishlist,
  selectWishlistItems,
  fetchWishlist,
} from "@/app/store/slices/wishlistSlice";
import { toast } from "react-toastify";

export default function RenderSliderVariant() {
  const [products, setProducts] = useState<any[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const selectedProducts = useSelector(selectSelectedProduct);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );
  const userId = useSelector((state: any) => state.auth.user?._id);
  const { redirectToLogin } = useAuthRedirect();
  const wishlistItems = useSelector((state: any) => selectWishlistItems(state));

  const scrollLeft = () => {
    const container = document.getElementById("products-slider");
    if (!container) return;
    container.scrollBy({ left: -container.clientWidth, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = document.getElementById("products-slider");
    if (!container) return;
    container.scrollBy({ left: container.clientWidth, behavior: "smooth" });
  };

  const fetchProducts = async () => {
    try {
      const res: any = await dispatch(
        // @ts-ignore - thunk dispatch typing in this file
        fetchFrequentlyPurchasedProducts({
          frequentlyPurchased: true,
          limit: 20,
        })
      );
      console.log("frequently purchased products ====> ", res);
      if (res?.meta?.requestStatus === "fulfilled") {
        const prods = res?.payload?.products || res?.payload || [];
        setProducts(Array.isArray(prods) ? prods : []);
        if (userId) {
          const initial = new Set<string>(
            prods
              .filter(
                (p: any) =>
                  Array.isArray(p.wishlist) && p.wishlist.includes(userId)
              )
              .map((p: any) => String(p._id))
          );
          setWishlistedIds(initial);
        }
      } else {
        // Silently handle error - don't break the page
        console.warn("Failed to fetch frequently purchased products", res?.error || res);
        setProducts([]); // Set empty array to prevent rendering issues
      }
    } catch (err) {
      // Silently handle error - don't break the page
      console.warn("fetchProducts error", err);
      setProducts([]); // Set empty array to prevent rendering issues
    }
  };

  useEffect(() => {
    fetchProducts();
    // ensure wishlist is loaded so hearts reflect server state
    if (isAuthenticated) dispatch(fetchWishlist());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // sync wishlisted ids when products or user wishlist change
  useEffect(() => {
    if (
      !userId &&
      (!Array.isArray(wishlistItems) || wishlistItems.length === 0)
    )
      return;
    const fromProducts = new Set<string>(
      products
        .filter(
          (p: any) => Array.isArray(p.wishlist) && p.wishlist.includes(userId)
        )
        .map((p: any) => String(p._id))
    );
    const fromGlobal = new Set<string>(
      (Array.isArray(wishlistItems) ? wishlistItems : []).map((it: any) =>
        String(it.product?._id || it.productId || it._id)
      )
    );
    const merged = new Set<string>([...fromProducts, ...fromGlobal]);
    setWishlistedIds(merged);
  }, [products, wishlistItems, userId]);

  const toggleWishlist = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    const id = String(product._id);
    const currently = wishlistedIds.has(id);

    if (!currently) {
      // optimistic add
      setWishlistedIds((prev) => new Set(prev).add(id));
      try {
        // @ts-ignore
        const resultAction: any = await dispatch(
          addToWishlist({
            product: product._id,
            variant: product?.variants?.[0]?._id,
          })
        );
        console.log("addToWishlist result:", resultAction);
        if (resultAction?.meta?.requestStatus === "fulfilled") {
          toast.success("Added to wishlist");
          // refresh global wishlist
          // @ts-ignore
          dispatch(fetchWishlist());
        } else {
          throw (
            resultAction?.payload ||
            resultAction?.error ||
            new Error("Add to wishlist failed")
          );
        }
      } catch (err) {
        console.error("addToWishlist error:", err);
        setWishlistedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        toast.error("Failed to add to wishlist");
      }
    } else {
      // optimistic remove
      setWishlistedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      try {
        // @ts-ignore
        const resultAction: any = await dispatch(
          removeFromWishlist({
            productId: product._id,
            variantId: product?.variants?.[0]?._id,
          })
        );
        console.log("removeFromWishlist result:", resultAction);
        if (resultAction?.meta?.requestStatus === "fulfilled") {
          toast.success("Removed from wishlist");
          // refresh global wishlist
          // @ts-ignore
          dispatch(fetchWishlist());
        } else {
          throw (
            resultAction?.payload ||
            resultAction?.error ||
            new Error("Remove from wishlist failed")
          );
        }
      } catch (err) {
        console.error("removeFromWishlist error:", err);
        setWishlistedIds((prev) => new Set(prev).add(id));
        toast.error("Failed to remove from wishlist");
      }
    }
  };

  const StarRating = ({
    rating,
    reviews,
  }: {
    rating: number;
    reviews: number;
  }) => (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < rating ? "fill-green-500 text-green-500" : "text-gray-300"
              }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1">{reviews} Reviews</span>
    </div>
  );

  return (
    <div className="px-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl text-black mb-4 md:mb-0 text-center font-black">
          Frequently Purchased
        </h1>
        <p className="text-black lg:max-w-[80%] mx-auto text-center relative poppins-medium leading-tight text-lg mb-8">
          Customers who bought this item also loved these.{" "}
          <span className="text font-semibold">Explore our top picks</span> and
          find the perfect addition to your collection.
        </p>
      </div>

      {/* Products Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        <div
          id="products-slider"
          className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
          aria-label="Frequently purchased products"
        >
          <div className="flex gap-3 pb-4 max-w-full">
            {products?.length > 0 ? (
              products.map((product) => {
                if (product._id === selectedProducts?._id) return null;
                const imgSrc =
                  product?.thumbnail?.url || product?.images?.[0]?.url || product?.thumbnail || product?.images?.[0];

                return (
                  <div
                    key={product._id}
                    className="bg-white flex-shrink-0 snap-start w-full sm:w-52 min-h-[16rem] h-auto px-1 relative"
                  >
                    {/* Heart button positioned above the image but outside the Link to avoid navigation */}
                    <div className="absolute right-2 top-2 z-20">
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, product)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
                        aria-label="Toggle wishlist"
                      >
                        <Heart
                          size={16}
                          fill={
                            wishlistedIds.has(String(product._id))
                              ? "currentColor"
                              : "none"
                          }
                          className={
                            wishlistedIds.has(String(product._id))
                              ? "text-red-500"
                              : "text-gray-400"
                          }
                        />
                      </button>
                    </div>

                    <Link href={`/productDetail/${product.slug}`}>
                      <div>
                        {/* Product Image */}
                        <div className="relative bg-gray-400 rounded-lg aspect-square mb-4">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageUrl(imgSrc)}
                              alt={
                                (typeof product?.thumbnail === 'object' ? product?.thumbnail?.alt : null) ||
                                (typeof product?.images?.[0] === 'object' ? product?.images?.[0]?.alt : null) ||
                                "Product"
                              }
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : null}

                          {/* Out of Stock Badge */}
                          {product.outOfStock && (
                            <div className="absolute top-3 left-3">
                              <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                OUT OF STOCK
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div>
                          <h3 className="font-medium poppins text-black mb-2">
                            {product.name}
                          </h3>
                          {product?.reviews > 0 && (
                            <StarRating
                              rating={product.rating}
                              reviews={product.reviews}
                            />
                          )}
                          <div className="text-lg poppins-medium font-bold text-black">
                            <span className="mr-2">Rs</span>
                            {product.variants?.[0]?.salePrice ||
                              product.variants?.[0]?.price ||
                              200}
                            {product.variants?.[0]?.salePrice && (
                              <span className="line-through ml-2 text-gray-500">
                                <span className="mr-2">Rs</span>{product.variants?.[0]?.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                <p>No frequently purchased products available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
