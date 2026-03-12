"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  LogOut,
  User,
  FileText,
  Menu,
  X,
} from "lucide-react";

// Import dashboard components
import Dashboard from "../../components/dashboard/Dashboard";
import Orders from "../../components/dashboard/Orders";
import Addresses from "../../components/dashboard/Addresses";
import Wishlist from "../../components/dashboard/Wishlist";
import AccountDetails from "../../components/dashboard/AccountDetails";
import SupportTickets from "../../components/dashboard/SupportTickets";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/common/Loading";

export function SidebarDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeComponent, setActiveComponent] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth ?? {});

  // Get active tab from URL on component mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveComponent(tabFromUrl);
    }
    // Note: we intentionally don't remove the `tab` query param here.
    // Removing it on cleanup caused the UI to immediately replace the URL
    // and revert to the default dashboard view. Keeping the param lets
    // users land on a specific dashboard tab (e.g. ?tab=orders) without
    // it being removed automatically.
  }, [searchParams, router]);

  // Function to handle tab change and update URL
  const handleTabChange = (component) => {
    setActiveComponent(component);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("tab", component);
    router.replace(newUrl.pathname + newUrl.search);
  };

  const sidebarItems = [
    { icon: ShoppingBag, label: "Orders", component: "orders" },
    { icon: MapPin, label: "Addresses", component: "addresses" },
    { icon: Heart, label: "Wishlist", component: "wishlist" },
    { icon: Settings, label: "Account Details", component: "account-details" },
    { icon: FileText, label: "Support Ticket", component: "support-tickets" },
  ];

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "orders":
        return <Orders />;
      case "addresses":
        return <Addresses />;
      case "wishlist":
        return <Wishlist />;
      case "account-details":
        return <AccountDetails />;
      case "support-tickets":
        return <SupportTickets />;
      default:
        return <Dashboard user={user} />;
    }
  };

  const handleLogOut = async () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="p-6 pt-28 max-sm:pt-20">
      {/* User Profile */}
      <div className="flex flex-col gap-3 items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <User size={20} className="text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-center text-gray-900">
            {typeof user?.name === "string" && user?.name.trim() !== ""
              ? user.name
              : "User"}
          </h3>
          <p className="text-xs text-gray-500">
            {typeof user?.email === "string" && user?.email.trim() !== ""
              ? user.email
              : ""}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        <button
          onClick={() => handleTabChange("dashboard")}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-left ${
            activeComponent === "dashboard"
              ? "bg-green-100 text-green-600"
              : "text-gray-700 hover:bg-gray-100 hover:text-green-600"
          }`}
        >
          <User size={18} />
          <span className="font-medium">Dashboard</span>
        </button>

        {sidebarItems?.map((item, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(item?.component ?? "")}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-left ${
              activeComponent === item?.component
                ? "bg-green-100 text-green-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-green-600"
            }`}
          >
            {item?.icon ? <item.icon size={18} /> : null}
            <span className="font-medium">{item?.label ?? ""}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleLogOut}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors duration-200 w-full"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bg-white shadow-md z-50 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X size={24} className="text-gray-700" />
          ) : (
            <Menu size={24} className="text-gray-700" />
          )}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (fixed) and Mobile (dropdown) */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out
          w-64
          lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{renderActiveComponent()}</div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SidebarDashboard />
    </Suspense>
  );
}
