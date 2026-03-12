import UserRepository from "../repository/userRepository.js";
import TenantRepository from "../repository/tenantRepository.js";
import mongoose from "mongoose";
import RoleRepository from "../repository/roleRepository.js";
import { file } from "googleapis/build/src/apis/file/index.js";

class UserService {
  constructor(conn) {
    this.userRepo = new UserRepository(conn);
    this.tenantRepo = new TenantRepository(conn);
    this.roleRepo = new RoleRepository(conn); // Assuming roleRepo is also a UserRepository, adjust if needed
    // Add Order model for buyer/non-buyer logic
    this.Order =
      conn.models.Order ||
      conn.model("Order", require("../models/Order.js").OrderSchema);
  }

  // Create
  async createUser(data) {
    try {
      // For phone-based registration, only require name and phone, make email optional

      // Check if user already exists by email (if email provided)
      if (data.email) {
        const existingUser = await this.userRepo.findByEmail(data.email);
        if (existingUser) {
          throw new Error("User with this email already exists");
        }
      }

      // Check if user already exists by phone (if phone provided)
      if (data.phone) {
        const existingPhoneUser = await this.userRepo.findByPhone(data.phone);
        if (existingPhoneUser) {
          throw new Error("User with this phone number already exists");
        }
      }

      // Validate role id and tenant id if provided
      if (data.role && !mongoose.Types.ObjectId.isValid(data.role)) {
        throw new Error("Invalid role ID");
      }
      if (data.tenant && !mongoose.Types.ObjectId.isValid(data.tenant)) {
        throw new Error("Invalid tenant ID");
      }
      // Tenant validation - SKIPPED for signup to avoid timeout issues
      // Tenant will be set from role if needed, or can be validated later
      // Skip tenant validation to prevent "tenants.findOne() buffering timed out" error
      let tenant = null;
      if (data.tenant) {
        // Skip tenant validation during signup - this prevents connection timeouts
        // The tenant can be validated later or set from the role
        console.log("Tenant provided for signup - skipping validation to prevent timeout");
        // Keep tenant as provided, will be validated when role is processed if needed
      }
      // If role is provided, verify role exists and matches tenant if applicable
      if (data.role) {
        const role = await this.roleRepo.findById(data.role);
        if (!role) {
          throw new Error("Role not found");
        }
        // If the role is tenant-scoped, ensure it belongs to the correct tenant
        if (role.scope === "tenant") {
          // If role has tenantId, use it (route handler should have set this, but ensure it's set)
          if (role.tenantId) {
            // If tenant is provided, it must match the role's tenantId
            if (data.tenant && data.tenant.toString() !== role.tenantId.toString()) {
              throw new Error(
                "Tenant-scoped role does not belong to the specified tenant"
              );
            }
            // If tenant is not provided, use the role's tenantId
            if (!data.tenant) {
              data.tenant = role.tenantId;
            }
          } else {
            // Role is tenant-scoped but has no tenantId - this is invalid
            throw new Error("Tenant-scoped role must have a tenantId");
          }
        }
        // If role is global, tenant may be optional
      }
      //console.log('Creating user with data:', data);
      // Create user in DB
      return await this.userRepo.createUser(data);
    } catch (error) {
      //console.error('UserService createUser error:', error?.message);
      throw error;
    }
  }

  // Read all
  async getAllUsers(query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        filters = "{}",
        searchFields = "{}",
        sort = "{}",
        populateFields = [],
        selectFields = {},
        includeDeleted,
        buys,
        newcustomers, // new param
        repeatcustomers, // new param
        startDate,
        endDate,
      } = query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const parsedFilters =
        typeof filters === "string" ? JSON.parse(filters) : filters;
      const parsedSearchFields =
        typeof searchFields === "string"
          ? JSON.parse(searchFields)
          : searchFields;
      const parsedSort = typeof sort === "string" ? JSON.parse(sort) : sort;

      const filterConditions = { ...parsedFilters };
      // Check for OR flag: when true, simple fields (name,email,phone) will be combined with $or
      const orFlag =
        query &&
        (query.or === true || String(query.or).toLowerCase() === "true");
      const orConditions = [];

      // Debug: log incoming query and the initial filterConditions
      try {
        console.debug(
          "[UserService.getAllUsers] incoming query:",
          JSON.stringify(query)
        );
        console.debug(
          "[UserService.getAllUsers] initial filterConditions:",
          JSON.stringify(filterConditions)
        );
      } catch (e) {
        // ignore logging errors
      }

      // Only add deleted filter if not explicitly requesting all users
      // Use isDeleted to match analytics logic
      if (!includeDeleted) {
        filterConditions.isDeleted = { $ne: true };
      }

