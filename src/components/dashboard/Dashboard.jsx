import React from "react";
import Link from "next/link";
import { ShoppingBag, MapPin, Heart, Settings } from "lucide-react";

const DASHBOARD_CARDS = [
  {
    icon: ShoppingBag,
    title: "Orders",
    description: "View and track your orders",
    action: "View Orders",
    href: "/dashboard?tab=orders",
  },
  {
    icon: MapPin,
    title: "Addresses",
    description: "Manage your addresses",
    action: "Manage Addresses",
    href: "/dashboard?tab=addresses",
  },
  {
    icon: Heart,
    title: "Wishlist",
    description: "View saved items",
    action: "View Wishlist",
    href: "/dashboard?tab=wishlist",
  },
  {
    icon: Settings,
    title: "Account Details",
    description: "View and track your details",
    action: "Edit Details",
    href: "/dashboard?tab=account-details",
  },
];

const Dashboard = React.memo(({ user }) => {
  return (
    <>
      {/* Dashboard Content */}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Hello{" "}
          <span className="font-semibold text-gray-900">
            {typeof user?.name === "string" && user?.name.trim() !== ""
              ? user.name
              : "User"}
          </span>
          {user?.email ? (
            <span className="text-xs text-gray-500"> ({user.email})</span>
          ) : null}{" "}
          <Link href="/logout" className="text-green-500 hover:underline">
            Log out
          </Link>
        </p>
      </div>

      {/* Description */}
      <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
        <p className="text-gray-600 leading-relaxed">
          From your account dashboard you can view your{" "}
          <Link
            href="/dashboard?tab=orders"
            className="text-green-500 font-medium hover:underline"
          >
            recent orders
          </Link>
          , manage your{" "}
          <Link
            href="/dashboard?tab=addresses"
            className="text-green-500 font-medium hover:underline"
          >
            shipping and billing addresses
          </Link>
          , and{" "}
          <Link
            href="/dashboard?tab=account-details"
            className="text-green-500 font-medium hover:underline"
          >
            edit your password and account details
          </Link>
          .
        </p>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DASHBOARD_CARDS.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-green-200 transition-colors">
              {card.icon ? (
                <card.icon size={24} className="text-green-500" />
              ) : null}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{card.description}</p>
            <Link
              href={card.href}
              className="inline-block text-sm text-green-500 font-medium hover:underline"
            >
              {card.action}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
});

export default Dashboard;
