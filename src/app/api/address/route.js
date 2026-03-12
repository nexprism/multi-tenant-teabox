import { getSubdomain } from "@/app/lib/tenantDb";
import dbConnect from "../../connection/dbConnect";
import { getDbConnection } from "../../lib/tenantDb";
import {
  createBlogController,
  getBlogsController,
} from "../../lib/controllers/blogController";
import { NextResponse } from "next/server";
import {
  createAddressController,
  getAddressesController,
} from "@/app/lib/controllers/addressController";

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
    const form = await request.json();
    const result = await createAddressController(form, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //console.error("POST /address error:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    // pageNum and limitNum can be passed as query params for pagination
    const result = await getAddressesController(query, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //console.error("GET /address error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
