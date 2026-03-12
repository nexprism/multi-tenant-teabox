import { NextResponse } from "next/server";
import { Token } from "../../../middleware/generateToken.js";
import UserService from "../../../lib/services/userService.js";
import { getDbConnection, getSubdomain } from "../../../lib/tenantDb.js";
import { redisWrapper } from "../../../config/redis.js";

export async function POST(request) {
  try {
    const body = await request.json();
    let refreshToken = body.refreshToken;

    // If not in body, try to get from headers or cookies
    if (!refreshToken) {
      refreshToken = request.headers.get("x-refresh-token");
    }

    if (!refreshToken) {
      const cookies = request.headers.get("cookie");
      if (cookies) {
        const refreshTokenMatch = cookies.match(/refreshToken=([^;]+)/);
        if (refreshTokenMatch) {
          refreshToken = refreshTokenMatch[1];
        }
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token is required",
        },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = await Token.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    // Check if refresh token is still valid in Redis
    if (redisWrapper.isEnabled()) {
      const storedUserId = await redisWrapper.get(
        `refreshToken:${refreshToken}`
      );
      if (!storedUserId || storedUserId !== decoded.id) {
        return NextResponse.json(
          {
            success: false,
            message: "Refresh token not found or expired",
          },
          { status: 401 }
        );
      }
    }

    // Get user from database
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
        },
        { status: 500 }
      );
    }

    const userService = new UserService(conn);
    const user = await userService.findById(decoded.id);

    if (!user || user.deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found or inactive",
        },
        { status: 404 }
      );
    }

    // Generate new tokens
    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExp: newAccessTokenExp,
      refreshTokenExp: newRefreshTokenExp,
    } = Token.generateTokens(user);

    // Update tokens in Redis
    if (redisWrapper.isEnabled()) {
      // Remove old refresh token
      await redisWrapper.del(`refreshToken:${refreshToken}`);

      // Store new tokens without TTL (tokens no longer carry an `exp`)
      await redisWrapper.set(`accessToken:${newAccessToken}`, "valid");
      await redisWrapper.set(
        `refreshToken:${newRefreshToken}`,
        user._id.toString()
      );
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Tokens refreshed successfully",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isSuperAdmin: user.isSuperAdmin,
            tenant: user.tenant,
            role: user.role,
          },
        },
      },
      { status: 200 }
    );

    // Set new token cookies
    Token.setTokensCookies(
      response,
      newAccessToken,
      newRefreshToken,
      newAccessTokenExp,
      newRefreshTokenExp
    );

    return response;
  } catch (error) {
    //console.error("Refresh token error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to refresh tokens",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
