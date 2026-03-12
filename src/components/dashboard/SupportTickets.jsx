import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Plus,
  MessageCircle,
  Calendar,
  X,
  Send,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  createSupportTicket,
  resetTicketState,
  fetchCustomerTickets,
  addTicketReply,
} from "@/app/store/slices/supportTicketSlice";
import { fetchOrders } from "@/app/store/slices/orderSlice";
import { toast } from "react-toastify";

const SupportTickets = () => {
  const dispatch = useDispatch();
  const { loading, error, success, tickets = [], fetchLoading, replyLoading } =
    useSelector((state) => state.supportTicket);
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);

  // Get user data for customer field
  const { user } = useSelector((state) => state.auth || {});

  // Debug: Log user data
  // //console.log('Current user:', user);

  // Debug: Log orders data
  //console.log("Orders state:", orders);
  //console.log("Orders loading:", ordersLoading);
  //console.log("Orders error:", ordersError);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
    customer: "", // Will be set dynamically from user context
    orderId: "", // New field for order selection
    attachments: [],
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);

  // Effect to set customer ID when user data is available
  useEffect(() => {
    if (user?._id && ticketForm.customer !== user._id) {
      setTicketForm((prev) => ({
        ...prev,
        customer: user._id,
      }));
    }
  }, [user?._id, ticketForm.customer]);

  // Effect to fetch orders when component mounts
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchOrders({ page: 1 }));
    }
  }, [dispatch, user?._id]);

  // Effect to fetch customer tickets when component mounts
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchCustomerTickets()).then((result) => {
        // Debug: Log fetched tickets
        if (result.meta.requestStatus === 'fulfilled') {
          console.log('Tickets fetched successfully:', result.payload);
        } else {
          console.error('Failed to fetch tickets:', result.error);
        }
      });
    }
  }, [dispatch, user?._id]);

  // Effect to update selected ticket when tickets state changes
  useEffect(() => {
    if (selectedTicket && tickets && tickets.length > 0) {
      const updatedTicket = tickets.find(
        (ticket) => ticket._id === selectedTicket._id
      );
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets, selectedTicket]);

  const handleTicketSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Validation
    if (!ticketForm.subject.trim()) {
      alert("Please enter a subject for your ticket.");
      return;
    }

    if (!ticketForm.description.trim()) {
      alert("Please enter a description for your ticket.");
      return;
    }

    // Validate customer ID
    if (!user?._id) {
      alert("User authentication required. Please log in again.");
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("subject", ticketForm.subject);
      formData.append("description", ticketForm.description);
      formData.append("priority", ticketForm.priority);

      // Add customer ID (required field)
      formData.append("customer", user._id);

      // Add order ID if selected (backend expects 'order_id')
      if (ticketForm.orderId) {
        formData.append("order_id", ticketForm.orderId);
      }

      // Debug log to verify customer ID
      //console.log("Submitting ticket with customer ID:", user._id);
      //console.log("Selected order ID:", ticketForm.orderId);

      // Add attachments if any
      ticketForm.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      // Debug: Log all form data entries
      for (let [key, value] of formData.entries()) {
        //console.log(`${key}:`, value);
      }

      // Dispatch the API call
      const result = await dispatch(createSupportTicket(formData)).unwrap();

      // Close modal immediately
      setIsTicketModalOpen(false);

      // Reset form immediately
      setTicketForm({
        subject: "",
        description: "",
        priority: "medium",
        customer: user?._id || "",
        orderId: "",
        attachments: [],
      });

     
      setSelectedTicket(null);

      // Show success toast message
      toast.success(
        "Support ticket submitted. We'll get back to you within 24 hours. Thank you!",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Refresh tickets from API to get the latest data
      await dispatch(fetchCustomerTickets());

      // Reset Redux state
      setTimeout(() => {
        dispatch(resetTicketState());
      }, 3000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      
      // Extract detailed error message
      let errorMessage = "Failed to submit support ticket. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        // If there are validation errors, append them
        if (error.response.data.data && Array.isArray(error.response.data.data)) {
          const validationErrors = error.response.data.data
            .map(err => err.message || err.msg || JSON.stringify(err))
            .join(', ');
          errorMessage = `${errorMessage}: ${validationErrors}`;
        }
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      alert(
        `The following files are too large (max 10MB each): ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      return;
    }

    setTicketForm((prev) => ({
      ...prev,
      attachments: files,
    }));
  };

  const removeAttachment = (index) => {
    setTicketForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleReplyFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      alert(
        `The following files are too large (max 10MB each): ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      return;
    }

    setReplyAttachments(files);
  };

  const removeReplyAttachment = (index) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("message", replyMessage.trim());

      // Add attachments if any
      replyAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      // Debug: Log all form data entries
      for (let [key, value] of formData.entries()) {
        //console.log(`Reply ${key}:`, value);
      }

      // Dispatch the addTicketReply action
      await dispatch(
        addTicketReply({
          ticketId: selectedTicket._id,
          replyData: formData,
        })
      ).unwrap();

      // Show success message
      toast.success("Reply added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear the reply message and attachments
      setReplyMessage("");
      setReplyAttachments([]);

      // Refresh tickets to get updated data with populated fields
      await dispatch(fetchCustomerTickets());
    } catch (error) {
      //console.error("Error adding reply:", error);
      toast.error(error || "Failed to add reply. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertCircle size={16} />;
      case "in_progress":
        return <Clock size={16} />;
      case "resolved":
        return <CheckCircle size={16} />;
      case "closed":
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Helper function to get full attachment URL
  const getAttachmentURL = (relativePath) => {
    if (!relativePath) return "";
    // If it already starts with http, return as is
    if (relativePath.startsWith("http")) return relativePath;
    // Otherwise, construct the full URL
    return `${window.location.origin}${relativePath}`;
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileName) => {
    if (!fileName) return <FileText size={12} />;

    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "avif":
        return <Eye size={12} className="text-blue-600" />;
      case "pdf":
        return <FileText size={12} className="text-red-600" />;
      case "doc":
      case "docx":
        return <FileText size={12} className="text-blue-600" />;
      case "txt":
        return <FileText size={12} className="text-gray-600" />;
      default:
        return <FileText size={12} />;
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => {
                setSelectedTicket(null);
                setReplyMessage("");
                setReplyAttachments([]);
              }}
              className="text-red-600 hover:text-red-700 mb-2 text-sm"
            >
              ← Back to Tickets
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedTicket.subject}
            </h1>
            <div className="flex items-center space-x-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                  selectedTicket.status
                )}`}
              >
                {getStatusIcon(selectedTicket.status)}
                <span>
                  {selectedTicket.status.replace("_", " ").toUpperCase()}
                </span>
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  selectedTicket.priority
                )}`}
              >
                {selectedTicket.priority.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">
                Created{" "}
                {new Date(selectedTicket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Original Message */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {typeof selectedTicket.customer?.name === "string"
                  ? selectedTicket.customer.name.charAt(0).toUpperCase()
                  : "C"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">
                  {typeof selectedTicket.customer?.name === "string"
                    ? selectedTicket.customer.name
                    : "Customer"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{selectedTicket.description}</p>

              {/* Original Message Attachments */}
              {selectedTicket.attachments &&
                selectedTicket.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                      <FileText size={14} />
                      <span>
                        Attachments ({selectedTicket.attachments.length})
                      </span>
                    </p>
                    <div className="space-y-1">
                      {selectedTicket.attachments.map(
                        (attachment, attachIndex) => {
                          const fullURL = getAttachmentURL(attachment);
                          const fileName =
                            attachment.split("/").pop() ||
                            `Attachment ${attachIndex + 1}`;
                          return (
                            <div key={attachIndex}>
                              <a
                                href={fullURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center space-x-2 hover:bg-blue-50 p-1 rounded transition-colors"
                              >
                                {getFileTypeIcon(fileName)}
                                <span>{fileName}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  View
                                </span>
                              </a>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          {selectedTicket.replies.map((reply) => (
            <div key={reply._id} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedTicket.customer._id !== reply.repliedBy._id
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}
                >
                  <span
                    className={`font-medium text-sm ${
                      selectedTicket.customer._id !== reply.repliedBy._id
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {selectedTicket.customer._id == reply.repliedBy._id
                      ? "S"
                      : "A"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {typeof reply.repliedBy === "object" &&
                      typeof reply.repliedBy?.name === "string"
                        ? reply.repliedBy.name
                        : typeof reply.repliedBy === "string"
                        ? reply.repliedBy
                        : "Customer"}
                    </span>
                    {selectedTicket.customer._id !== reply.repliedBy._id && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Support
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {new Date(reply.repliedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{reply.message}</p>

                  {/* Reply Attachments */}
                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                        <FileText size={14} />
                        <span>Attachments ({reply.attachments.length})</span>
                      </p>
                      <div className="space-y-1">
                        {reply.attachments.map((attachment, attachIndex) => {
                          const fullURL = getAttachmentURL(attachment);
                          const fileName =
                            attachment.split("/").pop() ||
                            `Attachment ${attachIndex + 1}`;
                          return (
                            <div key={attachIndex}>
                              <a
                                href={fullURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center space-x-2 hover:bg-blue-50 p-1 rounded transition-colors"
                              >
                                {getFileTypeIcon(fileName)}
                                <span>{fileName}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  View
                                </span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Related Order */}
        {selectedTicket.orderId && orders && orders.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Eye size={20} />
              <span>Related Order</span>
            </h3>
            {(() => {
              const relatedOrder = orders.find(
                (order) => order._id === selectedTicket.orderId
              );
              if (!relatedOrder)
                return (
                  <p className="text-gray-500">Order details not available.</p>
                );

              const firstItem = relatedOrder.items?.[0];
              const itemCount = relatedOrder.items?.length || 0;

              return (
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Order ID:</span>{" "}
                    {relatedOrder._id}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(relatedOrder.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Total:</span> $
                    {relatedOrder.total?.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Items:</span>{" "}
                    {firstItem?.variant?.title || "Unknown"}
                    {itemCount > 1 ? ` (+${itemCount - 1} more)` : ""}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Reply Form */}
        {selectedTicket.status !== "closed" && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Reply
            </h3>
            <div className="space-y-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                disabled={replyLoading}
                className="w-full px-3 py-2 border text-black placeholder:black/60 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:opacity-50"
                placeholder="Type your message here..."
                required
              />

              {/* Reply Attachments */}
              <div>
                <label
                  htmlFor="replyAttachments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  id="replyAttachments"
                  name="replyAttachments"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleReplyFileChange}
                  disabled={replyLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can upload multiple files (images, PDF, documents). Max
                  10MB per file.
                </p>

                {/* Display selected files */}
                {replyAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Selected files:
                    </p>
                    {replyAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 truncate block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeReplyAttachment(index)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          disabled={replyLoading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleReplySubmit}
                disabled={replyLoading || !replyMessage.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replyLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {!user?._id && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          Warning: User authentication required to create support tickets.
          Please ensure you are logged in.
        </div>
      )}
      {ordersLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
          Loading your orders...
        </div>
      )}
      {ordersError && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-md">
          Warning: Unable to load orders. You can still create a ticket, but
          order selection will not be available.
        </div>
      )}

      {/* Header */}
      <div className="flex max-sm:flex-col max-sm:gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Tickets
          </h1>
          <p className="text-gray-600">
            Manage your support requests and view responses
          </p>
        </div>
        <button
          onClick={() => setIsTicketModalOpen(true)}
          className="px-4 py-2 max-sm:w-full flex justify-center bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Raise a Ticket</span>
        </button>
      </div>

      {/* Tickets Loading and Error States */}
      {fetchLoading && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading your tickets...
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch your support tickets.
          </p>
        </div>
      )}

      {error && !fetchLoading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading tickets:</p>
          <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          <button
            onClick={() => dispatch(fetchCustomerTickets())}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      )}


      {/* Tickets List */}
      <div className="space-y-4">
        {!fetchLoading && !error && (!tickets || tickets.length === 0) ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t created any support tickets yet.
            </p>
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus size={16} />
              <span>Create Your First Ticket</span>
            </button>
          </div>
        ) : (
          !fetchLoading &&
          !error &&
          tickets &&
          Array.isArray(tickets) &&
          tickets.length > 0 &&
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ticket.subject}
                    </h3>
                    {/* Visual indicators */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <FileText size={12} className="mr-1" />
                        {ticket.attachments.length}
                      </span>
                    )}
                    {ticket.orderId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <Eye size={12} className="mr-1" />
                        Order
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <div className="ml-4 flex flex-col space-y-2 items-end">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status.replace("_", " ").toUpperCase()}</span>
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle size={14} />
                    <span>{ticket.replies.length} replies</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setReplyMessage("");
                    setReplyAttachments([]);
                  }}
                  className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  title="View ticket details"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Support Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] pt-20 max-sm:pt-0 flex items-center justify-center">
          <div className="bg-white rounded-lg py-10 max-sm:max-h-screen max-sm:max-w-screen   p-6 w-full max-w-md mx-4 max-sm:mx-0 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Create Support Ticket
              </h2>
              <button
                onClick={() => {
                  setIsTicketModalOpen(false);
                  setTicketForm({
                    subject: "",
                    description: "",
                    priority: "medium",
                    customer: user?._id || "",
                    orderId: "",
                    attachments: [],
                  });
                  dispatch(resetTicketState());
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={ticketForm.subject}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={ticketForm.priority}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 text-black"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="orderId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Related Order (Optional)
                </label>
                <select
                  id="orderId"
                  name="orderId"
                  value={ticketForm.orderId}
                  onChange={handleInputChange}
                  disabled={loading || ordersLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 text-black"
                >
                  <option value="">Select an order (optional)</option>
                  {orders && orders.length > 0 ? (
                    orders.map((order) => {
                      // Get the first item's product name for display
                      const firstItem = order.items?.[0];
                      const productName = firstItem?.product?.name || "Unknown Product";
                      const variantName = firstItem?.variant?.name || "";
                      const displayName = variantName ? `${productName} (${variantName})` : productName;
                      const itemCount = order.items?.length || 0;
                      const orderDate = new Date(
                        order.createdAt
                      ).toLocaleDateString();
                      const totalAmount = order.total?.toFixed(2) || "0.00";

                      return (
                        <option key={order._id} value={order._id}>
                          {displayName}
                          {itemCount > 1 ? ` (+${itemCount - 1} more)` : ""} - ₹
                          {totalAmount} ({orderDate})
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      No orders found
                    </option>
                  )}
                </select>
                {ordersLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading orders...
                  </p>
                )}
                {ordersError && (
                  <p className="text-xs text-red-500 mt-1">
                    Error loading orders: {typeof ordersError === 'string' ? ordersError : ordersError?.message || 'Failed to load orders'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select an order if your ticket is related to a specific
                  purchase. This helps our support team assist you better.
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={ticketForm.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-50 text-black"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <div>
                <label
                  htmlFor="attachments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  id="attachments"
                  name="attachments"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can upload multiple files (images, PDF, documents). Max
                  10MB per file.
                </p>

                {/* Show selected files */}
                {ticketForm.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Selected files:
                    </p>
                    {ticketForm.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 truncate block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          disabled={loading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsTicketModalOpen(false);
                    setTicketForm({
                      subject: "",
                      description: "",
                      priority: "medium",
                      customer: user?._id || "",
                      orderId: "",
                      attachments: [],
                    });
                    dispatch(resetTicketState());
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTicketSubmit}
                  disabled={loading || !user?._id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : !user?._id ? (
                    <>
                      <span>User Required</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
