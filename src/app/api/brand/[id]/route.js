import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";
import BrandService from "../../../lib/services/brandService";
import { BrandSchema } from "../../../lib/models/Brand.js";
import { saveFile } from "@/app/config/fileUpload";

// Helper to parse FormData in Next.js
async function parseFormData(req) {
  try {
    const formData = await req.formData();
    const fields = {};
    const files = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value;
      } else {
        fields[key] = value;
      }
    }

    return { fields, files };
  } catch (error) {
    throw new Error(`Failed to parse form data: ${error.message}`);
  }
}

export async function GET(req, context) {
  try {
    // Handle both old and new Next.js patterns
    let id;
    try {
      if (context && context.params) {
        if (context.params instanceof Promise) {
          const params = await context.params;
          id = params?.id;
        } else if (
          typeof context.params === "object" &&
          context.params !== null
        ) {
          id = context.params.id;
        }
      }
    } catch (paramError) {
      console.warn("Error accessing context.params:", paramError);
    }

    // Fallback: Extract ID from URL path
    if (!id) {
      try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/").filter((p) => p);
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
            id = part;
            break;
          }
        }
      } catch (urlError) {
        console.error("Error extracting ID from URL:", urlError);
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid brandId: undefined" },
        { status: 400 }
      );
    }

    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //console.log("Connection name in route:", conn.name);
    const Brand = conn.models.Brand || conn.model("Brand", BrandSchema);
    //console.log("Models registered:", { Brand: Brand.modelName });
    const brandService = new BrandService(conn);

    const brand = await brandService.getBrandById(id);

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    //console.error("Route GET brand by ID error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    // Handle both old and new Next.js patterns
    let id;
    try {
      if (context && context.params) {
        if (context.params instanceof Promise) {
          const params = await context.params;
          id = params?.id;
        } else if (
          typeof context.params === "object" &&
          context.params !== null
        ) {
          id = context.params.id;
        }
      }
    } catch (paramError) {
      console.warn("Error accessing context.params:", paramError);
    }

    // Fallback: Extract ID from URL path
    if (!id) {
      try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/").filter((p) => p);
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
            id = part;
            break;
          }
        }
      } catch (urlError) {
        console.error("Error extracting ID from URL:", urlError);
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid brandId: undefined" },
        { status: 400 }
      );
    }

    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //console.log("Connection name in route:", conn.name);
    const Brand = conn.models.Brand || conn.model("Brand", BrandSchema);
    //console.log("Models registered:", { Brand: Brand.modelName });
    const brandService = new BrandService(conn);

    const { fields, files } = await parseFormData(req);
    const body = { ...fields };

    // Handle image upload
    if (files.image) {
      const image = await saveFile(files.image);
      body.image = image;
    }

    // Convert string booleans to actual booleans
    if (body.isFeatured) {
      body.isFeatured = body.isFeatured === "true" || body.isFeatured === true;
    }
    if (body.status) {
      body.status = body.status === "true" || body.status === true;
    }

    const updatedBrand = await brandService.updateBrand(id, body);

    if (!updatedBrand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found or could not be updated",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error) {
    //console.error("Route PUT brand error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    console.log("DELETE /api/brand/[id] - Received request");
    console.log("Request URL:", req.url);

    // Handle both old and new Next.js patterns
    let id;
    try {
      if (context && context.params) {
        // Next.js 15+ pattern - params is a Promise
        if (context.params instanceof Promise) {
          const params = await context.params;
          id = params?.id;
        } else if (
          typeof context.params === "object" &&
          context.params !== null
        ) {
          // Next.js 13-14 pattern - params is an object
          id = context.params.id;
        }
        console.log("ID from context.params:", id);
      }
    } catch (paramError) {
      console.warn("Error accessing context.params:", paramError);
    }

    // Fallback: Extract ID from URL path
    if (!id) {
      try {
        const url = new URL(req.url);
        const pathname = url.pathname;
        console.log("Pathname:", pathname);
        // Extract ID from path like /api/brand/{id}
        const pathParts = pathname.split("/").filter((p) => p);
        // Find the last segment that looks like an ObjectId (24 hex chars)
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
            id = part;
            console.log("ID extracted from URL path:", id);
            break;
          }
        }
      } catch (urlError) {
        console.error("Error extracting ID from URL:", urlError);
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid brandId: undefined" },
        { status: 400 }
      );
    }

    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //console.log("Connection name in route:", conn.name);
    const Brand = conn.models.Brand || conn.model("Brand", BrandSchema);
    //console.log("Models registered:", { Brand: Brand.modelName });
    const brandService = new BrandService(conn);

    const deleted = await brandService.deleteBrand(id);

    if (!deleted) {
      console.error(
        "DELETE /api/brand/[id] - Brand not found or could not be deleted for ID:",
        id
      );
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found or could not be deleted",
        },
        { status: 404 }
      );
    }

    console.log("DELETE /api/brand/[id] - Successfully deleted brand:", id);
    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/brand/[id] - Error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
