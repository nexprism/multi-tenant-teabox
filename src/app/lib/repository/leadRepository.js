import leadSchema from "../models/Lead.js";
import userSchema from "../models/User.js";
import roleSchema from "../models/role.js";

const getModel = (conn, name, schema) => {
  return conn.models[name] || conn.model(name, schema);
};

// ✅ Create
export const createLead = async (data, conn) => {
  try {
    const Lead = getModel(conn, "Lead", leadSchema);
    return await Lead.create(data);
  } catch (error) {
    //consolle.error('Error in createLead:', error);
    throw error;
  }
};

// ✅ Read All
export const getLeads = async (query, conn) => {
  try {
    const Lead = getModel(conn, "Lead", leadSchema);

    const {
      search = "",
      status,
      source,
      assignedTo,
      lastCallStatus,
      isDeleted,
      page = 1,
      limit = 10,
    } = query;

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (lastCallStatus) filter.lastCallStatus = lastCallStatus;
    // Support soft-delete flag if provided by front-end filters
    // if (typeof isDeleted !== 'undefined') filter.isDeleted = isDeleted;

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, totalDocuments] = await Promise.all([
      Lead.find(filter)
        .populate("assignedTo")
        .populate("convertedTo")
        .populate("notes.createdBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    return {
      leads,
      totalDocuments,
      currentPage: Number(page),
      totalPages: Math.ceil(totalDocuments / Number(limit)),
    };
  } catch (error) {
    //consolle.error('Error in getLeads:', error);
    throw error;
  }
};

// ✅ Read by ID
export const getLeadById = async (id, conn) => {
  try {
    const Lead = getModel(conn, "Lead", leadSchema);
    const User = getModel(conn, "User", userSchema);
    return await Lead.findById(id)
      .populate("assignedTo")
      .populate("convertedTo")
      .populate("notes.createdBy");
  } catch (error) {
    //consolle.error('Error in getLeadById:', error);
    throw error;
  }
};

// ✅ Update
export const updateLead = async (id, data, conn) => {
  try {
    const Lead = getModel(conn, "Lead", leadSchema);
    return await Lead.findByIdAndUpdate(id, data, { new: true });
  } catch (error) {
    //consolle.error('Error in updateLead:', error);
    throw error;
  }
};

// ✅ Delete
export const deleteLead = async (id, conn) => {
  try {
    const Lead = getModel(conn, "Lead", leadSchema);
    return await Lead.findByIdAndDelete(id);
  } catch (error) {
    //consolle.error('Error in deleteLead:', error);
    throw error;
  }
};

export const bulkAssignLeads = async (leadIds, assignedTo, conn) => {
  try {
    await validateStaffRole(assignedTo, conn);
    const Lead = getModel(conn, "Lead", leadSchema);
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { assignedTo, status: "assigned" } },
      { new: true }
    );
    //consolle.log('Bulk assign result:', result);
    return result;
  } catch (error) {
    //consolle.error('Error in bulkAssignLeads:', error);
    throw error;
  }
};

export const validateStaffRole = async (userId, conn) => {
  try {
    //consolle.log('Validating staff role for user:', userId);
    const User = getModel(conn, "User", userSchema);
    const Role = getModel(conn, "Role", roleSchema);
    const user = await User.findById(userId).populate("role").exec();
    //consolle.log('User found:', user ? { id: user._id, role: user.role } : 'null');
    if (!user) {
      throw new Error("Assigned user not found");
    }
    //consolle.log('User role:', user.role);

    //consolle.log('role name:', user.role ? user.role.name : 'undefined');
    // if (!user.role || user.role.name !== 'Staff') {
    //   throw new Error('Assigned user must have staff role');
    // }
    return true;
  } catch (error) {
    //consolle.error('Error in validateStaffRole:', error);
    throw error;
  }
};
