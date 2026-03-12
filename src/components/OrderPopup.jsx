"use client";
import React, { Suspense, useEffect, useState } from "react";
import { CheckCircle, XCircle, X, ShoppingBag } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LoadingSpinner } from "./common/Loading";
import Link from "next/link";

const OrderPopup = () => {
  const searchParams = useSearchParams();
  const orderStatus = searchParams.get("Order_status");
  const router = useRouter();
  const pathname = usePathname();
  //console.log("Order Status:", orderStatus);

  const closePopup = () => {
    router.push('/');
  };

  const handleTryAgain = () => {
    // Add your retry logic here
    //console.log("Retrying order...");
    closePopup();
  };

  //   if (
  //     !orderStatus ||
  //     (orderStatus !== "success" && orderStatus !== "failure")
  //   ) {
  //     return null; // Don't render anything if no order status is provided
  //   }

  useEffect(() => {
    // This effect runs when the orderStatus changes
    //console.log("Order status changed:", orderStatus);
  }, [orderStatus, pathname, searchParams]);

  return (
    <div className="min-h-screen absolute  flex items-center justify-center p-4">
      {/* Demo Buttons */}

      {/* Success Popup */}
      {orderStatus === "success" && (
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative animate-scaleIn shadow-2xl">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Success Content */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h2>

              <p className="text-gray-600 mb-6">
                Your order has been confirmed and will be processed shortly.
                You'll receive a confirmation email soon.
              </p>

              <div className="space-y-3">
                <Link href="/search">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                    <ShoppingBag size={20} />
                    Explore More Products
                  </button>
                </Link>

                <button
                  onClick={closePopup}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure Popup */}
      {orderStatus === "failure" && (
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative animate-scaleIn shadow-2xl">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Failure Content */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Failed
              </h2>

              <p className="text-gray-600 mb-6">
                We couldn't process your order at this time. Please check your
                payment details and try again.
              </p>

              <div className="space-y-3">
                {/* <button
                  onClick={handleTryAgain}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Try Again
                </button> */}

                <button
                  onClick={closePopup}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const Popup = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderPopup />
    </Suspense>
  );
};

export default Popup;
