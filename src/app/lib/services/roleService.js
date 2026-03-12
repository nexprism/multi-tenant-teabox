import Role from "../models/role.js";
import RoleRepository from "../repository/roleRepository.js";

class RoleService {
  constructor(conn) {
    this.conn = conn;
    this.roleRepo = new RoleRepository(conn);
  }

  // Create
  async createRole(data, currentUser = null, conn = null) {
    try {
      // If currentUser is tenant admin, restrict permissions
      if (currentUser && !currentUser.isSuperAdmin) {
        // Fetch current user's role with permissions
        let userRole = currentUser.role;
        const repo = new RoleRepository(conn || this.conn);
        if (
          !userRole ||
          typeof userRole === "string" ||
          userRole._bsontype === "ObjectId"
        ) {
          userRole = await repo.getRoleById(currentUser.role);
        }

          // console.log("Current user role:", userRole);
        // Only allow assigning permissions that the user has
        if (
          userRole &&
          userRole.modulePermissions &&
          Array.isArray(data.modulePermissions)
        ) {
          // Build a map of allowed permissions per module
          const allowed = {};
          userRole.modulePermissions.forEach((mp) => {
            allowed[mp.module.toString()] = mp.permissions;
          });
          // Filter data.modulePermissions: only include modules present in allowed
          data.modulePermissions = data.modulePermissions
            .filter((mp) => allowed.hasOwnProperty(mp.module?.toString()))
            .map((mp) => ({
              module: mp.module,
              permissions: mp.permissions.filter((p) =>
                allowed[mp.module?.toString()].includes(p)
              ),
            }));
        }
      }
      const repo = new RoleRepository(conn || this.conn);
      return await repo.createRole(data);
    } catch (error) {
      throw new Error("Error creating role");
    }
  }

  // Read all
  async getRoles(query = {}, conn = null) {
    try {
      // console.log("getRoles query:", query);
      const {
        page = 1,
        limit = 10,
        filters = "{}",
        searchFields = "{}",
        sort = "{}",
      } = query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Parse JSON strings from query parameters (or accept objects)
      let parsedFilters = {};
      let parsedSearchFields = {};
      let parsedSort = {};
      try {
        parsedFilters =
          typeof filters === "string" ? JSON.parse(filters) : filters || {};
      } catch (err) {
        console.warn("Invalid filters JSON provided to getRoles:", err.message);
        parsedFilters = {};
      }
      try {
        parsedSearchFields =
          typeof searchFields === "string"
            ? JSON.parse(searchFields)
            : searchFields || {};
      } catch (err) {
        // console.warn(
        //   "Invalid searchFields JSON provided to getRoles:",
        //   err.message
        // );
        parsedSearchFields = {};
      }
      try {
        parsedSort = typeof sort === "string" ? JSON.parse(sort) : sort || {};
      } catch (err) {
        parsedSort = {};
      }

      // Parse selectFields for projection or fallback search
      let parsedSelectFields = {};
      try {
        parsedSelectFields =
          typeof query.selectFields === "string"
            ? JSON.parse(query.selectFields)
            : query.selectFields || {};
      } catch (err) {
        // console.warn(
        //   "Invalid selectFields JSON provided to getRoles:",
        //   err.message
        // );
        parsedSelectFields = {};
      }

      // Build filter conditions
      const filterConditions = { deletedAt: null, ...parsedFilters };

      // Build search conditions for multiple fields with partial matching
      const searchConditions = [];
      // If no explicit searchFields provided, allow selectFields to be used as a fallback
      const effectiveSearchFields =
        Object.keys(parsedSearchFields).length === 0
          ? parsedSelectFields
          : parsedSearchFields;

      for (const [field, term] of Object.entries(effectiveSearchFields)) {
        if (term !== undefined && term !== null && term !== "") {
          searchConditions.push({ [field]: { $regex: term, $options: "i" } });
        }
      }
      if (searchConditions.length > 0) {
        filterConditions.$or = searchConditions;
      }

      // Build sort conditions
      const sortConditions = {};
      for (const [field, direction] of Object.entries(parsedSort)) {
        // accept 'asc'/'desc' or 1/-1
        if (direction === "asc" || direction === 1 || direction === "1")
          sortConditions[field] = 1;
        else sortConditions[field] = -1;
      }

      const repo = new RoleRepository(conn || this.conn);
      // Build projection object for mongoose .select()
      const projection = {};
      for (const [field, val] of Object.entries(parsedSelectFields || {})) {
        // treat numeric 1/0 or string '1'/'0' as projection flags
        if (val === 1 || val === "1" || val === 0 || val === "0") {
          projection[field] = Number(val);
        }
      }

      const result = await repo.getAll(
        filterConditions,
        sortConditions,
        pageNum,
        limitNum,
        [],
        projection
      );
      return result;
    } catch (error) {
      // console.error("RoleService.getRoles error:", error);
      throw new Error("Error fetching roles");
    }
  }

