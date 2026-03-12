import axios from "axios";

/**
 * Meta (Facebook) CRM/Ads Service
 * Handles all Meta API interactions including metrics fetching and account validation
 */

const META_API_VERSION = "v19.0";
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Validate Meta Access Token
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} Token validation result
 */
export async function validateAccessToken(accessToken) {
    try {
        const response = await axios.get(
            `${META_GRAPH_API_BASE}/me`,
            {
                params: {
                    fields: "id,name,email",
                    access_token: accessToken,
                },
            }
        );

        return {
            valid: true,
            user: response.data,
        };
    } catch (error) {
        console.error("Error validating Meta access token:", error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.data?.error?.message || "Invalid access token",
        };
    }
}

/**
 * Exchange short-lived token for long-lived token
 * @param {string} shortLivedToken - Short-lived access token
 * @param {string} appId - Meta App ID
 * @param {string} appSecret - Meta App Secret
 * @returns {Promise<Object>} Long-lived token details
 */
export async function exchangeForLongLivedToken(shortLivedToken, appId, appSecret) {
    try {
        const response = await axios.get(
            `${META_GRAPH_API_BASE}/oauth/access_token`,
            {
                params: {
                    grant_type: "fb_exchange_token",
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            }
        );

        return {
            success: true,
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in, // Usually 60 days
            tokenType: response.data.token_type,
        };
    } catch (error) {
        console.error("Error exchanging token:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || "Token exchange failed",
        };
    }
}

/**
 * Validate Ad Account Access
 * @param {string} adAccountId - Ad Account ID (without 'act_' prefix)
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} Ad account validation result
 */
export async function validateAdAccount(adAccountId, accessToken) {
    try {
        // Handle both 'act_123' and '123' formats
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        const response = await axios.get(
            `${META_GRAPH_API_BASE}/${accountId}`,
            {
                params: {
                    fields: "id,name,account_status,currency,timezone_name",
                    access_token: accessToken,
                },
            }
        );

        return {
            valid: true,
            account: response.data,
        };
    } catch (error) {
        console.error("Error validating ad account:", error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.data?.error?.message || "Invalid ad account",
        };
    }
}

/**
 * Validate Pixel Access
 * @param {string} pixelId - Pixel ID
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} Pixel validation result
 */
export async function validatePixel(pixelId, accessToken) {
    try {
        const response = await axios.get(
            `${META_GRAPH_API_BASE}/${pixelId}`,
            {
                params: {
                    fields: "id,name,creation_time,last_fired_time",
                    access_token: accessToken,
                },
            }
        );

        return {
            valid: true,
            pixel: response.data,
        };
    } catch (error) {
        console.error("Error validating pixel:", error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.data?.error?.message || "Invalid pixel",
        };
    }
}

/**
 * Fetch Meta Metrics (Ads + CRM)
 * @param {string} adAccountId - Ad Account ID
 * @param {string} pixelId - Pixel ID
 * @param {string} accessToken - Meta access token
 * @param {string} since - Start date (YYYY-MM-DD)
 * @param {string} until - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Metrics data
 */
export async function fetchMetaMetrics(adAccountId, pixelId, pageId, accessToken, since, until) {
    try {
        const accountId = adAccountId.replace(/^act_/, "");

        // 1️⃣ BASE INSIGHTS (Spend, Clicks, Purchases, Value)
        const insightsRes = await axios.get(
            `${META_GRAPH_API_BASE}/act_${accountId}/insights`,
            {
                params: {
                    fields: "spend,clicks,actions,action_values,impressions,ctr,cpc,cpm",
                    level: "account",
                    time_range: JSON.stringify({ since, until }),
                    access_token: accessToken,
                },
            }
        );

        const insights = insightsRes.data?.data?.[0] || {};

        const spend = Number(insights.spend || 0);
        const clicks = Number(insights.clicks || 0);
        const impressions = Number(insights.impressions || 0);
        const ctr = Number(insights.ctr || 0);
        const cpc = Number(insights.cpc || 0);
        const cpm = Number(insights.cpm || 0);

        // Purchases & Values
        let purchases = 0;
        let purchaseValue = 0;

        if (Array.isArray(insights.actions)) {
            const p = insights.actions.find(a => a.action_type === "purchase");
            purchases = p ? Number(p.value) : 0;
        }

        if (Array.isArray(insights.action_values)) {
            const pv = insights.action_values.find(a => a.action_type === "purchase");
            purchaseValue = pv ? Number(pv.value) : 0;
        }

        // 2️⃣ FETCH LEADS
        let totalLeads = 0;

        // Try to get leads from insights.actions first (most reliable)
        if (Array.isArray(insights.actions)) {
            const leadAction = insights.actions.find(a => a.action_type === "lead");
            if (leadAction) {
                totalLeads = Number(leadAction.value);
                console.log(`Leads from insights.actions: ${totalLeads}`);
            }
        }

        // If no leads found in actions and pageId is provided, try page lead forms as backup
        if (totalLeads === 0 && pageId) {
            try {
                const formsRes = await axios.get(
                    `${META_GRAPH_API_BASE}/${pageId}/leadgen_forms`,
                    {
                        params: {
                            access_token: accessToken,
                            fields: "id,name,leads_count"
                        }
                    }
                );

                const forms = formsRes.data?.data || [];
                console.log(`Found ${forms.length} lead forms on page ${pageId}`);

                // Sum up leads_count from all forms
                for (const form of forms) {
                    if (form.leads_count) {
                        totalLeads += Number(form.leads_count);
                    }
                }

                console.log(`Total leads from page forms: ${totalLeads}`);
            } catch (err) {
                console.warn("Lead form retrieval failed:", {
                    message: err.message,
                    status: err.response?.status,
                    error: err.response?.data?.error?.message,
                    pageId
                });
            }
        } else if (!pageId) {
            console.log("Skipping page lead forms (pageId not provided)");
        } else {
            console.log(`Leads already found in insights: ${totalLeads}`);
        }

        // 3️⃣ BASIC CALCULATIONS
        const ROAS = spend > 0 ? purchaseValue / spend : 0;
        const RPV = clicks > 0 ? purchaseValue / clicks : 0;
        const conversionRate = clicks > 0 ? (totalLeads / clicks) * 100 : 0;
        const CPL = totalLeads > 0 ? spend / totalLeads : 0;

        // 4️⃣ ADVANCED CALCULATIONS
        const MER = spend > 0 ? purchaseValue / spend : 0;       // Similar to total ROAS
        const CPP = purchases > 0 ? spend / purchases : 0;       // Cost per purchase
        const PCR = clicks > 0 ? (purchases / clicks) * 100 : 0; // Purchase conversion rate
        const RPI = impressions > 0 ? purchaseValue / impressions : 0;  // Revenue per impression
        const RPL = totalLeads > 0 ? purchaseValue / totalLeads : 0;    // Revenue per lead
        const CPML = totalLeads > 0 ? spend / (totalLeads / 1000) : 0;  // Cost per 1000 leads

        return {
            success: true,
            data: {
                spend,
                clicks,
                impressions,
                ctr,
                cpc,
                cpm,
                purchases,
                purchaseValue,
                totalLeads,

                // Basic
                ROAS: ROAS.toFixed(2),
                RPV: RPV.toFixed(2),
                conversionRate: conversionRate.toFixed(2),
                CPL: CPL.toFixed(2),

                // Advanced
                MER: MER.toFixed(2),
                CPP: CPP.toFixed(2),
                PCR: PCR.toFixed(2),
                RPI: RPI.toFixed(6),
                RPL: RPL.toFixed(2),
                CPML: CPML.toFixed(2),
            }
        };

    } catch (err) {
        console.error("Error fetching metrics:", err.response?.data || err.message);
        return {
            success: false,
            error: err.response?.data?.error?.message || "Failed to fetch metrics",
        };
    }
}


/**
 * Get Ad Accounts accessible by the user
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} List of ad accounts
 */
export async function getAdAccounts(accessToken) {
    try {
        const response = await axios.get(
            `${META_GRAPH_API_BASE}/me/adaccounts`,
            {
                params: {
                    fields: "id,name,account_status,currency,timezone_name",
                    access_token: accessToken,
                },
            }
        );

        return {
            success: true,
            accounts: response.data.data || [],
        };
    } catch (error) {
        console.error("Error fetching ad accounts:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || "Failed to fetch ad accounts",
        };
    }
}

/**
 * Get Pixels accessible by the user
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} List of pixels
 */
export async function getPixels(accessToken) {
    try {
        // 1) Fetch ad accounts
        const accountsRes = await axios.get(
            `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}`
        );

        const accounts = accountsRes.data.data || [];

        if (accounts.length === 0) {
            return {
                success: true,
                pixels: [],
                message: "No ad accounts found for this user/page",
            };
        }

        let allPixels = [];

        // 2) Loop over each account and fetch its pixels
        for (const acc of accounts) {
            const pxRes = await axios.get(
                `https://graph.facebook.com/v19.0/${acc.id}/adspixels?access_token=${accessToken}`
            );

            allPixels.push(...(pxRes.data.data || []));
        }

        return {
            success: true,
            pixels: allPixels,
        };

    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
        };
    }
}

/**
 * Get Facebook Pages accessible by the user
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} List of pages
 */
export async function getPages(accessToken) {
    try {
        const response = await axios.get(
            `${META_GRAPH_API_BASE}/me/accounts`,
            {
                params: {
                    fields: "id,name,access_token",
                    access_token: accessToken,
                },
            }
        );

        return {
            success: true,
            pages: response.data.data || [],
        };
    } catch (error) {
        console.error("Error fetching pages:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || "Failed to fetch pages",
        };
    }
}