      // Accept simple query params like name/email/phone and convert to regex search
      const controlKeys = new Set([
        "page",
        "limit",
        "filters",
        "searchFields",
        "sort",
        "populateFields",
        "selectFields",
        "includeDeleted",
        "buys", // <-- add buys here so it is NOT added as a field filter
        "newcustomers",
        "repeatcustomers",
        "startDate",
        "endDate",
      ]);

      for (const [k, v] of Object.entries(query)) {
        if (controlKeys.has(k)) continue;
        if (v === undefined || v === null || v === "") continue;
        if (["name", "email", "phone"].includes(k)) {
          const cond = { [k]: { $regex: v, $options: "i" } };
          if (orFlag) {
            orConditions.push(cond);
          } else {
            filterConditions[k] = cond[k];
          }
        } else {
          filterConditions[k] = v;
        }
      }

      // If orFlag is set and we collected orConditions, add them to filterConditions.$or
      if (orFlag && orConditions.length > 0) {
        if (filterConditions.$or) {
          filterConditions.$or = filterConditions.$or.concat(orConditions);
        } else {
          filterConditions.$or = orConditions;
        }
      }

      // Debug: log filterConditions after processing simple query params
      try {
        console.debug(
          "[UserService.getAllUsers] filterConditions after simple params:",
          JSON.stringify(filterConditions)
        );
      } catch (e) {
        // ignore
      }
      // Build searchFields $or conditions
      const searchConditions = [];
      if (parsedSearchFields && typeof parsedSearchFields === "object") {
        for (const [field, term] of Object.entries(parsedSearchFields)) {
          if (term === undefined || term === null || term === "") continue;
          searchConditions.push({ [field]: { $regex: term, $options: "i" } });
        }
      }

      if (searchConditions.length > 0) {
        // If filterConditions already has $or, merge with it; otherwise assign
        if (filterConditions.$or) {
          filterConditions.$or = filterConditions.$or.concat(searchConditions);
        } else {
          filterConditions.$or = searchConditions;
        }
      }

      // Debug: log parsedSearchFields and the final filterConditions before query
      try {
        console.debug(
          "[UserService.getAllUsers] parsedSearchFields:",
          JSON.stringify(parsedSearchFields)
        );
        console.debug(
          "[UserService.getAllUsers] final filterConditions:",
          JSON.stringify(filterConditions)
        );
      } catch (e) {
        // ignore
      }

      // --- BUYER/NON-BUYER FILTER LOGIC ---
      let buyerUserIds = [];
      if (buys === "buyer" || buys === "nonbuyer" || newcustomers === "true" || repeatcustomers === "true") {
        // Build date filter for orders if needed
        let orderDateFilter = {};
        let start, end;
        if (startDate) start = new Date(startDate);
        if (endDate) {
          end = new Date(endDate);
          end.setUTCHours(23, 59, 59, 999);
        }
        if (start || end) {
          orderDateFilter.createdAt = {};
          if (start) orderDateFilter.createdAt.$gte = start;
          if (end) orderDateFilter.createdAt.$lte = end;
        }

        // Find all users who have at least one successful order
        const buyerOrders = await this.Order.aggregate([
          {
            $match: {
              $or: [
                {
                  paymentMode: "Prepaid",
                  status: { $in: ["paid", "shipped", "completed"] },
                },
                { paymentMode: "COD", status: "completed" },
              ],
              ...orderDateFilter,
            },
          },
          { $group: { _id: "$user" } },
        ]);
        buyerUserIds = buyerOrders.map((o) => o._id);

        if (buys === "buyer") {
          if (buyerUserIds.length === 0) {
            return { users: [], total: 0, page: pageNum, totalPages: 0, limit: limitNum };
          }
          filterConditions._id = { $in: buyerUserIds };
        } else if (buys === "nonbuyer") {
          if (buyerUserIds.length === 0) {
            // No buyers, so all users are non-buyers
            // Do not add _id filter
          } else {
            // Convert all buyerUserIds to ObjectId for correct $nin filtering
            const buyerObjectIds = buyerUserIds.map(id =>
              typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
            );
            filterConditions._id = { $nin: buyerObjectIds };
          }
        }
      }

      // --- NEW CUSTOMERS FILTER ---
      if (newcustomers === "true") {
        // Find users whose first successful order is in the date range
        let start = startDate ? new Date(startDate) : new Date(0);
        let end = endDate ? new Date(endDate) : new Date();
        end.setUTCHours(23, 59, 59, 999);

        const firstOrderAgg = await this.Order.aggregate([
          {
            $match: {
              $or: [
                { paymentMode: "Prepaid", status: { $in: ["paid", "shipped", "completed"] } },
                { paymentMode: "COD", status: "completed" }
              ]
            }
          },
          { $group: { _id: "$user", firstOrderDate: { $min: "$createdAt" } } },
          {
            $match: {
              firstOrderDate: { $gte: start, $lte: end }
            }
          }
        ]);
        const newCustomerIds = firstOrderAgg.map((o) => o._id?.toString());
        filterConditions._id = { $in: newCustomerIds };
      }

