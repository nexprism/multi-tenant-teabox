'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReturnRequestModal from '../../../components/orders/ReturnRequestModal';
import ReturnStatusCard from '../../../components/orders/ReturnStatusCard';
import { Package, RefreshCw, Truck, CheckCircle } from 'lucide-react';

export default function OrderDetailsPage() {
    const params = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [params.id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders/${params.id}`);
            const data = await response.json();
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            //console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const canRequestReturn = () => {
        if (!order) return false;

        // Check if order is eligible for return
        const eligibleStatuses = ['completed', 'shipped', "pending"];
        const hasReturnRequested = order.return_details?.is_return_requested;

        return eligibleStatuses.includes(order.status) && !hasReturnRequested;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: Package,
            paid: CheckCircle,
            shipped: Truck,
            completed: CheckCircle,
            return_requested: RefreshCw,
            returned: RefreshCw,
            refunded: CheckCircle,
        };
        return icons[status] || Package;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            return_requested: 'bg-orange-100 text-orange-800',
            returned: 'bg-orange-100 text-orange-800',
            refunded: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="mx-auto text-gray-400 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                    <p className="text-gray-600">The order you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(order.status);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                            <p className="text-gray-600 mt-1">Order ID: {order._id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusIcon size={20} />
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Return Button */}
                    {canRequestReturn() && (
                        <button
                            onClick={() => setShowReturnModal(true)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Request Return & Refund
                        </button>
                    )}
                </div>

                {/* Return Status Card */}
                <ReturnStatusCard order={order} />

                {/* Order Information */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Order Date</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(order.placedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Payment Mode</p>
                            <p className="font-semibold text-gray-900">{order.paymentMode}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="font-bold text-xl text-gray-900">₹{order.total}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Payment ID</p>
                            <p className="font-mono text-sm text-gray-900">{order.paymentId}</p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
                    <div className="space-y-4">
                        {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="text-gray-400" size={32} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Product #{index + 1}</p>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₹{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h2>
                    <div className="text-gray-700">
                        <p className="font-semibold">{order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.addressLine1}</p>
                        {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                        <p>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                        </p>
                        <p>{order.shippingAddress?.country}</p>
                        <p className="mt-2">Phone: {order.shippingAddress?.phoneNumber}</p>
                    </div>
                </div>
            </div>

            {/* Return Request Modal */}
            <ReturnRequestModal
                order={order}
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                onSuccess={fetchOrderDetails}
            />
        </div>
    );
}
