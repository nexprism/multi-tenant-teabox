import { NextResponse } from "next/server";
import { Token } from "@/app/middleware/generateToken.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/connection/dbConnect.js";
import UserService from "@/app/lib/services/userService.js";
import redisWrapper from "@/app/config/redisWrapper.js";
import roleSchema from "@/app/lib/models/role";

// Helper to extract subdomain from x-tenant header or host header
function getSubdomain(request) {
  // Prefer x-tenant header if present
  const xTenant = request.headers.get("x-tenant");
  if (xTenant) return xTenant;
  const host = request.headers.get("host") || "";
  // e.g. tenant1.localhost:5173 or tenant1.example.com
  const parts = host.split(".");
  if (parts.length > 2) return parts[0];
  if (parts.length === 2 && parts[0] !== "localhost") return parts[0];
  return null;
}

// Helper to get DB connection based on subdomain
async function getDbConnection(subdomain) {
  if (!subdomain || subdomain === "localhost") {
    // Use default DB (from env)
    return await dbConnect();
  } else {
    // Connect to global DB to get tenant DB URI
    await dbConnect();

    // Define tenant schema properly
    const tenantSchema = new mongoose.Schema(
      {
        name: String,
        dbUri: String,
        subdomain: String,
      },
      { collection: "tenants" }
    );

    const Tenant =
      mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant?.dbUri) return null;
    // Connect to tenant DB
    return await dbConnect(tenant.dbUri);
  }
}

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
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: "Phone & OTP required" },
        { status: 400 }
      );
    }

    try {
      if (!redisWrapper.isEnabled()) {
        // If Redis is disabled, use development OTP for testing
        if (otp !== "123456") {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid OTP (Redis disabled - use 123456 for testing)",
            },
            { status: 400 }
          );
        }
        //console.log("📴 Redis disabled - using development OTP validation");
      } else {
        const storedOtp = await redisWrapper.get(`otp:${phone}`);

        if (!storedOtp || storedOtp !== otp) {
          return NextResponse.json(
            { success: false, message: "Invalid or expired OTP" },
            { status: 400 }
          );
        }

        // Delete the OTP after successful verification
        await redisWrapper.del(`otp:${phone}`);
      }

      let user = await userService.getUserByPhone(phone);

      // If user exists → mark as verified if not already and log them in
      if (user) {
        if (!user.isVerified) {
          user = await userService.updateUserById(user._id, {
            isVerified: true,
          });
        }

        const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
          Token.generateTokens(user);

        // Store tokens in Redis without TTL (tokens no longer carry an `exp`)
        await redisWrapper.set(`accessToken:${accessToken}`, "valid");
        await redisWrapper.set(
          `refreshToken:${refreshToken}`,
          user._id.toString()
        );

        // Create response with cookies
        const response = NextResponse.json(
          {
            success: true,
            message: "Login successful",
            data: {
              user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                isVerified: true,
              },
              tokens: { accessToken, refreshToken },
            },
          },
          { status: 200 }
        );

        // Set cookies
        Token.setTokensCookies(
          response,
          accessToken,
          refreshToken,
          accessTokenExp,
          refreshTokenExp
        );

        return response;
      }

      // If user is new → create account automatically and log them in
      try {
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

        // Create user with phone number as name initially, no email, dummy password
        const newUser = await userService.createUser({
          name: "", // Temporary name, user can update later
          email: "", // Temporary email, user can update later
          passwordHash: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          phone,
          role: finalRole,
          tenant: finalTenant,
          isVerified: true, // Already verified via OTP
          isActive: true,
          isDeleted: false,
        });

        // Generate tokens for the new user
        const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
          Token.generateTokens(newUser);

        // Store tokens in Redis without TTL (tokens no longer carry an `exp`)
        await redisWrapper.set(`accessToken:${accessToken}`, "valid");
        await redisWrapper.set(
          `refreshToken:${refreshToken}`,
          newUser._id.toString()
        );

        // Return user info (without password) and tokens
        const userObj = newUser.toObject();
        delete userObj.passwordHash;

        const response = NextResponse.json(
          {
            success: true,
            message: "Account created and login successful",
            data: {
              user: userObj,
              tokens: { accessToken, refreshToken },
            },
          },
          { status: 201 }
        );

        // Set cookies
        Token.setTokensCookies(
          response,
          accessToken,
          refreshToken,
          accessTokenExp,
          refreshTokenExp
        );

        return response;
      } catch (createError) {
        //console.error("Error creating new user:", createError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create account",
            error: createError.message,
          },
          { status: 500 }
        );
      }
    } catch (redisError) {
      //console.error("Redis error:", redisError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to verify OTP",
          error: redisError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    //console.error("POST /auth/verify-otp error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify OTP",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
