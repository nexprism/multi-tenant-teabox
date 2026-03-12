import { getSubdomain } from "@/app/lib/tenantDb";
import { getDbConnection } from "../../../lib/tenantDb";

import { NextResponse } from "next/server";
import { AddressRepository } from "@/app/lib/repository/addressRepository";
import {
  deleteAddressController,
  updateAddressController,
} from "@/app/lib/controllers/addressController";

// GET /api/address/[id] - get by id or get addresses by user id
export async function GET(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const { id } = params;
    const repo = new AddressRepository(conn);

    // Check if this is a request for addresses by user ID
    const { searchParams } = new URL(request.url);
    const isUserQuery = searchParams.get("user") === "true";

    let address;
    if (isUserQuery) {
      // Get addresses by user ID
      address = await repo.getByUserId(id);
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // Get single address by address ID
      address = await repo.model.findById(id).populate("user");
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid address ID format" },
        { status: 400 }
      );
    }

    if (!address || (Array.isArray(address) && address.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: address });
  } catch (err) {
    //console.error("GET /api/address/[id] error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error fetching address" },
      { status: 500 }
    );
  }
}

// PATCH /api/blog/[id] - edit blog
export async function PATCH(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const { id } = params;
    const form = await request.json();
    const result = await updateAddressController(form, conn, id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Error updating address" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[id] - delete blog
export async function DELETE(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const { id } = params;
    const result = await deleteAddressController(conn, id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Error deleting address" },
      { status: 500 }
    );
  }
}
