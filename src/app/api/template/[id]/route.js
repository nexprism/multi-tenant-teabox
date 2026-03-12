import { NextResponse } from "next/server";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb";
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "@/app/lib/controllers/templateController";
import mongoose from "mongoose";

// GET /api/template/[id]
export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid ObjectId" },
      { status: 400 }
    );
  }
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json(
      { success: false, message: "DB not found" },
      { status: 404 }
    );
  }
  try {
    const result = await getTemplateById(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/template/[id]
export async function PUT(req, context) {
  const { params } = context;
  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid ObjectId" },
      { status: 400 }
    );
  }

  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json(
      { success: false, message: "DB not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const result = await updateTemplate(id, body, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/template/[id]
export async function DELETE(req, context) {
  const { params } = context;
  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid ObjectId" },
      { status: 400 }
    );
  }

  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json(
      { success: false, message: "DB not found" },
      { status: 404 }
    );
  }

  try {
    const result = await deleteTemplate(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
