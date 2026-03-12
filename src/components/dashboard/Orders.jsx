"use client";

import React, { Suspense, use, useEffect, useState } from "react";
import {
  Package,
  Calendar,
  Eye,
  Download,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ArrowLeft,
  Share2,
  MapPin,
  Phone,
  CreditCard,
  Mail,
  Star,
  ChevronLeft,
  ChevronRight,
  Cross,
  Plus,
  Clipboard,
  RefreshCw,
} from "lucide-react";
import { fetchOrderById, fetchOrders, cancelOrder } from "@/app/store/slices/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { useRouter, useSearchParams } from "next/navigation";
import { addReview, fetchProducts } from "@/app/store/slices/productSlice";
import { LoadingSpinner } from "../common/Loading";
import Link from "next/link";
import { toast } from "react-toastify";
import ReturnRequestModal from "../orders/ReturnRequestModal";
import ReturnStatusCard from "../orders/ReturnStatusCard";
import { getImageUrl } from "@/app/utils/imageHelper";

const Orders = () => {
  const { orders, loading, currentOrder } = useSelector((state) => state.order);
  const { products } = useSelector((state) => state.product);
  const [reviewPopup, setReviewPopup] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const settings = useSelector((state) => state.setting?.settings);
  const contactEmail = settings?.tenantInfo?.email || "support@example.com";
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewLLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const canRequestReturn = () => {
    if (!currentOrder) return false;
    const eligibleStatuses = ['Pending', 'delivered', "pending"];
    const hasReturnRequested = currentOrder.return_details?.is_return_requested;
    return eligibleStatuses.includes(currentOrder.status) && !hasReturnRequested;
  };

  const canCancelOrder = () => {
    if (!currentOrder) return false;
    const eligibleStatuses = ['pending', 'processing','confirmed'];
    return eligibleStatuses.includes(currentOrder.status);
  };

  const handleCancelOrder = async () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      await dispatch(cancelOrder(currentOrder._id));
    }
  };

  const fetchOrderDetails = () => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.size <= 2 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setReviewError("All images must be less than 2MB");
      return;
    }
    setReviewImage(validFiles);
    setReviewError("");
  };

  const handleImageRemove = (index) => {
    setReviewImage((prev) => prev.filter((_, i) => i !== index));
  };

  const filePreviews = (file) => {
    return URL.createObjectURL(file);
  };

  const handleClick = (orderId) => {
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?orderId=${orderId}`);
  };

  const openInvoice = (url, doPrint = false) => {
    if (!url) return;
    const href = getInvoiceHref(url);
    const win = window.open(href, "invoiceWindow");
    if (!win) return;
    try {
      win.focus();
    } catch (e) { }
    if (doPrint) {
      const tryPrint = () => {
        try {
          const ready = win.document && (win.document.readyState === "complete" || win.document.readyState === "interactive");
          if (ready) {
            win.print();
            return;
          }
        } catch (e) {
          // ignore cross-window access errors until ready
        }
        setTimeout(tryPrint, 200);
      };
      tryPrint();
    }
  };

  const getInvoiceHref = (url) => {
    try {
      if (!url) return url;
      // if url is already relative, return as-is
      if (url.startsWith("/")) return url;
      const parsed = new URL(url);
      // Use only the pathname so request is made against current origin
      return parsed.pathname + (parsed.search || "");
    } catch (e) {
      return url;
    }
  };

  const handleBackClick = () => {
    const currentPath = window.location.pathname;
    router.push(currentPath); // Remove the orderId parameter
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "paid":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "paid":
        return <CheckCircle size={16} />;
      case "shipped":
        return <Truck size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;

      default:
        return <Package size={16} />;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev - 1 + Math.ceil(products.length / 3)) %
        Math.ceil(products.length / 3)
    );
  };

  const handleReviewSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("comment", review);
      formData.append("productId", reviewProduct.product._id);
      if (reviewImage) {
        reviewImage.forEach((file, index) => {
          formData.append(`images[${index}]`, file);
        });
      }
      setReviewLoading(true);
      const response = await dispatch(addReview(formData));
      toast.success("Reviews submitted successfully");
      setReviewPopup(false);
      setReviewProduct(null);
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setReviewLoading(false);
      setRating(0);
      setReview("");
      setReviewImage([]);
      setReviewError("");
    }
  };

  useEffect(() => {
    // Fetch orders only once when user._id changes
    if (user?._id && orders?.length === 0) {
      dispatch(
        fetchOrders({
          userId: user._id,
        })
      );
    }
  }, [dispatch, user?._id, orders?.length]);

  useEffect(() => {
    // Only fetch order details if not already loaded
    if (orderId && (!currentOrder || currentOrder._id !== orderId)) {
      dispatch(fetchOrderById(orderId));
    }
  }, [orderId, dispatch, currentOrder]);

  useEffect(() => {
    // Only fetch products if not already loaded
    if (!products?.products || products.products.length === 0) {
      dispatch(
        fetchProducts({
          page: 1,
          limit: 6,
          sortBy: "createdAt",
        })
      );
    }
  }, [dispatch, products]);

  if (orderId) {
    return (
      <>
        {reviewPopup && (
          <div className="fixed inset-0 bg-gray-800/10 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
            {" "}
            <div className="bg-white border w-1/3 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 ">
                <h2 className="text-lg text-black font-semibold ">
                  Rate Your Purchase
                </h2>
                <div
                  onClick={() => {
                    setReviewPopup(false);
                    setReviewProduct(null);
                  }}
                  className=" rounded-md cursor-pointer flex justify-center items-center h-6 w-6 "
                >
                  <Plus className="rotate-45 h-5 w-5 text-black" />
                </div>
              </div>
              <div className="flex mb-2 items-start space-x-4 p-2 bg-gray-500/5 rounded-lg">
                <img
                  src={getImageUrl(
                    (typeof (reviewProduct?.product?.thumbnail || reviewProduct?.product?.images?.[0]) === 'string')
                      ? (reviewProduct?.product?.thumbnail || reviewProduct?.product?.images?.[0])
                      : (reviewProduct?.product?.thumbnail?.url || reviewProduct?.product?.images?.[0]?.url || "/placeholder.png")
                  )}
                  alt={reviewProduct?.product?.name}
                  className="w-16  h-16   object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {reviewProduct?.product?.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-2">
                    {reviewProduct?.variant?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Qty: {reviewProduct?.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{reviewProduct?.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    How was your experience with this product?
                  </p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  onChange={(e) => setReview(e.target.value)}
                  value={review}
                  rows="3"
                  placeholder="Share your feedback about this product..."
                  className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none h-24"
                />
                <div>
                  <label className="text-sm text-gray-600 mb-2">
                    upload an image (optional)
                  </label>
                  <input
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-1 px-4 py-1  block w-60 text-sm text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />

                  <div className="my-2 flex flex-wrap gap-2">
                    {reviewImage &&
                      reviewImage.map((file, index) => (
                        <div className="w-20 h-20 relative" key={index}>
                          <div
                            onClick={() => handleImageRemove(index)}
                            className="absolute top-2 right-2 rounded-md hover:bg-red-500/60 cursor-pointer flex justify-center items-center h-6 w-6 bg-red-500/50"
                          >
                            <Plus className="rotate-45 h-4 w-4" />
                          </div>
                          <img
                            key={index}
                            src={filePreviews(file)}
                            alt={`Review Image ${index + 1}`}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                  </div>
                </div>
                {reviewLLoading ? (
                  <button
                    disabled
                    className="greenOne mt-4 text-white px-6 py-2 pt-3 opacity-80  rounded-lg  transition-colors"
                  >
                    <Loading color="bg-white" scale="scale-75" />
                  </button>
                ) : (
                  <button
                    onClick={handleReviewSubmit}
                    className="greenOne mt-4 text-white px-6 py-2 rounded-lg hover:greenOne transition-colors"
                  >
                    Submit Review
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {currentOrder ? (
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackClick}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        Order Details
                      </h1>
                      <p className="text-sm text-gray-500">
                        Order #{currentOrder._id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {currentOrder?.invoiceUrl ? (
                      <>
                        <a
                          href={getInvoiceHref(currentOrder.invoiceUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-5 h-5 text-gray-600" />
                        </a>
                        <button
                          onClick={() => openInvoice(currentOrder.invoiceUrl, true)}
                          title="Open and Print"
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Print Invoice
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        title="Invoice not ready"
                        className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {console.log("check current order == > : ", currentOrder)}
              {(currentOrder?.shipping_details?.reference_number ||
                currentOrder?.shipping_details?.platform) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                      Shipping Details
                    </h2>

                    <div className="flex justify-between">
                      <div>
                        <div className="flex  items-center gap-2">
                          <h1 className="text-md font-semibold text-gray-900">
                            Shipping Number
                          </h1>
                          {currentOrder?.shipping_details?.reference_number && (
                            <Clipboard
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ref =
                                  currentOrder?.shipping_details
                                    ?.reference_number || "";
                                try {
                                  await navigator.clipboard.writeText(ref);
                                  // simple feedback; replace with your toast if available
                                  alert("Tracking number copied to clipboard");
                                } catch (err) {
                                  console.error("Copy failed", err);
                                  alert("Failed to copy tracking number");
                                }
                              }}
                              title="Copy tracking number"
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer inline-block ml-2"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {currentOrder?.shipping_details?.reference_number ||
                            "N/A"}
                        </p>
                      </div>

                      {currentOrder?.shipping_details?.platform === "dtdc" && (
                        <a
                          target="_blank"
                          href="https://www.dtdc.com/track-your-shipment/"
                          className="bg-blue-500 px-6 py-1 h-fit rounded-full font-medium text-white cursor-pointer"
                        >
                          Track here
                        </a>
                      )}

                      {currentOrder?.shipping_details?.platform ===
                        "bluedart" && (
                          <a
                            target="_blank"
                            href={currentOrder?.shipping_details?.tracking_url}
                            className="bg-blue-500 px-6 py-1 h-fit rounded-full font-medium text-white cursor-pointer"
                          >
                            Track here
                          </a>
                        )}

                      {currentOrder?.shipping_details?.platform ===
                        "delhivery" && (
                          <a
                            target="_blank"
                            href={currentOrder?.shipping_details?.tracking_url}
                            className="bg-blue-500 px-6 py-1 h-fit rounded-full font-medium text-white cursor-pointer"
                          >
                            Track here
                          </a>
                        )}
                    </div>
                  </div>
                )}

              {/* Return Status Card */}
              <ReturnStatusCard order={currentOrder} />

              {/* Return Request Button */}
              {canRequestReturn() && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Request Return & Refund
                  </button>
                </div>
              )}

              {/* Cancel Order Button */}
              {canCancelOrder() && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Cancel Order
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Status */}

                  {/* Items Ordered */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                      Items Ordered
                    </h2>
                    <div className="space-y-4">
                      {currentOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-4 bg-gray-500/5 rounded-lg"
                        >
                          <img
                            src={getImageUrl(
                              (typeof (item?.product?.thumbnail || item?.product?.images?.[0]) === 'string')
                                ? (item?.product?.thumbnail || item?.product?.images?.[0])
                                : (item?.product?.thumbnail?.url || item?.product?.images?.[0]?.url || "/placeholder.png")
                            )}
                            alt={item?.product?.name}
                            className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-medium text-gray-900 mb-1"
                              dangerouslySetInnerHTML={{ __html: item.product.name }}
                            />

                            {item.variant?.attributes && (
                              <div className="text-sm text-gray-500 mb-2">
                                {Array.isArray(item.variant.attributes)
                                  ? item.variant.attributes.map(attr => `${attr.name || attr.label || 'Attribute'}: ${attr.value || attr.option || JSON.stringify(attr)}`).join(", ")
                                  : Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${typeof v === 'object' ? v.value || v.name || JSON.stringify(v) : v}`).join(", ")
                                }
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Qty: {item.quantity}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ₹{item.price.toLocaleString()}
                              </span>
                            </div>

                            <div className="">
                              <button
                                onClick={() => {
                                  setReviewPopup(true);
                                  setReviewProduct(item);
                                }}
                                className="text-sm text-blue-500 hover:underline"
                              >
                                Add Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Order Status
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          currentOrder.status
                        )}`}
                      >
                        {currentOrder.status}
                      </span>
                    </div>

                    {/* Order Timeline */}
                    <div className="relative">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 greenOne rounded-full">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Order Placed
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(currentOrder.placedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 ml-4 h-8 w-0.5 bg-gray-200"></div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                          <Truck className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-500">
                            Expected Delivery
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(currentOrder.estimatedDelivery)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Billing Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900">
                          Shipping Address
                        </h3>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">
                          {currentOrder?.shippingAddress?.fullName}
                        </p>
                        <p>{currentOrder?.shippingAddress?.addressLine1}</p>
                        <p>{currentOrder?.shippingAddress?.addressLine2}</p>
                        <p>
                          {currentOrder?.shippingAddress?.city},{" "}
                          {currentOrder?.shippingAddress?.state}
                        </p>
                        <p>
                          ?{currentOrder?.shippingAddress?.postalCode},{" "}
                          {currentOrder?.shippingAddress?.country}
                        </p>
                        <div className="flex items-center space-x-1 pt-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {currentOrder?.shippingAddress?.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900">
                          Billing Address
                        </h3>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">
                          {currentOrder?.billingAddress?.fullName}
                        </p>
                        <p>{currentOrder?.billingAddress?.addressLine1}</p>
                        <p>{currentOrder?.billingAddress?.addressLine2}</p>
                        <p>
                          {currentOrder?.billingAddress?.city},{" "}
                          {currentOrder?.billingAddress?.state}
                        </p>
                        <p>
                          {currentOrder?.billingAddress?.postalCode},{" "}
                          {currentOrder?.billingAddress?.country}
                        </p>
                        <div className="flex items-center space-x-1 pt-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {currentOrder?.billingAddress?.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>₹{currentOrder.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Discount</span>
                        <span className="text-green-600">
                          -₹{currentOrder.discount}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-semibold text-lg text-gray-900">
                          <span>Total</span>
                          <span>₹{currentOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <span className="text-gray-600">
                          {currentOrder?.payment_method === "Prepaid"
                            ? " Online Payment"
                            : "Cash on Delivery"}
                        </span>
                      </div>
                      {currentOrder?.payment_method === "Prepaid" ? (
                        <div className="text-sm text-gray-500">
                          <p>Payment ID: {currentOrder.paymentId}</p>
                          <p className="mt-1">
                            Paid on {formatDate(currentOrder.placedAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <p>Payment to be made at delivery.</p>
                          <p className="mt-1">
                            Please keep the exact amount ready.
                          </p>
                        </div>
                      )}
                      <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        {currentOrder?.payment_method === "Prepaid" ? (
                          <p className="text-sm text-green-700">
                            Payment completed successfully.
                          </p>
                        ) : (
                          <p className="text-sm text-green-700">
                            Payment will be collected upon delivery.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Delivery Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-5 h-5 text-green-500" />
                        <span className="text-gray-600">Standard Delivery</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>
                          Expected delivery:{" "}
                          {formatDate(currentOrder.estimatedDelivery)}
                        </p>
                        <p className="mt-1">
                          Delivery between 9:00 AM - 7:00 PM
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* Help & Support */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <h3 className="font-semibold mb-3">Need Help?</h3>
                    <p className="text-green-50 text-sm mb-4">
                      Have questions about your order? Our customer support team
                      is here to help.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>+91- 9205963262</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{contactEmail}</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full bg-white text-green-600 py-2 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white text-black rounded-lg shadow-sm p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">You Might Also Like</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={prevSlide}
                      className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {Array.from({
                      length: Math.ceil(products?.products?.length / 3),
                    }).map((_, slideIndex) => (
                      <div
                        key={slideIndex}
                        className="flex space-x-4 min-w-full"
                      >
                        {products?.products
                          ?.slice(slideIndex * 3, slideIndex * 3 + 3)
                          .map((product) => (
                            <Link
                              key={product._id}
                              href={`/product-detail/${product.slug}`}
                            >
                              <div className="flex-1 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                {product?.thumbnail?.url ||
                                  product?.images?.[0]?.url ? (
                                  <img
                                    src={
                                      (typeof (product?.thumbnail || product?.images?.[0]) === 'string')
                                        ? (product?.thumbnail || product?.images?.[0])
                                        : (product?.thumbnail?.url || product?.images?.[0]?.url || "/placeholder.png")
                                    }
                                    alt={product?.name}
                                    className="w-full h-32 object-cover rounded-lg mb-3"
                                  />
                                ) : null}
                                <h3 className="font-medium text-sm text-gray-900 mb-1">
                                  {product?.name}
                                </h3>
                                <div className="flex items-center space-x-1 mb-2">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">
                                    {product?.rating}
                                  </span>
                                </div>
                                {product?.variants?.[0]?.salePrice ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{product?.variants?.[0]?.salePrice}
                                    </span>
                                    <span className="font-semibold line-through text-green-500 text-sm">
                                      ₹{product?.variants?.[0]?.price}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-green-500 text-sm">
                                      ₹{product?.variants?.[0]?.price}
                                    </span>
                                  </div>
                                )}
                                <button className="w-full mt-3 greenOne text-white text-sm py-2 rounded hover:greenOne transition-colors">
                                  View Product
                                </button>
                              </div>
                            </Link>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Return Request Modal */}
            <ReturnRequestModal
              order={currentOrder}
              isOpen={showReturnModal}
              onClose={() => setShowReturnModal(false)}
              onSuccess={fetchOrderDetails}
            />
          </div>
        ) : (
          <div>
            <Loading />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage your order history</p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex h-40 justify-center items-center">
          <Loading />
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t placed any orders yet.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders?.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order._id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span>{order.status.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="font-medium">
                        ₹{order.total.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Items:
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600">
                          {item?.product?.name} x{item?.quantity}
                        </span>
                        <span className="font-medium text-black">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Info */}
                {/* {order.trackingNumber && (
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Tracking Number: </span>
                    <span className="font-mono font-medium text-gray-900">
                      {order.trackingNumber}
                    </span>
                  </div>
                </div>
              )} */}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleClick(order._id)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  {order?.invoiceUrl ? (
                    <>
                      <a
                        href={order.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Download size={14} />
                        <span> Invoice</span>
                      </a>
                      <button
                        onClick={() => openInvoice(order.invoiceUrl, true)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        <span>Print</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      title="Invoice not available"
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-300 rounded-md transition-colors text-sm cursor-not-allowed"
                    >
                      <Download size={14} />
                      <span>Download Invoice</span>
                    </button>
                  )}
                  {order.status === "delivered" && (
                    <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
                      <span>Reorder</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const OrderPage = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Orders />
    </Suspense>
  );
};

export default OrderPage;
