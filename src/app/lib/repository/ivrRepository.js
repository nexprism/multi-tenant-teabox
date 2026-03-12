import slugify from "slugify";
import CrudRepository from "./CrudRepository.js";
import userSchema from "../models/User.js"; // <-- updated import

class IVRRepository extends CrudRepository {
  constructor(conn) {
    //consolle.log("Initializing IVRRepository", conn);
    // Use the provided connection for tenant DB, or global mongoose if not provided
    const connection = conn || require("mongoose");
    const UserModel =
      connection.models.User || connection.model("User", userSchema);
    super(UserModel);
    this.UserModel = UserModel; // <-- ensure consistent reference
  }

  async upsert(apiUser) {
    // Use ivrUuid for existence check
    let userDoc = await this.UserModel.findOne({ ivrUuid: apiUser.uuid });
    //consolle.log("userDoc : ", userDoc);
    //get staff role by name == Staff
    const staffRole = await this.UserModel.db.models.Role.findOne({
      name: "Staff",
    });
    //consolle.log("staff is ====> ", staffRole); // <-- get Role from connection
    const userData = {
      name: apiUser.name,
      email: apiUser.email,
      phone: apiUser.contact_number,
      role: staffRole._id,
      ivrUuid: apiUser.uuid,
      ivrRoleId: apiUser.role_id,
      isActive: apiUser.is_active === "1",
      // ...map other fields as needed...
    };
    //consolle.log("staff role:", staffRole);
    //consolle.log("Upserting user:", userData);
    //consolle.log("Existing user document:", userDoc);
    if (userDoc) {
      Object.assign(userDoc, userData);
      await userDoc.save();
    } else {
      userDoc = await this.UserModel.create(userData);
    }
    return userDoc;
  }

  async getAll(query = {}) {
    // Add filtering, pagination, etc. as needed
    return await this.UserModel.find(query).lean();
  }

  async getById(id) {
    return await this.UserModel.findById(id).lean();
  }

  async update(id,  data) {
    return await this.UserModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
  }

  async delete(id) {
    return await this.UserModel.findByIdAndDelete(id);
  }
}

export default IVRRepository;
