import { SettingSchema } from "../models/Setting.js";
import { getDbConnection } from "@/app/lib/tenantDb";

/**
 * Meta Integration Repository
 * Handles database operations for Meta CRM/Ads settings
 */

/**
 * Get Meta integration settings for a tenant
 * @param {string} tenant - Tenant identifier
 * @returns {Promise<Object>} Meta integration settings
 */

export async function getMetaSettings(tenant) {
    try {
        console.log("tenant", tenant);

        // Connect to the tenant-specific DB
        const conn = await getDbConnection(tenant);

        // Load model from that DB (check if already exists to avoid overwrite error)
        const SettingModel = conn.models.Setting || conn.model("Setting", SettingSchema);

        const settings = await SettingModel.findOne({ tenant }).lean();
        console.log("settings found:", !!settings);

        if (settings?.metaIntegration) {
            console.log("metaIntegration:", {
                hasAdAccountId: !!settings.metaIntegration.adAccountId,
                hasPixelId: !!settings.metaIntegration.pixelId,
                hasAccessToken: !!settings.metaIntegration.accessToken,
                accessTokenLength: settings.metaIntegration.accessToken?.length,
                accessTokenPreview: settings.metaIntegration.accessToken?.substring(0, 20) + "...",
                isConnected: settings.metaIntegration.isConnected
            });
        }

        if (!settings) {
            throw new Error("Settings not found for tenant");
        }

        return {
            success: true,
            data: settings.metaIntegration || {},
        };
    } catch (error) {
        console.error("Error fetching Meta settings:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}


/**
 * Save or update Meta integration settings
 * @param {string} tenant - Tenant identifier
 * @param {Object} metaData - Meta integration data
 * @returns {Promise<Object>} Updated settings
 */
export async function saveMetaSettings(tenant, metaData) {
    try {
        const {
            adAccountId,
            pixelId,
            pageId,
            accessToken,
            appId,
            appSecret,
            tokenExpiresAt,
        } = metaData;

        // Connect to the tenant-specific DB
        const conn = await getDbConnection(tenant);
        const SettingModel = conn.models.Setting || conn.model("Setting", SettingSchema);

        // Calculate token expiration (60 days for long-lived tokens)
        const expiresAt = tokenExpiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        const updateData = {
            "metaIntegration.adAccountId": adAccountId,
            "metaIntegration.pixelId": pixelId,
            "metaIntegration.accessToken": accessToken,
            "metaIntegration.isConnected": true,
            "metaIntegration.connectedAt": new Date(),
            "metaIntegration.tokenExpiresAt": expiresAt,
        };

        // Only update optional fields if provided
        if (pageId) {
            updateData["metaIntegration.pageId"] = pageId;
        }
        if (appId) {
            updateData["metaIntegration.appId"] = appId;
        }
        if (appSecret) {
            updateData["metaIntegration.appSecret"] = appSecret;
        }

        const settings = await SettingModel.findOneAndUpdate(
            { tenant },
            { $set: updateData },
            { new: true, upsert: true }
        );

        return {
            success: true,
            data: settings.metaIntegration,
        };
    } catch (error) {
        console.error("Error saving Meta settings:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Disconnect Meta integration
 * @param {string} tenant - Tenant identifier
 * @returns {Promise<Object>} Result
 */
export async function disconnectMetaIntegration(tenant) {
    try {
        // Connect to the tenant-specific DB
        const conn = await getDbConnection(tenant);
        const SettingModel = conn.models.Setting || conn.model("Setting", SettingSchema);

        const settings = await SettingModel.findOneAndUpdate(
            { tenant },
            {
                $set: {
                    "metaIntegration.isConnected": false,
                    "metaIntegration.accessToken": null,
                },
            },
            { new: true }
        );

        return {
            success: true,
            data: settings?.metaIntegration || {},
        };
    } catch (error) {
        console.error("Error disconnecting Meta integration:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Check if Meta token is expired
 * @param {string} tenant - Tenant identifier
 * @returns {Promise<boolean>} Is token expired
 */
export async function isMetaTokenExpired(tenant) {
    try {
        // Connect to the tenant-specific DB
        const conn = await getDbConnection(tenant);
        const SettingModel = conn.models.Setting || conn.model("Setting", SettingSchema);

        const settings = await SettingModel.findOne({ tenant }).lean();

        if (!settings?.metaIntegration?.tokenExpiresAt) {
            return true;
        }

        return new Date() >= new Date(settings.metaIntegration.tokenExpiresAt);
    } catch (error) {
        console.error("Error checking token expiration:", error);
        return true;
    }
}
