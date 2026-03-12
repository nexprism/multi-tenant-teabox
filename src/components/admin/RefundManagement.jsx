'use client';

import React, { useState, useEffect } from 'react';
import {
    Package,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    AlertTriangle,
    Eye,
    Filter,
    Download,
} from 'lucide-react';

const RefundManagement = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchReturnRequests();
    }, [filter]);

    const fetchReturnRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders/refund?status=${filter}`);
            const data = await response.json();
            if (data.success) {
                setReturnRequests(data.data);
            }
        } catch (error) {
            console.error('Error fetching return requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReturn = async (orderId, refundAmount) => {
        if (!confirm('Are you sure you want to approve this return request?')) return;

        try {
            setProcessing(true);
            const response = await fetch('/api/orders/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'approve',
                    refund_amount: refundAmount,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchReturnRequests();
                setShowModal(false);
            } else {
                alert(data.message || 'Failed to approve return');
            }
        } catch (error) {
            console.error('Error approving return:', error);
            alert('Failed to approve return');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectReturn = async (orderId, reason) => {
        if (!confirm('Are you sure you want to reject this return request?')) return;

        try {
            setProcessing(true);
            const response = await fetch('/api/orders/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'reject',
                    refund_notes: reason,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchReturnRequests();
                setShowModal(false);
            } else {
                alert(data.message || 'Failed to reject return');
            }
        } catch (error) {
            console.error('Error rejecting return:', error);
            alert('Failed to reject return');
        } finally {
            setProcessing(false);
        }
    };

    const handleProcessRefund = async (orderId, transactionId, method) => {
        if (!transactionId) {
            alert('Please enter transaction ID');
            return;
        }

        try {
            setProcessing(true);
            const response = await fetch('/api/orders/refund', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    refund_transaction_id: transactionId,
                    refund_method: method,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchReturnRequests();
                setShowModal(false);
            } else {
                alert(data.message || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            alert('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            requested: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Requested' },
            approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
        };
        const badge = badges[status] || badges.requested;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const getRefundStatusBadge = (status) => {
        const badges = {
            none: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Not Started' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
        };
        const badge = badges[status] || badges.none;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const OrderDetailsModal = ({ order, onClose }) => {
        const [transactionId, setTransactionId] = useState('');
        const [refundMethod, setRefundMethod] = useState('bank_transfer');
        const [rejectReason, setRejectReason] = useState('');

        if (!order) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between sticky top-0">
                        <h2 className="text-2xl font-bold text-white">Return Request Details</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Order ID</p>
                                <p className="font-semibold">{order._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p className="font-semibold">{order.user?.name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{order.user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Order Total</p>
                                <p className="font-semibold text-lg">₹{order.total}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Payment Mode</p>
                                <p className="font-semibold">{order.paymentMode}</p>
                            </div>
                        </div>

                        {/* Return Details */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-bold mb-3">Return Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Return Status</p>
                                    {getStatusBadge(order.return_details?.return_status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Refund Status</p>
                                    {getRefundStatusBadge(order.return_details?.refund_status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Return Reason</p>
                                    <p className="font-medium">{order.return_details?.return_reason}</p>
                                </div>
                                {order.return_details?.return_comments && (
                                    <div>
                                        <p className="text-sm text-gray-600">Customer Comments</p>
                                        <p className="text-gray-700">{order.return_details.return_comments}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Requested At</p>
                                    <p className="font-medium">
                                        {new Date(order.return_details?.return_requested_at).toLocaleString()}
                                    </p>
                                </div>
                                {order.return_details?.refund_deadline && (
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Deadline</p>
                                        <p className="font-medium text-red-600">
                                            {new Date(order.return_details.refund_deadline).toLocaleDateString()}
                                            {order.return_details.days_remaining !== null && (
                                                <span className="ml-2 text-sm">
                                                    ({order.return_details.days_remaining} days remaining)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Details */}
                        {order.return_details?.bank_details?.account_number && (
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-bold mb-3">Customer Bank Details</h3>
                                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Account Holder</p>
                                        <p className="font-medium">{order.return_details.bank_details.account_holder_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Account Number</p>
                                        <p className="font-medium">{order.return_details.bank_details.account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">IFSC Code</p>
                                        <p className="font-medium">{order.return_details.bank_details.ifsc_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Bank Name</p>
                                        <p className="font-medium">{order.return_details.bank_details.bank_name}</p>
                                    </div>
                                    {order.return_details.bank_details.upi_id && (
                                        <div>
                                            <p className="text-sm text-gray-600">UPI ID</p>
                                            <p className="font-medium">{order.return_details.bank_details.upi_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="border-t pt-4">
                            {order.return_details?.return_status === 'requested' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">Actions</h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApproveReturn(order._id, order.total)}
                                            disabled={processing}
                                            className="flex-1 px-6 py-3 greenOne text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                                        >
                                            <CheckCircle className="inline mr-2" size={18} />
                                            Approve Return
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Enter rejection reason:');
                                                if (reason) handleRejectReturn(order._id, reason);
                                            }}
                                            disabled={processing}
                                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                                        >
                                            <XCircle className="inline mr-2" size={18} />
                                            Reject Return
                                        </button>
                                    </div>
                                </div>
                            )}

                            {order.return_details?.return_status === 'approved' &&
                                order.return_details?.refund_status !== 'completed' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold">Process Refund</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Refund Method
                                                </label>
                                                <select
                                                    value={refundMethod}
                                                    onChange={(e) => setRefundMethod(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="original_payment">Original Payment Method</option>
                                                    <option value="wallet">Wallet</option>
                                                    <option value="store_credit">Store Credit</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Transaction ID / Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    placeholder="Enter transaction ID"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleProcessRefund(order._id, transactionId, refundMethod)}
                                                disabled={processing || !transactionId}
                                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                            >
                                                <DollarSign className="inline mr-2" size={18} />
                                                Complete Refund (₹{order.return_details?.refund_amount || order.total})
                                            </button>
                                        </div>
                                    </div>
                                )}

                            {order.return_details?.refund_status === 'completed' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-800 font-medium flex items-center">
                                        <CheckCircle className="mr-2" size={20} />
                                        Refund Completed
                                    </p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Transaction ID: {order.return_details?.refund_transaction_id}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Completed on: {new Date(order.return_details?.refund_completed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <RefreshCw className="text-white" size={24} />
                                </div>
                                Return & Refund Management
                            </h1>
                            <p className="text-gray-600 mt-1">Process returns and refunds within 7 days</p>
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <Filter size={20} className="text-gray-600" />
                        <div className="flex gap-2">
                            {['all', 'requested', 'approved', 'completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Return Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Refund Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : returnRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            No return requests found
                                        </td>
                                    </tr>
                                ) : (
                                    returnRequests.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-sm">{order._id.slice(-8)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{order.user?.name}</p>
                                                <p className="text-sm text-gray-500">{order.user?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-lg">₹{order.total}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(order.return_details?.return_status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRefundStatusBadge(order.return_details?.refund_status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.return_details?.refund_deadline ? (
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {new Date(order.return_details.refund_deadline).toLocaleDateString()}
                                                        </p>
                                                        {order.return_details.days_remaining !== null && (
                                                            <p
                                                                className={`text-xs ${order.return_details.days_remaining <= 2
                                                                        ? 'text-red-600 font-semibold'
                                                                        : 'text-gray-500'
                                                                    }`}
                                                            >
                                                                {order.return_details.days_remaining} days left
                                                                {order.return_details.days_remaining <= 2 && (
                                                                    <AlertTriangle className="inline ml-1" size={14} />
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setShowModal(false)} />
            )}
        </div>
    );
};

export default RefundManagement;
