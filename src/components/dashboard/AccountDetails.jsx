import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Save,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchOrders } from "@/app/store/slices/orderSlice";
import { toast } from "react-toastify";
import {
  changePassword,
  updateUserProfile,
} from "@/app/store/slices/authSlice";

export function getYearsDifference(dateString) {
  const inputDate = new Date(dateString);
  const now = new Date();

  let yearsDiff = now.getFullYear() - inputDate.getFullYear();

  // Adjust if the current date hasn't reached the input date's month/day
  const hasNotReachedDate =
    now.getMonth() < inputDate.getMonth() ||
    (now.getMonth() === inputDate.getMonth() &&
      now.getDate() < inputDate.getDate());

  if (hasNotReachedDate) {
    yearsDiff--;
  }

  return yearsDiff;
}

const AccountDetails = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { orders } = useSelector((state) => state.order);
  //console.log("orders are ", orders);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [editForm, setEditForm] = useState({ ...user });

  const handleDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      // allow only digits and limit to 10 characters
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setEditForm((prev) => ({
        ...prev,
        phone: digits,
      }));
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    // if editing, validate phone number length
    if (isEditing) {
      const phoneVal = String(editForm?.phone || "").replace(/\D/g, "");
      if (phoneVal && phoneVal.length !== 10) {
        toast.error("Phone number must be 10 digits.");
        return;
      }
    }
    try {
      // use unwrap() so a rejected async thunk throws and is caught below
      await dispatch(
        updateUserProfile({
          id: user._id,
          data: {
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
          },
        })
      ).unwrap();
      setIsEditing(false);
      toast.success("Account details updated successfully!");
    } catch (error) {
      //console.log("Error updating account details:", error);
      const message =
        error?.payload?.message ||
        error?.message ||
        "Failed to update account details.";
      toast.error(message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }
    // TODO: API call to update password
    try {
      const response = await dispatch(
        changePassword({
          userId: user._id,
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      );
      if (response?.error) {
        return toast.error(response?.error?.payload?.message);
      }
      //console.log("Password change response:", response);
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      //console.error("Error changing password:", error);
      toast.error(error?.payload?.message);
    }
  };

  const cancelEdit = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    // Fetch orders when the component mounts
    if (user?._id) {
      dispatch(
        fetchOrders({
          userId: user._id,
        })
      );
    }
  }, [dispatch, user?._id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Account Details
        </h1>
        <p className="text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Personal Information */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className={`sm:!flex justify-between items-center mb-6 ${isEditing ? "block" : "flex"}`}>
            <h2 className="text-xl font-semibold text-gray-900">
              Personal Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2 sm:mt-0 mt-3">
                <button
                  onClick={cancelEdit}
                  className="w-1/2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="w-1/2 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveDetails}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={isEditing ? editForm?.name : user?.name}
                  onChange={handleDetailsChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    !isEditing ? "bg-gray-50 text-gray-600" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={isEditing ? editForm?.email : user?.email}
                  onChange={handleDetailsChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    !isEditing ? "bg-gray-50 text-gray-600" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={isEditing ? editForm?.phone : user?.phone}
                  onChange={handleDetailsChange}
                  disabled={!isEditing}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    !isEditing ? "bg-gray-50 text-gray-600" : ""
                  }`}
                />
              </div>

              {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-2" />
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={
                  isEditing ? editForm?.dateOfBirth : user?.dateOfBirth
                }
                onChange={handleDetailsChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  !isEditing ? "bg-gray-50 text-gray-600" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={isEditing ? editForm?.gender : user?.gender}
                onChange={handleDetailsChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  !isEditing ? "bg-gray-50 text-gray-600" : ""
                }`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div> */}
            </div>

            {/* Preferences */}
            {/* <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={
                      isEditing ? editForm?.newsletter : user?.newsletter
                    }
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    className="mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    Subscribe to newsletter and promotional emails
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={
                      isEditing ? editForm?.notifications : user?.notifications
                    }
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    className="mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    Receive notifications about orders and account updates
                  </label>
                </div>
              </div>
            </div> */}
          </form>
        </div>
      )}

      {/* Change Password */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock size={16} className="inline mr-2" />
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock size={16} className="inline mr-2" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock size={16} className="inline mr-2" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Password Requirements:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include at least one uppercase letter</li>
                <li>• Include at least one lowercase letter</li>
                <li>• Include at least one number</li>
                <li>• Include at least one special character</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Lock size={16} />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      )}

      {/* Account Statistics */}
      {/* {isAuthenticated && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Account Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {orders?.length > 0 ? orders?.length : 0}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                $2,459.87
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            {user.createdAt && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {getYearsDifference(user.createdAt)}
                </div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            )}
          </div>
        </div>
      )} */}

      {!isAuthenticated && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Please Log In
          </h2>
          <p className="text-sm text-gray-600">
            You need to be logged in to view your account details.
          </p>
          <Link href="/login">
            <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Log In
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default AccountDetails;
