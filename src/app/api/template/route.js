import dbConnect from "../../connection/dbConnect.js";
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplateByProductId,
  updateTemplate,
  deleteTemplate,
} from "../../lib/controllers/templateController.js";
import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import TemplateService from "../../lib/services/templateService.js";

// POST: Create a new template
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
    const result = await createTemplate(body, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error("POST /template error:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

// GET: Get template by ID or productId, or get all templates
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
    const id = searchParams.get("id");
    const productId = searchParams.get("productId");

    //consolle.log("GET /template id:", id, "productId:", productId);

    if (id) {
      const result = await getTemplateById(id, conn);
      return NextResponse.json(result.body, { status: result.status });
    } else if (productId) {
      const result = await getTemplateByProductId(parseInt(productId), conn);
      return NextResponse.json(result.body, { status: result.status });
    } else {
      const query = Object.fromEntries(searchParams.entries());
      const templateService = new TemplateService(conn);
      const result = await templateService.getAllTemplates(query);
      //consolle.log("GET /template result:", result);
      return NextResponse.json({
        success: true,
        message: 'Templates fetched successfully',
        data: result.data
      }, { status: 200 });
    }
  } catch (err) {
    //consolle.error("GET /template error:", err);
    //consolle.log("Error details:", err.message);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT: Update template by ID
export async function PUT(request) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Template ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateTemplate(id, body, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error("PUT /template error:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

// DELETE: Delete template by ID
export async function DELETE(request) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Template ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteTemplate(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error("DELETE /template error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
