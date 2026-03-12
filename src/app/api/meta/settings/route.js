import { NextResponse } from "next/server";
import dbConnect from "@/app/connection/dbConnect";
import { getSubdomain } from "@/app/lib/tenantDb";
import {
    validateAccessToken,
    validateAdAccount,
    validatePixel,
    exchangeForLongLivedToken,
    getAdAccounts,
    getPixels,
} from "@/app/lib/services/metaService";
import {
    saveMetaSettings,
    getMetaSettings,
    disconnectMetaIntegration,
} from "@/app/lib/repository/metaRepository";

/**
 * GET: Retrieve Meta integration settings
 */
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const tenant = searchParams.get("tenant") || getSubdomain(request);

        const result = await getMetaSettings(tenant);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 404 }
            );
        }

        // Don't send sensitive data to client
        const safeData = {
            ...result.data,
            accessToken: result.data.accessToken ? "***********" : null,
            appSecret: result.data.appSecret ? "***********" : null,
        };

        return NextResponse.json({
            success: true,
            data: safeData,
        });
    } catch (error) {
        console.error("Error in GET /api/meta/settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST: Save Meta integration settings
 * Body: {
 *   tenant: string,
 *   adAccountId: string,
 *   pixelId: string,
 *   accessToken: string,
 *   appId: string (optional),
 *   appSecret: string (optional),
 *   shortLivedToken: string (optional - will be exchanged for long-lived)
 * }
 */
export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            tenant = getSubdomain(request) || "default",
            adAccountId,
            pixelId,
            accessToken,
            appId,
            appSecret,
            shortLivedToken,
        } = body;

        // Validate required fields
        if (!adAccountId || !pixelId) {
            return NextResponse.json(
                { error: "adAccountId and pixelId are required" },
                { status: 400 }
            );
        }

        let finalAccessToken = accessToken;
        let tokenExpiresAt = null;

        // If short-lived token is provided, exchange it for long-lived token
        if (shortLivedToken && appId && appSecret) {
            const tokenResult = await exchangeForLongLivedToken(
                shortLivedToken,
                appId,
                appSecret
            );

            if (!tokenResult.success) {
                return NextResponse.json(
                    { error: "Failed to exchange token: " + tokenResult.error },
                    { status: 400 }
                );
            }

            finalAccessToken = tokenResult.accessToken;
            // Calculate expiration date (expiresIn is in seconds)
            tokenExpiresAt = new Date(
                Date.now() + (tokenResult.expiresIn * 1000)
            );
        }

        if (!finalAccessToken) {
            return NextResponse.json(
                { error: "accessToken or shortLivedToken is required" },
                { status: 400 }
            );
        }

        // Validate access token
        const tokenValidation = await validateAccessToken(finalAccessToken);
        if (!tokenValidation.valid) {
            return NextResponse.json(
                { error: "Invalid access token: " + tokenValidation.error },
                { status: 400 }
            );
        }

        // Validate ad account
        const adAccountValidation = await validateAdAccount(
            adAccountId,
            finalAccessToken
        );
        if (!adAccountValidation.valid) {
            return NextResponse.json(
                {
                    error: "Invalid ad account: " + adAccountValidation.error,
                },
                { status: 400 }
            );
        }

        // Validate pixel
        const pixelValidation = await validatePixel(pixelId, finalAccessToken);
        if (!pixelValidation.valid) {
            return NextResponse.json(
                { error: "Invalid pixel: " + pixelValidation.error },
                { status: 400 }
            );
        }

        // Save settings to database
        const result = await saveMetaSettings(tenant, {
            adAccountId,
            pixelId,
            accessToken: finalAccessToken,
            appId,
            appSecret,
            tokenExpiresAt,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: "Failed to save settings: " + result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Meta integration configured successfully",
            data: {
                adAccountId,
                pixelId,
                isConnected: true,
                connectedAt: result.data.connectedAt,
                tokenExpiresAt: result.data.tokenExpiresAt,
                adAccountInfo: adAccountValidation.account,
                pixelInfo: pixelValidation.pixel,
            },
        });
    } catch (error) {
        console.error("Error in POST /api/meta/settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE: Disconnect Meta integration
 */
export async function DELETE(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const tenant = searchParams.get("tenant") || getSubdomain(request);

        const result = await disconnectMetaIntegration(tenant);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Meta integration disconnected successfully",
        });
    } catch (error) {
        console.error("Error in DELETE /api/meta/settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