      // --- REPEAT CUSTOMERS FILTER ---
      if (repeatcustomers === "true") {
        // Users with more than one successful order
        const repeatAgg = await this.Order.aggregate([
          {
            $match: {
              $or: [
                { paymentMode: "Prepaid", status: { $in: ["paid", "shipped", "completed"] } },
                { paymentMode: "COD", status: "completed" }
              ]
            }
          },
          { $group: { _id: "$user", count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]);
        const repeatCustomerIds = repeatAgg.map((o) => o._id?.toString());
        filterConditions._id = { $in: repeatCustomerIds };
      }

      // Debug: log final filterConditions before query
      try {
        console.debug("[UserService.getAllUsers] FINAL filterConditions:", JSON.stringify(filterConditions));
      } catch (e) {}

      // Build sort conditions
      const sortConditions = {};
      if (parsedSort && typeof parsedSort === "object") {
        for (const [field, direction] of Object.entries(parsedSort)) {
          sortConditions[field] = direction === "asc" ? 1 : -1;
        }
      }

      // Use CrudRepository's getAll method
      const result = await this.userRepo.getAll(
        filterConditions,
        sortConditions,
        pageNum,
        limitNum,
        populateFields,
        selectFields
      );

      try {
        console.debug(
          "[UserService.getAllUsers] foundCount:",
          result.totalDocuments,
          "returned:",
          result.result.length
        );
      } catch (e) {
        // ignore
      }

      // Transform the response to match expected format
      return {
        users: result.result,
        total: result.totalDocuments,
        page: result.currentPage,
        totalPages: result.totalPages,
        limit: limitNum,
      };
    } catch (error) {
      throw error; // Rethrow the original error
    }
  }

  // Read one
  async getUserById(id) {
    return await this.userRepo.findById(id);
  }

  async findById(id) {
    return await this.userRepo.findById(id);
  }

  // Find by email
  async findByEmail(email) {
    try {
      return await this.userRepo.findByEmail(email);
    } catch (error) {
      //console.error('UserService findByEmail error:', error?.message);
      throw error; // Rethrow the original error
    }
  }

  // Find by phone
  async findByPhone(phone) {
    try {
      return await this.userRepo.findByPhone(phone);
    } catch (error) {
      //console.error('UserService findByPhone error:', error?.message);
      throw error; // Rethrow the original error
    }
  }

  // Get user by phone (alias)
  async getUserByPhone(phone) {
    return await this.findByPhone(phone);
  }

  // Update user by ID
  async updateUserById(id, data) {
    try {
      return await this.userRepo.updateUser(id, data);
    } catch (error) {
      //console.error('UserService updateUserById error:', error?.message);
      throw error;
    }
  }

  // Update
  // async updateUser(id, data) {
  //   try {
  //     //console.log('Services Updating user with id:', id, 'and data:', data);

  //     return await this.userRepo.updateUser(id, data);
  //   } catch (error) {
  //     //console.error('UserService updateUser error:', error?.message);
  //     throw error; // Rethrow the original error
  //   }
  // }
  async updateUser(id, data) {
    try {
      //console.log('Services Updating user with id:', id, 'and data:', data);

      const tenantId = data?.tenant || data?.tenantId;
      //console.log('Calling findById with ID:', id, 'and tenantId:', tenantId);

      const user = await this.userRepo.findById(id, tenantId);
      if (!user) {
        return {
          status: 404,
          body: { success: false, message: "User not found" },
        };
      }

      return await this.userRepo.updateUser(id, data);
    } catch (error) {
      //console.error('UserService updateUser error:', error?.message);
      throw error; // Rethrow the original error
    }
  }

  // Delete (soft)
  async deleteUser(id) {
    try {
      //console.log('Deleting user with id:', id);
      const deletedUser = await this.userRepo.softDelete(id);
      return {
        status: 200,
        body: {
          success: true,
          message: "User deleted successfully",
          data: deletedUser,
        },
      };
    } catch (error) {
      //console.error('UserService deleteUser error:', error?.message);
      return {
        status: 500,
        body: { success: false, message: "Failed to delete user" },
      };
    }
  }

  // Additional methods can be added as needed
  async findRoleById(roleId) {
    try {
      return await this.userRepo.findRoleById(roleId);
    } catch (error) {
      throw error; // Rethrow the original error
    }
  }
}

export default UserService;
