import SettingModel from "../models/Setting.js";

class SettingRepository {
  constructor(model = SettingModel) {
    this.model = model;
  }

  async getSetting(tenant, conn) {
    let Model = this.model;
    if (conn) {
      if (!conn.models.Setting) {
        conn.model("Setting", this.model.schema);
      }
      Model = conn.models.Setting;
    }

    try {
      console?.log('[SettingRepository] getSetting using', Model.modelName || 'Model', 'for tenant', tenant, 'on conn host:', conn?.host);
    } catch (e) {}
    
    // Prefer the most recently updated document for the tenant in case duplicates exist
    return await Model.findOne({ tenant }).sort({ updatedAt: -1 });
  }

  async updateSetting(tenant, data, conn) {
    let Model = this.model;
    if (conn) {
      // If the model isn't registered on the tenant DB yet, ensure we register it
      if (!conn.models.Setting) {
        conn.model("Setting", this.model.schema);
      }
      Model = conn.models.Setting;
    }
    
    try {
      console?.log('[SettingRepository] updateSetting using', Model.modelName || 'Model', 'for tenant', tenant, 'on conn host:', conn?.host);
    } catch (e) {}
    return await Model.findOneAndUpdate({ tenant }, data, { new: true, upsert: true });
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
