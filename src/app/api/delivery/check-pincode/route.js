import { ShippingSchema } from "@/app/lib/models/Shipping";
import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgPincode, desPincode } = body;

    if (!orgPincode || !desPincode) {
      return NextResponse.json(
        {
          success: false,
          message: "Both orgPincode and desPincode are required",
        },
        { status: 400 }
      );
    }

    // Simplified order flow: bypass all shipping logics and always return success.
    return NextResponse.json({
      success: true,
      message: "Pincode is deliverable",
      method: "Standard Delivery", // Dummy method name
      priority: 1,
      data: {
        orgPincode,
        desPincode,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
