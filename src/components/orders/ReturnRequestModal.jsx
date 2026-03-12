'use client';

import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Package, DollarSign } from 'lucide-react';

const ReturnRequestModal = ({ order, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        return_reason: '',
        return_comments: '',
        return_images: [],
        bank_details: {
            account_holder_name: '',
            account_number: '',
            ifsc_code: '',
            bank_name: '',
            upi_id: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const returnReasons = [
        'Product damaged',
        'Wrong product delivered',
        'Product not as described',
        'Defective product',
        'Size/fit issue',
        'Changed mind',
        'Other',
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('bank_')) {
            const field = name.replace('bank_', '');
            setFormData({
                ...formData,
                bank_details: {
                    ...formData.bank_details,
                    [field]: value,
                },
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        // In production, upload to your server/cloud storage
        // For now, we'll use placeholder URLs
        const imageUrls = files.map((file) => URL.createObjectURL(file));
        setFormData({ ...formData, return_images: imageUrls });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.return_reason) {
            setError('Please select a return reason');
            return;
        }

        if (!formData.bank_details.account_holder_name || !formData.bank_details.account_number) {
            setError('Please provide bank details for refund');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/orders/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order._id,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                onSuccess?.();
                onClose();
            } else {
                setError(data.message || 'Failed to submit return request');
            }
        } catch (error) {
            setError('Failed to submit return request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between sticky top-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package size={24} />
                        Request Return
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Order Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Order ID</p>
                                <p className="font-semibold">{order._id?.slice(-8)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Order Total</p>
                                <p className="font-semibold text-lg">₹{order.total}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Order Date</p>
                                <p className="font-semibold">{new Date(order.placedAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Payment Mode</p>
                                <p className="font-semibold">{order.paymentMode}</p>
                            </div>
                        </div>
                    </div>

                    {/* Return Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Return Reason <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="return_reason"
                            value={formData.return_reason}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">Select a reason</option>
                            {returnReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                    {reason}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Additional Comments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Comments (Optional)
                        </label>
                        <textarea
                            name="return_comments"
                            value={formData.return_comments}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Please provide more details about the issue..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Images (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="return-images"
                            />
                            <label htmlFor="return-images" className="cursor-pointer">
                                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                <p className="text-sm text-gray-600">
                                    Click to upload product images
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG up to 5MB each
                                </p>
                            </label>
                            {formData.return_images.length > 0 && (
                                <p className="text-sm text-green-600 mt-2">
                                    {formData.return_images.length} image(s) selected
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-600" />
                            Bank Details for Refund
                        </h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                <AlertCircle className="inline mr-2" size={16} />
                                Your refund will be processed within 7 days of approval via bank transfer.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Account Holder Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_account_holder_name"
                                    value={formData.bank_details.account_holder_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter account holder name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_account_number"
                                    value={formData.bank_details.account_number}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter account number"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    IFSC Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_ifsc_code"
                                    value={formData.bank_details.ifsc_code}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., SBIN0001234"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bank Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_bank_name"
                                    value={formData.bank_details.bank_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., State Bank of India"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    UPI ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="bank_upi_id"
                                    value={formData.bank_details.upi_id}
                                    onChange={handleChange}
                                    placeholder="e.g., yourname@paytm"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Important:</h4>
                        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                            <li>Return requests are reviewed within 24 hours</li>
                            <li>Refunds are processed within 7 days of approval</li>
                            <li>Please ensure bank details are correct</li>
                            <li>You will receive email updates on your request status</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Return Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnRequestModal;
