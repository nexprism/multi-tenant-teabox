const { default: mongoose } = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    trim: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  line1: {
    type: String,
    required: true,
  },
  line2: {
    type: String,
    default: "",
  },
  landmark: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
});

const AddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    address: addressSchema,
    deletedAt: {
      type: Date,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto-handled
  }
);

export const getAddressModel = (conn) => {
  // During development, we might need to delete the model from cache to apply schema changes
  if (conn.models.Address) {
    delete conn.models.Address;
  }
  // Ensure `User` model/schema is registered on the same connection so populate('user') works.
  try {
    if (!conn.models.User) {
      // `User.js` exports the schema as the default export (ESM), so require may return an object with `default`.
      const userModule = require("./User.js");
      const UserSchema = userModule?.default || userModule;
      if (UserSchema) {
        conn.model("User", UserSchema);
      }
    }
  } catch (err) {
    // If requiring the User schema fails, ignore — populate will error elsewhere if truly missing.
  }

  return conn.model("Address", AddressSchema);
};
const Address =
  mongoose.models.Address || mongoose.model("Address", AddressSchema);
export default Address;
