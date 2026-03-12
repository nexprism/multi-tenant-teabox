import { getAddressModel } from "../models/Address";
import CrudRepository from "./CrudRepository";

export class AddressRepository extends CrudRepository {
  constructor(conn) {
    super(getAddressModel(conn));
    this.model = getAddressModel(conn);
  }

  async get(id) {
    //consolle.log("getting address by user id", id);
    const doc = await super.getAll({ user: id, deletedAt: null }, {}, 0, 0, [
      "user",
    ]);
    //consolle.log("Address found:", doc);
    if (!doc || !doc.result || doc.result.length === 0) return null;

    return doc.result;
  }

  // Get addresses by user ID
  async getByUserId(userId) {
    //consolle.log("getting addresses by user id", userId);
    const doc = await super.getAll(
      { user: userId, deletedAt: null },
      {},
      0,
      0,
      ["user"]
    );
    //consolle.log("Addresses found:", doc);
    return doc.result || [];
  }

  // Soft delete
  async destroy(id) {
    return await this.model.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), deleted: true },
      { new: true }
    );
  }

  // Ensure slug is returned on update
  async update(id, data) {
    const result = await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .select("+slug");
    return result;
  }
}
