"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/app/store/slices/authSlice";

const UserDashboard = ({ isOpen, onClose, anchorEl }) => {
  const dropdownRef = useRef(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !anchorEl?.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />

      {/* Dashboard Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
        style={{
          animation: "slideDown 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Hello {user?.name || "User"}!
              </h3>
              <p className="text-green-100 text-sm">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Options */}
        <div className="p-4">
          <h4 className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-3">
            From your account dashboard you can view your{" "}
            <span className="text-red-400">recent orders</span>, manage your{" "}
            <span className="text-red-400">shipping and billing addresses</span>
            , and{" "}
            <span className="text-red-400">
              edit your password and account details
            </span>
          </h4>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Orders */}
            <Link
              href="/dashboard?tab=orders"
              onClick={onClose}
              className="group p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <ShoppingBag size={20} className="text-red-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">
                    Orders
                  </h5>
                  <p className="text-xs text-gray-600">
                    View and track your orders
                  </p>
                  <span className="inline-block text-xs text-red-500 font-medium mt-1 hover:underline">
                    View Orders
                  </span>
                </div>
              </div>
            </Link>

            {/* Addresses */}
            <Link
              href="/dashboard?tab=addresses"
              onClick={onClose}
              className="group p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <MapPin size={20} className="text-red-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">
                    Addresses
                  </h5>
                  <p className="text-xs text-gray-600">Manage your addresses</p>
                  <span className="inline-block text-xs text-red-500 font-medium mt-1 hover:underline">
                    Manage Addresses
                  </span>
                </div>
              </div>
            </Link>

            {/* Wishlist */}
            <Link
              href="/dashboard?tab=wishlist"
              onClick={onClose}
              className="group p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Heart size={20} className="text-red-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">
                    Wishlist
                  </h5>
                  <p className="text-xs text-gray-600">View saved items</p>
                  <span className="inline-block text-xs text-red-500 font-medium mt-1 hover:underline">
                    View Wishlist
                  </span>
                </div>
              </div>
            </Link>

            {/* Account Details */}
            <Link
              href="/dashboard?tab=account-details"
              onClick={onClose}
              className="group p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Settings size={20} className="text-red-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">
                    Account Details
                  </h5>
                  <p className="text-xs text-gray-600">
                    View and track your details
                  </p>
                  <span className="inline-block text-xs text-red-500 font-medium mt-1 hover:underline">
                    Edit Details
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default UserDashboard;
