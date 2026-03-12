import { NextResponse } from "next/server";
import UserService from "../../../lib/services/userService.js";
import { redisWrapper } from "../../../config/redis.js";
import { getSubdomain } from "@/app/lib/tenantDb";
import { getDbConnection } from "../../../lib/tenantDb.js";
import axios from "axios";

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

    const body = await request.json();
    let { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Phone is required" },
        { status: 400 }
      );
    }

    // Clean phone number - remove all non-digits
    phone = phone.replace(/\D/g, "");

    // If it has 12 digits and starts with 91, it might already have country code.
    // Otherwise if it's 10 digits, we'll prefix it later in MSG91 call.
    if (phone.length > 10 && phone.startsWith("91")) {
      phone = phone.slice(2);
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number. Please enter a 10-digit number." },
        { status: 400 }
      );
    }

    const userService = new UserService(conn);
    const user = await userService.getUserByPhone(phone);

    // Documented test numbers that use fixed OTP 123456
    const testNumbers = [
     
      "7014629750"
    ];

    const isTestNumber = testNumbers.includes(phone);
    const otp = isTestNumber
      ? "123456"
      : Math.floor(100000 + Math.random() * 900000).toString();

    let deliveryMethod = isTestNumber ? "mock" : "sms";
    let successMessage = isTestNumber
      ? `Mock OTP (123456) sent to ${phone}`
      : `OTP sent to ${phone}`;

    // Save OTP in Redis
    if (redisWrapper.isEnabled()) {
      await redisWrapper.setex(`otp:${phone}`, 300, otp);
    }

    // 🔴 MSG91 API CALL (Skip for test number)
    if (!isTestNumber) {
      const authKey = process.env.MSG91_AUTH_KEY;
      const templateId = process.env.MSG91_TEMPLATE_ID || "694a2080301fbd6fd46bc6a2";
      const otpVar = process.env.MSG91_OTP_VAR_NAME || "OTP";

      if (!authKey) {
        console.warn("⚠️ MSG91_AUTH_KEY is missing in environment variables.");
        // If in development and no auth key, allow code to continue with mock behavior
        if (process.env.NODE_ENV === "development") {
          deliveryMethod = "mock";
          successMessage = `Mock OTP (${otp}) sent to ${phone} (Development Mode)`;
          console.log(`🛠️ [DEV MODE] Using mock OTP ${otp} for number ${phone} because MSG91 is not configured.`);
        } else {
          throw new Error("SMS Service configuration is missing (MSG91_AUTH_KEY).");
        }
      } else {
        try {
          const msg91Payload = {
            template_id: templateId,
            short_url: 0,
            recipients: [
              {
                mobiles: `91${phone}`,
                [otpVar]: otp,
              },
            ],
          };

          if (process.env.MSG91_SENDER_ID) {
            msg91Payload.sender = process.env.MSG91_SENDER_ID;
          }

          await axios.post(
            "https://api.msg91.com/api/v5/flow/",
            msg91Payload,
            {
              headers: {
                authkey: authKey,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (msgError) {
          const errorDetail = msgError?.response?.data || msgError.message;
          console.log("❌ MSG91 Delivery Error:", errorDetail);

          // Construct a user-friendly error message based on MSG91 response
          let userMessage = "Failed to send SMS OTP.";
          if (typeof errorDetail == 'object' && errorDetail.type === 'error') {
            userMessage = `SMS Service Error: ${errorDetail.message}`;
          }

          const finalError = new Error(userMessage);
          finalError.details = errorDetail;
          throw finalError;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        data: {
          isNewUser: !user,
          deliveryMethod,
          redisEnabled: redisWrapper.isEnabled(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorData = error.details || error?.response?.data || error.message;
    console.error("OTP request failure:", errorData);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send OTP",
        error: errorData,
      },
      { status: 500 }
    );
  }
}
