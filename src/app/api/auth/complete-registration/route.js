import dbConnect from "../../../connection/dbConnect";
import { NextResponse } from "next/server";
import UserService from "../../../lib/services/userService.js";
import { Token } from "../../../middleware/generateToken.js";
import mongoose from "mongoose";
import { redisWrapper } from "../../../config/redis.js";
import bcrypt from "bcryptjs";
import roleSchema from "../../../lib/models/role.js";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb.js";

export async function POST(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    const userService = new UserService(conn);
    const body = await request.json();
    const { name, email, password } = body;

    // Get sessionId from cookies
    const sessionId = request.cookies.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session expired. Please verify OTP again.",
        },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, and password are required",
        },
        { status: 400 }
      );
    }

    try {
      if (!redisWrapper.isEnabled()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Redis is disabled. Session management requires Redis to be enabled.",
          },
          { status: 503 }
        );
      }

      // Get phone number from session
      const phone = await redisWrapper.get(`session:${sessionId}`);
      if (!phone) {
        return NextResponse.json(
          {
            success: false,
            message: "Session expired. Please verify OTP again.",
          },
          { status: 400 }
        );
      }

      // Check if user already exists with this email
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User with this email already exists",
          },
          { status: 400 }
        );
      }

      // Check if user already exists with this phone
      const existingPhoneUser = await userService.findByPhone(phone);
      if (existingPhoneUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User with this phone number already exists",
          },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Get default customer role
      const RoleModel = conn.models.Role || conn.model("Role", roleSchema);
      const customerRole = await RoleModel.findOne({ name: "Customer" });

      let finalTenant = null;
      let finalRole = null;

      if (customerRole) {
        finalRole = customerRole._id;
        if (customerRole.scope === "tenant") {
          finalTenant = customerRole.tenantId || null;
        }
      }

      // Create user
      const user = await userService.createUser({
        name,
        email,
        phone,
        passwordHash,
        role: finalRole,
        tenant: finalTenant,
        isVerified: true, // Already verified via OTP
        isActive: true,
        isDeleted: false,
      });

      // Generate tokens
      const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
        Token.generateTokens(user);

      // Store tokens in Redis without TTL (tokens no longer carry an `exp`)
      await redisWrapper.set(`accessToken:${accessToken}`, "valid");
      await redisWrapper.set(
        `refreshToken:${refreshToken}`,
        user._id.toString()
      );

      // Delete session
      await redisWrapper.del(`session:${sessionId}`);

      // Return user info (without password) and tokens
      const userObj = user.toObject();
      delete userObj.passwordHash;

      const response = NextResponse.json(
        {
          success: true,
          message: "Registration successful",
          data: {
            user: userObj,
            tokens: { accessToken, refreshToken },
          },
        },
        { status: 201 }
      );

      // Set cookies and remove session cookie
      Token.setTokensCookies(
        response,
        accessToken,
        refreshToken,
        accessTokenExp,
        refreshTokenExp
      );
      response.cookies.set("sessionId", "", { maxAge: 0 }); // Clear session cookie

      return response;
    } catch (redisError) {
      //console.error("Redis error:", redisError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to complete registration",
          error: redisError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    //console.error("POST /auth/complete-registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Registration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
