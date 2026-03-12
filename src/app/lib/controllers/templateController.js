import { errorResponse, successResponse } from "@/app/utils/response.js";
import TemplateService from "../services/templateService.js";

// Remove global instance, always use tenant-based connection

export async function createTemplate(data, conn) {
  try {
    //console.log("Creating template with data:", data);
    //console.log(
    //   "Using tenant connection:",
    //   conn ? "Connected" : "No connection"
    // );
    const templateService = new TemplateService(conn);
    const result = await templateService.createTemplate(data);
    return result;
  } catch (error) {
    //console.error("createTemplate error:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "Error creating template",
        error: error.message,
      },
    };
  }
}

export async function getTemplateById(id, conn) {
  try {
    const templateService = new TemplateService(conn);
    //console.log("Fetching template by ID:", id);
    const result = await templateService.getTemplateById(id);
    //console.log("result is ---> ", result);
    if (!result.body.data) {
      return {
        status: 404,
        body: errorResponse("Template not found", 404),
      };
    }
    return {
      status: 200,
      body: successResponse(result.body.data, "Template fetched successfully"),
    };
  } catch (err) {
    //console.error("getTemplateById error:", err.message);
    return {
      status: 500,
      body: errorResponse("Server error", 500),
    };
  }
}

export async function getTemplateByProductId(productId, conn) {
  try {
    //console.log("Getting template by Product ID:", productId);
    const templateService = new TemplateService(conn);
    const result = await templateService.getTemplateByProductId(productId);
    return result;
  } catch (error) {
    //console.error("getTemplateByProductId error:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "Error fetching template by product ID",
        error: error.message,
      },
    };
  }
}

export async function updateTemplate(id, data, conn) {
  try {
    //console.log("Updating template:", id, "with data:", data);
    const templateService = new TemplateService(conn);
    const result = await templateService.updateTemplate(id, data);
    return result;
  } catch (error) {
    //console.error("updateTemplate error:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "Error updating template",
        error: error.message,
      },
    };
  }
}

export async function deleteTemplate(id, conn) {
  try {
    //console.log("Deleting template:", id);
    const templateService = new TemplateService(conn);
    const result = await templateService.deleteTemplate(id);
    return result;
  } catch (error) {
    //console.error("deleteTemplate error:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "Error deleting template",
        error: error.message,
      },
    };
  }
}
