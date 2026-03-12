import React from "react";

const AuthRequiredModal = ({ open, onClose, onLogin, onSignup }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-transparent backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full text-center">
        <h2 className="text-lg font-semibold mb-2">Login Required</h2>
        <p className="text-gray-600 mb-6 text-sm">You need to login or signup to add items to your cart.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onLogin}
            className="w-full greenOne text-white py-2 rounded hover:greenOne font-semibold"
          >
            Login
          </button>
          <button
            onClick={onSignup}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-semibold"
          >
            Signup
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
