import SettingRepository from "../repository/SettingRepository.js";

class SettingService {
  constructor(settingRepository) {
    this.settingRepository = settingRepository;
  }

  async getSetting(tenant) {
    return await this.settingRepository.getSetting(tenant);
  }

  async updateSetting(tenant, data) {
    // Use the provided tenant. If it ends with 'admin', strip that suffix.
    let checkTenant = typeof tenant === "string" ? tenant : "";
    let newTenant = checkTenant;
    if (checkTenant && checkTenant.endsWith("admin")) {
      newTenant = checkTenant.replace(/admin$/, "");
    } // Persist using the cleaned tenant value when available.
    // Persist using the cleaned tenant value when available.
    const tenantToUse = newTenant || tenant;
    
    // If the tenant is 'admin', update ALL tenants
    if (tenantToUse === 'admin') {
      return await this.settingRepository.updateAllSettings(data);
    }
    
    return await this.settingRepository.updateSetting(tenantToUse, data);
  }
}

export default SettingService;
