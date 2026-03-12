import SettingModel from "../models/Setting.js";

class SettingRepository {
  constructor(model = SettingModel) {
    this.model = model;
  }

  async getSetting(tenant) {
    console?.log("here the tenant",tenant);
    return await this.model.findOne({ tenant });
  }

  async updateSetting(tenant, data) {
    return await this.model.findOneAndUpdate({ tenant }, data, { new: true, upsert: true });
  }

  async updateAllSettings(data) {
    // Exclude sensitive or unique fields that should not be overwritten globally
    const { _id, tenant, metaIntegration, __v, createdAt, updatedAt, ...updateFields } = data;
    
    // Update ALL documents with the safe fields
    await this.model.updateMany({}, { $set: updateFields });
    
    // Return the updated 'admin' document (or one of them) to satisfy the return expectation
    // Since the caller expects the updated object back.
    return data; // or fetch the admin one specifically if needed
  }
}

export default SettingRepository;
