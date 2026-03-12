import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, sparse: true }, // Made optional and sparse
  passwordHash: { type: String },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        // allow empty/null (sparse index) or a 10-digit numeric string
        return v == null || v === "" || /^\d{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid 10-digit phone number`,
    },
  },
  isVerified: { type: Boolean, default: false },
  
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    default: null,
  },

  isSuperAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },

  ivrUuid: { type: String, index: true, unique: true, sparse: true }, // IVR UUID for third-party sync
  ivrRoleId: { type: String }, // IVR role_id from third-party
});

export default userSchema;
