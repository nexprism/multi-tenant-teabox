"use client"

import Image from 'next/image';
import { useState } from 'react';

export default function LoginSecurity() {
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    phone: false,
    password: false
  });

  const [userData, setUserData] = useState({
    name: 'Siddhart sharma',
    email: 'Siddhart.sharma232@gmail.com',
    phone: '+91 7541236547',
    password: '••••••••••••••'
  });

  const [tempData, setTempData] = useState({ ...userData });

  const handleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
    if (!editMode[field]) {
      setTempData({ ...userData });
    }
  };

  const handleSave = (field) => {
    setUserData({ ...userData, [field]: tempData[field] });
    setEditMode({ ...editMode, [field]: false });
  };

  const handleCancel = (field) => {
    setTempData({ ...userData });
    setEditMode({ ...editMode, [field]: false });
  };

  const handleInputChange = (field, value) => {
    setTempData({ ...tempData, [field]: value });
  };

  return (
    <div className="min-h-[60vh] bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-black mb-8">Login & Security</h1>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">Name</label>
            {editMode.name ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave('name')}
                    className="px-3 py-1 bg text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleCancel('name')}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 border border-gray-300 rounded px-3 py-2 flex items-center justify-between">
                <span className="text-black">{userData.name}</span>
                <button
                  onClick={() => handleEdit('name')}
                  className="text-gray-600 hover:text-black"
                >
                  <Image src="/images/edit.webp" alt="Edit" width={16} height={16} />
                </button>
              </div>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">Email</label>
            {editMode.email ? (
              <div className="space-y-2">
                <input
                  type="email"
                  value={tempData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave('email')}
                    className="px-3 py-1 bg text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleCancel('email')}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 border border-gray-300 rounded px-3 py-2 flex items-center overflow-hidden justify-between">
                <span className="text-black max-w-[80%] overflow-hidden">{userData.email}</span>
                <button
                  onClick={() => handleEdit('email')}
                  className="text-gray-600 hover:text-black"
                >
                  <Image src="/images/edit.webp" alt="Edit" width={16} height={16} />
                </button>
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">Primary Mobile Number</label>
            {editMode.phone ? (
              <div className="space-y-2">
                <input
                  type="tel"
                  value={tempData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave('phone')}
                    className="px-3 py-1 bg text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleCancel('phone')}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 border border-gray-300 rounded px-3 py-2 flex items-center justify-between">
                <span className="text-black">{userData.phone}</span>
                <button
                  onClick={() => handleEdit('phone')}
                  className="text-gray-600 hover:text-black"
                >
                  <Image src="/images/edit.webp" alt="Edit" width={16} height={16} />
                </button>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">Password</label>
            {editMode.password ? (
              <div className="space-y-2">
                <input
                  type="password"
                  value={tempData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                  placeholder="Enter new password"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave('password')}
                    className="px-3 py-1 bg text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleCancel('password')}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 border border-gray-300 rounded px-3 py-2 flex items-center justify-between">
                <span className="text-black">••••••••••••••</span>
                <button
                  onClick={() => handleEdit('password')}
                  className="text-gray-600 hover:text-black"
                >
                  <Image src="/images/edit.webp" alt="Edit" width={16} height={16} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}