import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";
import { CertificateSchema } from "../../../lib/models/Certificate.js";
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

export async function GET(req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }
    
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const Certificate =
      conn.models.Certificate || conn.model("Certificate", CertificateSchema);
    const cert = await Certificate.findById(id).lean();
    if (!cert)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    return NextResponse.json({ success: true, data: cert });
  } catch (error) {
    console.error("Certificates GET id error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }
    
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

    const cert = await Certificate.findById(id);
    if (!cert)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );

    if (files.file) {
      validateImageFile(files.file);
      // delete old file if exists
      if (cert.file) await deleteFile(cert.file);
      const uploaded = await saveFile(files.file, "uploads/certificates");
      body.file = uploaded;
    }

    Object.assign(cert, body);
    await cert.save();
    return NextResponse.json({
      success: true,
      message: "Certificate updated",
      data: cert,
    });
  } catch (error) {
    console.error("Certificates PUT error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
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

    const Certificate =
      conn.models.Certificate || conn.model("Certificate", CertificateSchema);
    const cert = await Certificate.findById(id);
    if (!cert) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    // soft delete
    cert.deletedAt = new Date();
    await cert.save();
    return NextResponse.json({ success: true, message: "Certificate deleted" });
  } catch (error) {
    console.error("Certificates DELETE error:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
