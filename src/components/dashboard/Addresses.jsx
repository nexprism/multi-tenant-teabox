import React, { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Check,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createUserAddress,
  deleteUserAddress,
  getuserAddresses,
  updateUserAddress,
} from "@/app/store/slices/authSlice";

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    type: "home",
    isDefault: false,
    firstName: "",
    lastName: "",
    email: "",
    address1: "",
    address2: "",
    landmark: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  });
  const dispatch = useDispatch();
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fetchAddresses = async () => {
    // Simulate fetching addresses from an API
    const response = await dispatch(getuserAddresses(user._id));
    //console.log("Fetched addresses:", response);
    setAddresses(Array.isArray(response.payload) ? response.payload : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAddress) {
      const payload = {
        title: addressForm.type,
        isDefault: addressForm.isDefault,
        address: {
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          email: addressForm.email,
          line1: addressForm.address1,
          line2: addressForm.address2,
          landmark: addressForm.landmark,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.zipCode,
          country: addressForm.country,
          phone: addressForm.phone,
        },
      };
      await dispatch(
        updateUserAddress({
          addressId: editingAddress._id,
          addressData: payload,
        })
      );
      fetchAddresses();
      setIsAddingAddress(false);
      setEditingAddress(null);
    } else {
      // Add new address
      const payload = {
        user: user._id,
        title: addressForm.type || "Home",
        isDefault: addressForm.isDefault,
        address: {
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          email: addressForm.email,
          line1: addressForm.address1,
          line2: addressForm.address2,
          landmark: addressForm.landmark,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.zipCode,
          country: addressForm.country || "India",
          phone: addressForm.phone,
        },
      };
      await dispatch(createUserAddress(payload));
      setIsAddingAddress(false);
      fetchAddresses();

      setIsAddingAddress(false);
    }

    resetForm();
  };

  const resetForm = () => {
    setAddressForm({
      type: "home",
      isDefault: false,
      firstName: "",
      lastName: "",
      email: "",
      address1: "",
      address2: "",
      landmark: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      phone: "",
    });
  };

  const handleEdit = (address) => {
    //console.log("Editing address:", address);
    setAddressForm({
      type: address.title,
      isDefault: address.isDefault,
      firstName: address.address.firstName,
      lastName: address.address.lastName,
      email: address.address.email || "",
      address1: address.address.line1,
      address2: address.address.line2 || "",
      landmark: address.address.landmark || "",
      city: address.address.city,
      state: address.address.state,
      zipCode: address.address.pincode,
      country: address.address.country || "United States",
      phone: address.address.phone,
    });
    setEditingAddress(address);
    setIsAddingAddress(true);
  };

  const handelUpdateIsDefault = async (addressId) => {
    try {
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId,
        }))
      );
      await dispatch(updateUserAddress({ addressId, isDefault: true }));
      fetchAddresses();
      //console.log("Default address updated successfully");
    } catch (error) {
      //console.error("Failed to update default address:", error);
    }
  };
  const handleDelete = async (addressId) => {
    try {
      await dispatch(deleteUserAddress(addressId));
      setAddresses((prev) => prev.filter((addr) => addr._id !== addressId));
      //console.log("Address deleted successfully");
      dispatch(getuserAddresses(user._id)); // Refresh addresses
    } catch (error) {
      //console.error("Failed to delete address:", error);
    }
  };

  const setAsDefault = (addressId) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr._id === addressId,
      }))
    );
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "home":
        return <Home size={16} className="text-blue-600" />;
      case "work":
        return <Building size={16} className="text-green-600" />;
      default:
        return <MapPin size={16} className="text-gray-600" />;
    }
  };

  const cancelForm = () => {
    setIsAddingAddress(false);
    setEditingAddress(null);
    resetForm();
  };

  useEffect(() => {
    fetchAddresses();
  }, [dispatch, user?._id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex max-sm:flex-col max-sm:gap-4 max-sm:items-start justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Addresses
          </h1>
          <p className="text-gray-600">
            Manage your shipping and billing addresses
          </p>
        </div>
        <button
          onClick={() => setIsAddingAddress(true)}
          className="px-4 py-2 max-sm:w-full justify-center bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Add/Edit Address Form */}
      {isAddingAddress && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={addressForm.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={addressForm.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={addressForm.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                name="email"
                value={addressForm.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                name="address1"
                value={addressForm.address1}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                name="address2"
                value={addressForm.address2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                name="landmark"
                value={addressForm.landmark}
                onChange={handleInputChange}
                placeholder="Near hospital, mall, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={addressForm.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={addressForm.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses &&
          addresses?.length > 0 &&
          addresses?.map((address) => (
            <div
              key={address._id}
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  {getAddressIcon(address.title)}
                  <span className="font-medium text-gray-900 capitalize">
                    {address.title}
                  </span>
                  {address.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Check size={12} />
                      <span>Default</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {address.address.firstName} {address.address.lastName}
                </p>
                {address.address.email && (
                  <p className="text-blue-600">{address.address.email}</p>
                )}
                {address.address.line1 && <p>{address.address.line1}</p>}
                {address.address.line2 && <p>{address.address.line2}</p>}
                {address.address.landmark && (
                  <p className="text-gray-500">
                    Near: {address.address.landmark}
                  </p>
                )}
                <p>
                  {address.address.city}, {address.address.state}{" "}
                  {address.address.pincode}
                </p>
                <p>{address.address.country} </p>
                <p>{address.address.phone}</p>
              </div>

              {!address.isDefault && (
                <button
                  onClick={() => handelUpdateIsDefault(address._id)}
                  className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
      </div>

      {addresses?.length === 0 && !isAddingAddress && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No addresses saved
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first address to get started
          </p>
          <button
            onClick={() => setIsAddingAddress(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus size={16} />
            <span>Add Your First Address</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Addresses;
