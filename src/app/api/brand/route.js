import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb";
import BrandService from "../../lib/services/brandService";
import { BrandSchema } from "../../lib/models/Brand.js";
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

export async function GET(req) {
  try {
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

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Parse optional filters param (expected as JSON string)
    const filtersParam = searchParams.get("filters");
    let filtersObj = undefined;
    if (filtersParam) {
      try {
        filtersObj = JSON.parse(filtersParam);
      } catch (err) {
        //console.warn("Invalid JSON in filters param, ignoring:", err.message);
        filtersObj = undefined;
      }
    }

    let result;
    if (searchQuery) {
      result = await brandService.searchBrandsByName(searchQuery, page, limit);
    } else {
      result = await brandService.getAllBrands({
        page,
        limit,
        filters: filtersObj,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Brands fetched successfully",
      data: result.results,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
      pageSize: result.pageSize,
    });
  } catch (error) {
    //console.error("Route GET brands error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
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
    //console.log("files:", files);
    // Handle image upload
    if (files.image) {
      const image = await saveFile(files.image);
      //console.log("Image uploaded --->>:", image);
      body.image = image;
    }

    // Convert string booleans to actual booleans
    if (body.isFeatured) {
      body.isFeatured = body.isFeatured === "true" || body.isFeatured === true;
    }
    if (body.status) {
      body.status = body.status === "true" || body.status === true;
    }

    const newBrand = await brandService.createBrand(body);

    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully",
        data: newBrand,
      },
      { status: 201 }
    );
  } catch (error) {
    //console.error("Route POST brand error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
