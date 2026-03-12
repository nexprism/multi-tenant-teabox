'use client';

import React from 'react';
import {
    Package,
    CheckCircle,
    Clock,
    XCircle,
    DollarSign,
    AlertCircle,
    Calendar
} from 'lucide-react';

const ReturnStatusCard = ({ order }) => {
    if (!order?.return_details?.is_return_requested) {
        return null;
    }

    const { return_details } = order;

    const getStatusInfo = () => {
        const statusMap = {
            requested: {
                icon: Clock,
                color: 'yellow',
                title: 'Return Requested',
                message: 'Your return request is under review. We will respond within 24 hours.',
            },
            approved: {
                icon: CheckCircle,
                color: 'blue',
                title: 'Return Approved',
                message: 'Your return has been approved. Refund will be processed within 7 days.',
            },
            rejected: {
                icon: XCircle,
                color: 'red',
                title: 'Return Rejected',
                message: 'Your return request has been rejected.',
            },
            completed: {
                icon: CheckCircle,
                color: 'green',
                title: 'Refund Completed',
                message: 'Your refund has been processed successfully.',
            },
        };

        return statusMap[return_details.return_status] || statusMap.requested;
    };

    const getRefundStatusInfo = () => {
        const statusMap = {
            none: { label: 'Not Started', color: 'gray' },
            pending: { label: 'Pending', color: 'yellow' },
            processing: { label: 'Processing', color: 'blue' },
            completed: { label: 'Completed', color: 'green' },
            failed: { label: 'Failed', color: 'red' },
        };

        return statusMap[return_details.refund_status] || statusMap.none;
    };

    const statusInfo = getStatusInfo();
    const refundInfo = getRefundStatusInfo();
    const StatusIcon = statusInfo.icon;

    const colorClasses = {
        yellow: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: 'text-yellow-600',
            badge: 'bg-yellow-100 text-yellow-800',
        },
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: 'text-blue-600',
            badge: 'bg-blue-100 text-blue-800',
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: 'text-green-600',
            badge: 'bg-green-100 text-green-800',
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: 'text-red-600',
            badge: 'bg-red-100 text-red-800',
        },
        gray: {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-800',
            icon: 'text-gray-600',
            badge: 'bg-gray-100 text-gray-800',
        },
    };

    const colors = colorClasses[statusInfo.color];

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-6 mb-6`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${colors.badge} rounded-lg flex items-center justify-center`}>
                        <StatusIcon className={colors.icon} size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${colors.text}`}>{statusInfo.title}</h3>
                        <p className={`text-sm ${colors.text} opacity-80`}>{statusInfo.message}</p>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Return Reason */}
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Return Reason</p>
                    <p className={`font-semibold ${colors.text}`}>{return_details.return_reason}</p>
                </div>

                {/* Refund Status */}
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Refund Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses[refundInfo.color].badge}`}>
                        {refundInfo.label}
                    </span>
                </div>

                {/* Requested Date */}
                {return_details.return_requested_at && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Requested On</p>
                        <p className={`font-semibold ${colors.text}`}>
                            {new Date(return_details.return_requested_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                )}

                {/* Refund Amount */}
                {return_details.refund_amount > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Refund Amount</p>
                        <p className={`font-bold text-lg ${colors.text}`}>₹{return_details.refund_amount}</p>
                    </div>
                )}

                {/* Refund Deadline */}
                {return_details.refund_deadline && return_details.return_status === 'approved' && (
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                            <Calendar className="text-blue-600" size={20} />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Refund Deadline</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(return_details.refund_deadline).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                    {return_details.days_remaining !== null && (
                                        <span className="ml-2 text-sm text-blue-600">
                                            ({return_details.days_remaining} days remaining)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction ID */}
                {return_details.refund_transaction_id && (
                    <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-600 mb-1">Transaction ID</p>
                        <p className="font-mono font-semibold text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                            {return_details.refund_transaction_id}
                        </p>
                    </div>
                )}

                {/* Refund Method */}
                {return_details.refund_method && return_details.refund_status !== 'none' && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Refund Method</p>
                        <p className={`font-semibold ${colors.text} capitalize`}>
                            {return_details.refund_method.replace(/_/g, ' ')}
                        </p>
                    </div>
                )}

                {/* Completion Date */}
                {return_details.refund_completed_at && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Refund Completed On</p>
                        <p className={`font-semibold ${colors.text}`}>
                            {new Date(return_details.refund_completed_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                )}
            </div>

            {/* Comments */}
            {return_details.return_comments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Your Comments</p>
                    <p className={`text-sm ${colors.text} italic`}>"{return_details.return_comments}"</p>
                </div>
            )}

            {/* Refund Notes (from admin) */}
            {return_details.refund_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Admin Notes</p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-700">{return_details.refund_notes}</p>
                    </div>
                </div>
            )}

            {/* Help Text */}
            {return_details.return_status === 'approved' && return_details.refund_status !== 'completed' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-blue-800">
                            Your refund is being processed. The amount will be credited to your bank account within the deadline mentioned above.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnStatusCard;
