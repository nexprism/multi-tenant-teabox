import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb";
import { CertificateSchema } from "../../lib/models/Certificate.js";
import {
  saveFile,
  validateImageFile,
  deleteFile,
} from "@/app/config/fileUpload";

async function parseFormData(req) {
  const formData = await req.formData();
  const fields = {};
  const files = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) files[key] = value;
    else fields[key] = value;
  }
  return { fields, files };
}

export async function GET(req) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const Certificate =
      conn.models.Certificate || conn.model("Certificate", CertificateSchema);

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const filter = { deletedAt: null };
    if (searchQuery) filter.name = { $regex: searchQuery, $options: "i" };

    const totalCount = await Certificate.countDocuments(filter);
    const results = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      message: "Certificates fetched",
      data: results,
      currentPage: page,
      totalCount,
      pageSize: limit,
    });
  } catch (error) {
    //console.error("Certificates GET error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const Certificate =
      conn.models.Certificate || conn.model("Certificate", CertificateSchema);

    const { fields, files } = await parseFormData(req);
    const body = { ...fields };

    // handle file upload
    if (files.file) {
      validateImageFile(files.file);
      const uploaded = await saveFile(files.file, "uploads/certificates");
      body.file = uploaded;
    }

    // Convert category id if empty
    if (body.category === "" || body.category === null) delete body.category;

    if (body.createdBy === "" || body.createdBy === null) delete body.createdBy;

    const created = await Certificate.create(body);
    return NextResponse.json(
      { success: true, message: "Certificate created", data: created },
      { status: 201 }
    );
  } catch (error) {
    //console.error("Certificates POST error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
