"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Package, ShoppingBag, Home, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import leaf from "../../../public/images/leaf.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "../store/slices/orderSlice";

const OrderSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderStatus = searchParams.get("Order_status");
  const queryOrderId = searchParams.get("orderId");
  const { currentOrder, loading: orderLoading } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (queryOrderId) {
      dispatch(fetchOrderById(queryOrderId));
    }
  }, [queryOrderId, dispatch]);

  // No longer redirecting to home page as per user request
  useEffect(() => {
    if (!orderStatus || orderStatus !== "success") {
      // Stay on page or handle error differently
    }
  }, [orderStatus, router]);

  if (!orderStatus || orderStatus !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Order Information Found</h2>
          <Link href="/search">
            <button className="bg-[#3C950D] text-white px-6 py-2 rounded-full font-semibold">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Leaf Images - Following your design pattern */}
      <div className="absolute -left-30 md:-left-50 top-1/4 transform -translate-y-1/2 z-0 opacity-20">
        <Image
          className="w-[40vh] md:w-[60vh] rotate-[210deg] max-h-[600px]"
          src={leaf}
          alt="Leaf"
          width="auto"
          height="auto"
        />
      </div>

      <div className="absolute -right-50 top-3/4 transform -translate-y-1/2 z-0 opacity-20">
        <Image
          className="w-[60vh] -rotate-[40deg] max-h-[600px]"
          src={leaf}
          alt="Leaf"
          width="auto"
          height="auto"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Success Icon and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-800 leading-tight mb-4">
            Order Placed Successfully!
          </h1>



          <p className="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
            Thank you for your order! We've received your order and will begin processing it shortly.
            You'll receive a confirmation email with your order details.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-[#F1FAEE] border-2 border-gray-200 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-[#3C950D]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="text-xl font-bold text-gray-800">{currentOrder?._id || queryOrderId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-lg font-semibold text-[#3C950D] capitalize">{currentOrder?.status || "Processing"}</p>
            </div>
          </div>

          {currentOrder && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#3C950D]" />
                Order Summary
              </h3>
              <div className="space-y-4 mb-6">
                {currentOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded border border-gray-100 flex-shrink-0 flex items-center justify-center font-bold text-gray-400">
                        {item.quantity}x
                      </div>
                      <span
                        className="text-gray-700 font-medium"
                        dangerouslySetInnerHTML={{ __html: item.product?.name || "Product" }}
                      />
                    </div>
                    <span className="text-gray-900 font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">₹{(currentOrder.total - (currentOrder.shippingCharge || 0)).toFixed(2)}</span>
                </div>
                {currentOrder.shippingCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-800">₹{currentOrder.shippingCharge}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-800">Total Amount</span>
                  <span className="text-[#3C950D]">₹{currentOrder.total}</span>
                </div>
              </div>
            </div>
          )}

          {currentOrder?.shippingAddress && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Shipping Address</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">{currentOrder.shippingAddress.fullName}</p>
                <p>{currentOrder.shippingAddress.addressLine1}</p>
                {currentOrder.shippingAddress.addressLine2 && <p>{currentOrder.shippingAddress.addressLine2}</p>}
                <p>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.postalCode}</p>
                <p className="mt-2 flex items-center gap-2"><span className="text-xs uppercase font-bold px-2 py-0.5 bg-gray-200 rounded">Phone</span> {currentOrder.shippingAddress.phoneNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* What's Next Section */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What's Next?</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#3C950D] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Order Confirmation</h3>
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation with your order details shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#3C950D] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Order Processing</h3>
                <p className="text-sm text-gray-600">
                  We'll carefully prepare your items for shipment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#3C950D] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Shipping Updates</h3>
                <p className="text-sm text-gray-600">
                  Track your order status and get real-time shipping updates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#3C950D] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Delivery</h3>
                <p className="text-sm text-gray-600">
                  Your order will be delivered to your doorstep within 3-5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/my-orders" className="flex-1 sm:flex-initial">
            <button className="w-full bg-[#3C950D] hover:bg-green-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
              <Package className="w-5 h-5" />
              View My Orders
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          <Link href="/search" className="flex-1 sm:flex-initial">
            <button className="w-full bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </button>
          </Link>

          <Link href="/" className="flex-1 sm:flex-initial">
            <button className="w-full bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-2">Need help with your order?</p>
          <Link href="/contact" className="text-[#3C950D] font-semibold hover:underline">
            Contact our support team
          </Link>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-green-300 rounded-full opacity-60"></div>
        <div className="absolute bottom-32 right-1/4 w-3 h-3 bg-yellow-300 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-300 rounded-full opacity-80"></div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
