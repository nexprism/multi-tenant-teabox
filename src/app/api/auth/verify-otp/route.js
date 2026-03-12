import dbConnect from "../../../connection/dbConnect";
import { NextResponse } from "next/server";
import UserService from "../../../lib/services/userService.js";
import { Token } from "../../../middleware/generateToken.js";
import mongoose from "mongoose";
import { redisWrapper } from "../../../config/redis.js";
import bcrypt from "bcryptjs";
import roleSchema from "../../../lib/models/role.js";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb.js";

// Helper to send tracking events to internal tracking endpoint (fire-and-forget)
async function sendTrackingEvent(request, eventPayload, subdomain = null) {
  // Build track URL relative to current request host
  const trackUrl = new URL("/api/track", request.url).href;

  // Include tenant info and small metadata
  const evt = {
    ...eventPayload,
    timestamp: new Date().toISOString(),
    source: "auth.verify-otp",
    tenant: subdomain || null,
  };

  const body = JSON.stringify({ batch: [evt] });

  try {
    // Fire-and-forget: do not throw if tracking fails.
    // Forward tenant and host headers so tracking can resolve tenant DB.
    const headers = {
      "Content-Type": "application/json",
      // forward tenant header if present on original request
      "x-tenant": request.headers.get("x-tenant") || (subdomain || ""),
      // mark as internal
      "x-internal-call": "1",
      "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
    };

    // keepalive helps ensure the request gets sent even if the handler finishes
    fetch(trackUrl, {
      method: "POST",
      headers,
      body,
      keepalive: true,
      // do not follow redirects, not needed
      redirect: "manual",
    }).catch(() => {
      // swallow any network/fetch errors
    });
  } catch (e) {
    // swallow unexpected errors
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
        if (redisWrapper.isEnabled()) {
          await redisWrapper.set(`accessToken:${accessToken}`, "valid");
          await redisWrapper.set(
            `refreshToken:${refreshToken}`,
            user._id.toString()
          );
        }

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

        // Send LOGIN tracking event (non-blocking)
        sendTrackingEvent(request, {
          type: "LOGIN",
          userId: user._id ? user._id.toString() : null,
          user: {
            _id: user._id ? user._id.toString() : null,
            name: user.name || null,
            phone: user.phone || null,
            email: user.email || null,
          },
          phone,
        }, subdomain);

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
        if (redisWrapper.isEnabled()) {
          await redisWrapper.set(`accessToken:${accessToken}`, "valid");
          await redisWrapper.set(
            `refreshToken:${refreshToken}`,
            newUser._id.toString()
          );
        }

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

        // Send SIGNUP tracking event (non-blocking)
        sendTrackingEvent(request, {
          type: "SIGNUP",
          userId: newUser._id ? newUser._id.toString() : null,
          user: {
            _id: newUser._id ? newUser._id.toString() : null,
            name: newUser.name || null,
            phone: newUser.phone || null,
            email: newUser.email || null,
          },
          phone,
        }, subdomain);

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