  // Read one
  async getRoleById(id, conn = null) {
    try {
      const repo = new RoleRepository(conn || this.conn);
      return await repo.getRoleById(id);
    } catch (error) {
      throw new Error("Error fetching role");
    }
  }

  // Update
  async updateRole(id, data, currentUser = null, conn = null) {
    try {
      // Debug: log currentUser at the start
      // console.log("updateRole called with currentUser:", currentUser);

      // If currentUser is tenant admin, restrict permissions
      if (currentUser && !currentUser.isSuperAdmin) {
        // Fetch current user's role with permissions
        let userRole = currentUser.role;
        const repo = new RoleRepository(conn || this.conn);
        if (
          !userRole ||
          typeof userRole === "string" ||
          userRole._bsontype === "ObjectId"
        ) {
          userRole = await repo.getRoleById(currentUser.role);
        }

        // Debug: log admin's allowed permissions
        // console.log("Admin role:", userRole);
        // console.log(
        //   "Admin role modulePermissions:",
        //   userRole && userRole.modulePermissions
        // );

        // Only allow assigning permissions that the user has
        if (
          userRole &&
          userRole.modulePermissions &&
          Array.isArray(data.modulePermissions)
        ) {
          const allowed = {};
          userRole.modulePermissions.forEach((mp) => {
            allowed[mp.module.toString()] = mp.permissions;
          });
          console.log("Allowed permissions map:", allowed);
          data.modulePermissions = data.modulePermissions
            .filter((mp) => {
              const allowedPerms = allowed[mp.module?.toString()] || [];
              // Debug: log requested permissions vs allowed
              // console.log(
              //   `Requested module: ${mp.module}, requested permissions: ${mp.permissions}, allowed: ${allowedPerms}`
              // );
              // Only include if at least one permission matches allowed
              return (
                allowed.hasOwnProperty(mp.module?.toString()) &&
                mp.permissions.some((p) => allowedPerms.includes(p))
              );
            })
            .map((mp) => ({
              module: mp.module,
              permissions: mp.permissions.filter((p) => {
                const allowedPerms = allowed[mp.module?.toString()] || [];
                // Debug: log each permission check
                // console.log(
                //   `Checking permission "${p}" for module "${
                //     mp.module
                //   }": ${allowedPerms.includes(p)}`
                // );
                return allowedPerms.includes(p);
              }),
            }))
            .filter((mp) => mp.permissions.length > 0); // Only keep modules with at least one allowed permission
        } else {
          console.log("No modulePermissions to process or userRole missing.");
        }
      } else {
        // console.log(
        //   "Current user is super admin or not provided.",
        //   currentUser
        // );
      }
      const repo = new RoleRepository(conn || this.conn);
      return await repo.updateRole(id, data);
    } catch (error) {
      console.error("Error in updateRole:", error);
      throw new Error("Error updating role");
    }
  }

  //findbyname
  async findByName(name, conn = null) {
    try {
      const repo = new RoleRepository(conn || this.conn);
      return await repo.findByName(name);
    } catch (error) {
      throw new Error("Error fetching role");
    }
  }

  // Delete
  async deleteRole(id, conn = null) {
    try {
      const repo = new RoleRepository(conn || this.conn);
      return await repo.deleteRole(id);
    } catch (error) {
      throw new Error("Error deleting role");
    }
  }
}

export default RoleService;
