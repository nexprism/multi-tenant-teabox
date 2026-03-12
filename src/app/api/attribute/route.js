import {
  createAttribute,
  getAllAttributes,
  searchAttributesByName,
} from "./../../lib/controllers/attributeController";
import { getSubdomain } from "../../lib/tenantDb";
import { getDbConnection } from "../../lib/tenantDb";

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return toNextResponse({ success: false, message: "DB not found" }, 404);
    }
    const body = await req.json();
    
    // Validate that body exists
    if (!body) {
      return toNextResponse({ 
        success: false, 
        message: "Request body is required",
        data: null 
      }, 400);
    }
    
    const result = await createAttribute({ body }, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    console.error('Attribute POST route error:', error);
    return toNextResponse({ 
      success: false, 
      message: error.message || "Server error",
      data: null 
    }, 500);
  }
};

export const GET = async (req) => {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return toNextResponse({ success: false, message: "DB not found" }, 404);
    }
    const { searchParams } = new URL(req.url);

    const query = Object.fromEntries(searchParams.entries());

    const result = await getAllAttributes(query, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    return toNextResponse({ success: false, message: error.message }, 500);
  }
};
