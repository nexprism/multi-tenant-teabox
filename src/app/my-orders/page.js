"use client";
import { useEffect, useState } from "react";
import { fetchOrders } from "../store/slices/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function YourOrders() {
  const [activeTab, setActiveTab] = useState("Orders");
  const { orders, loading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    // Fetch orders if user is available
    if (user?._id) {
      dispatch(
        fetchOrders({
          userId: user._id,
        })
      );
    }
  }, [dispatch, user]);

  const getFilteredOrders = () => {
    if (!orders) return [];
    switch (activeTab) {
      case "Orders":
        return orders;
      case "Buy Again":
        return orders.filter(o => o.status === "completed" || o.status === "shipped");
      case "Not Yet Shipped":
        return orders.filter(o => o.status === "pending" || o.status === "paid" || o.status === "confirmed");
      case "Cancelled orders":
        return orders.filter(o => o.status === "cancelled");
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  //   console.log("Orders:", orders);
  //  console.log("user is ==>", user);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-4">Your Orders</h1>

          {/* Filter Tabs */}
          <div className="flex gap-6 text-sm text-nowrap overflow-x-scroll mb-6">
            <button
              onClick={() => setActiveTab("Orders")}
              className={
                activeTab === "Orders"
                  ? "text-black font-medium border-b-2 border-black pb-1"
                  : "text-gray-500 hover:text-black"
              }
            >
              Orders
            </button>

            <button
              onClick={() => setActiveTab("Not Yet Shipped")}
              className={
                activeTab === "Not Yet Shipped"
                  ? "text-black font-medium border-b-2 border-black pb-1"
                  : "text-gray-500 hover:text-black"
              }
            >
              Not Yet Shipped
            </button>
            <button
              onClick={() => setActiveTab("Cancelled orders")}
              className={
                activeTab === "Cancelled orders"
                  ? "text-black font-medium border-b-2 border-black pb-1"
                  : "text-gray-500 hover:text-black"
              }
            >
              Cancelled orders
            </button>
          </div>

          {/* Orders Count */}
          <p className="text-sm text-black font-medium mb-6">
            {filteredOrders.length} orders found
          </p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">Loading your orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-gray-300">
              <p className="text-gray-500">No orders found in this category.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="border-2 rounded-lg border-gray-300 overflow-hidden">
                {/* Order Summary Bar */}
                <div className="bg-gray-100 p-4 flex flex-col md:flex-row gap-3 justify-between md:items-center">
                  <div className="flex gap-4 justify-between md:justify-start">
                    <div>
                      <div className="text-sm text-gray-600">Order Placed</div>
                      <div className="text-sm font-medium text-black">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-sm font-medium text-black">₹{order.total?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-start md:text-right">
                    <div className="text-sm text-gray-600">
                      Order ID <span className="text-xs font-mono ml-1">#{order._id}</span>
                    </div>
                    <div className="flex gap-4 justify-between md:justify-end mt-1">


                    </div>
                  </div>
                </div>

                {/* Product Card for Order Items */}
                <div className="p-6">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className={`flex gap-6 flex-col md:flex-row items-start ${idx > 0 ? "mt-6 pt-6 border-t border-gray-100" : ""}`}>
                      <div className="h-44 md:aspect-square md:max-w-44 w-full bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {item.product?.images?.[0] || item.product?.thumbnail ? (
                          <img
                            src={
                              typeof (item.product.images?.[0] || item.product.thumbnail) === 'string'
                                ? (item.product.images?.[0] || item.product.thumbnail)
                                : (item.product.images?.[0]?.url || item.product.thumbnail?.url || "/placeholder.png")
                            }
                            alt={
                              typeof (item.product.images?.[0] || item.product.thumbnail) === 'string'
                                ? item.product.name
                                : (item.product.images?.[0]?.alt || item.product.thumbnail?.alt || item.product.name)
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h2
                          className="text-lg font-semibold text-black mb-1"
                          dangerouslySetInnerHTML={{ __html: item.product?.name || "Product Name" }}
                        />
                        {item.variant?.attributes && (
                          <div className="text-xs text-gray-500 mb-2">
                            {Array.isArray(item.variant.attributes)
                              ? item.variant.attributes.map(attr => `${attr.name || attr.label || 'Attribute'}: ${attr.value || attr.option || JSON.stringify(attr)}`).join(", ")
                              : Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${typeof v === 'object' ? v.value || v.name || JSON.stringify(v) : v}`).join(", ")
                            }
                          </div>
                        )}
                        <div
                          className="text-xs text-gray-600 mb-4 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.product?.description || "No description available" }}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">Qty: {item.quantity}</span>

                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Delivery Info */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-200 text-xs text-gray-600">
                    <span className="capitalize font-medium text-[#3C950D]">Status: {order.status}</span>
                    <span>
                      Payment Mode: <span className="font-medium text-black">{order.paymentMode || "Prepaid"}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
