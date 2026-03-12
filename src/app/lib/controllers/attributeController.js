import AttributeService from "../services/attributeService.js";
import {
  attributeCreateValidator,
  attributeUpdateValidator,
} from "../../validators/attributeValidator.js";

export async function createAttribute(req, conn) {
  // Extract body from req object (route passes { body })
  const body = req.body || req;
  let value = null;
  
  try {
    if (!body || typeof body !== 'object') {
      return {
        status: 400,
        body: {
          success: false,
          message: "Invalid request data",
          data: null,
        },
      };
    }

    // Validate the request body
    const validationResult = attributeCreateValidator.validate(body);
    if (validationResult.error) {
      console.error("Attribute validation error:", validationResult.error.details);
      return {
        status: 400,
        body: {
          success: false,
          message: validationResult.error.details[0]?.message || "Validation error",
          data: validationResult.error.details,
        },
      };
    }
    
    value = validationResult.value;

    const attributeService = new AttributeService(conn);

    // Check for duplicate name (exact match, case-insensitive)
    const trimmedName = value?.name?.trim();
    if (trimmedName) {
      // First check for active (non-deleted) attributes with this name
      const existing = await attributeService.searchAttributesByName(trimmedName);
      if (existing && Array.isArray(existing) && existing.length > 0) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Attribute with this name already exists",
            data: null,
          },
        };
      }
      
      // Check for soft-deleted attributes with this name and permanently delete them
      // This allows recreating attributes with the same name as previously deleted ones
      const deletedAttributes = await attributeService.searchAttributesByNameIncludingDeleted(trimmedName);
      const softDeleted = deletedAttributes.filter(attr => attr.deletedAt && attr.deletedAt !== null);
      if (softDeleted.length > 0) {
        console.log(`Found ${softDeleted.length} soft-deleted attribute(s) with name "${trimmedName}". Permanently deleting to allow recreation.`);
        await attributeService.permanentDeleteByName(trimmedName);
      }
    }

    // Ensure values is an array (validator requires it)
    const attributeData = {
      ...value,
      values: Array.isArray(value.values) && value.values.length > 0 
        ? value.values.filter(v => v && v.trim() !== '') 
        : []
    };

    // If no values provided, set empty array (or handle based on your business logic)
    if (attributeData.values.length === 0) {
      // You might want to allow empty values or require at least one
      // For now, we'll allow empty array but log a warning
      console.warn("Attribute created with no values:", attributeData.name);
    }

    const attribute = await attributeService.createAttribute(attributeData);

    return {
      status: 201,
      body: {
        success: true,
        message: "Attribute created successfully",
        data: attribute,
      },
    };
  } catch (err) {
    console.error("Create Attribute Error:", err);
    
    // Handle MongoDB duplicate key error - check if it's for a soft-deleted attribute
    if (err?.code === 11000 || err?.message?.includes('duplicate') || err?.message?.includes('E11000')) {
      // If MongoDB throws duplicate error, check if the existing attribute is soft-deleted
      const attributeService = new AttributeService(conn);
      // Use value if available, otherwise fall back to body
      const nameToCheck = value?.name?.trim() || body?.name?.trim();
      if (nameToCheck) {
        try {
          // Check all attributes (including deleted) to see if the duplicate is soft-deleted
          const allMatches = await attributeService.searchAttributesByNameIncludingDeleted(nameToCheck);
          // Filter to only non-deleted attributes
          const activeMatches = allMatches.filter(attr => !attr.deletedAt || attr.deletedAt === null);
          
          if (activeMatches.length === 0 && allMatches.length > 0) {
            // The duplicate exists but is soft-deleted - permanently delete it and retry creation
            console.log(`Permanently deleting soft-deleted attribute(s) with name: ${nameToCheck}`);
            await attributeService.permanentDeleteByName(nameToCheck);
            
            // Retry creating the attribute
            try {
              const attributeData = {
                ...value,
                values: Array.isArray(value.values) && value.values.length > 0 
                  ? value.values.filter(v => v && v.trim() !== '') 
                  : []
              };
              
              const attribute = await attributeService.createAttribute(attributeData);
              
              return {
                status: 201,
                body: {
                  success: true,
                  message: "Attribute created successfully",
                  data: attribute,
                },
              };
            } catch (retryErr) {
              console.error("Error creating attribute after deleting old one:", retryErr);
              return {
                status: 500,
                body: {
                  success: false,
                  message: "Failed to create attribute after cleaning up deleted attribute. Please try again.",
                  data: null,
                },
              };
            }
          }
        } catch (searchErr) {
          console.error("Error checking for soft-deleted attribute:", searchErr);
        }
      }
      
      return {
        status: 400,
        body: {
          success: false,
          message: "Attribute with this name already exists",
          data: null,
        },
      };
    }
    
    return {
      status: 500,
      body: {
        success: false,
        message: err?.message || "Server error",
        data: null,
      },
    };
  }
}

export async function getAllAttributes(queryOrReq, conn) {
  try {
    const attributeService = new AttributeService(conn);

    // route handlers sometimes pass a plain query object, other times an object like { query }
    const query =
      queryOrReq && queryOrReq.query ? queryOrReq.query : queryOrReq || {};

    const attributes = await attributeService.getAllAttributes(query);

    return {
      status: 200,
      body: {
        success: true,
        message: "Attributes fetched successfully",
        data: attributes,
      },
    };
  } catch (err) {
    //consolle.error(
    //   "Get All Attributes Error:",
    //   err && err.message ? err.message : err
    // );
    return {
      status: 500,
      body: {
        success: false,
        message: "Server error",
        data: null,
      },
    };
  }
}

//getByProductId
export async function getByProductId(productId, conn) {
  try {
    const attributeService = new AttributeService(conn);
    const attributes = await attributeService.getAttributesByProductId(
      productId
    );

    // Return 200 with empty array instead of 404 - this is more RESTful
    // An empty array means "no attributes assigned", not "error"
    return {
      status: 200,
      body: {
        success: true,
        message: attributes && attributes.length > 0 ? "Attributes found" : "No attributes assigned to this product",
        data: attributes || [],
      },
    };
  } catch (err) {
    //consolle.error("Get Attributes by Product ID Error:", err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: err?.message || "Server error",
        data: null,
      },
    };
  }
}

export async function getAttributeById(id, conn) {
  try {
    const attributeService = new AttributeService(conn);
    const attribute = await attributeService.getAttributeById(id);

    if (!attribute) {
      return {
        status: 404,
        body: {
          success: false,
          message: "Attribute not found",
          data: null,
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "Attribute found",
        data: attribute,
      },
    };
  } catch (err) {
    //consolle.error("Get Attribute Error:", err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: "Server error",
        data: null,
      },
    };
  }
}

export async function updateAttribute(id, data, conn) {
  try {
    const { error } = attributeUpdateValidator.validate(data);
    if (error) {
      return {
        status: 400,
        body: {
          success: false,
          message: "Validation error",
          data: error.details,
        },
      };
    }

    const attributeService = new AttributeService(conn);
    const updated = await attributeService.updateAttribute(id, data);

    return {
      status: 200,
      body: {
        success: true,
        message: "Attribute updated successfully",
        data: updated,
      },
    };
  } catch (err) {
    //consolle.error("Update Attribute Error:", err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: "Server error",
        data: null,
      },
    };
  }
}

export async function deleteAttribute(id, conn) {
  try {
    const attributeService = new AttributeService(conn);
    const deleted = await attributeService.deleteAttribute(id);

    return {
      status: 200,
      body: {
        success: true,
        message: "Attribute deleted successfully",
        data: deleted,
      },
    };
  } catch (err) {
    //consolle.error("Delete Attribute Error:", err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: "Server error",
        data: null,
      },
    };
  }
}

export async function searchAttributesByName(req, conn) {
  try {
    const name = req.query.name;
    if (!name) {
      return {
        status: 400,
        body: {
          success: false,
          message: "Name query parameter is required",
          data: null,
        },
      };
    }

    const attributeService = new AttributeService(conn);
    const attributes = await attributeService.searchAttributesByName(name);

    return {
      status: 200,
      body: {
        success: true,
        message: "Attributes found",
        data: attributes,
      },
    };
  } catch (err) {
    //consolle.error("Search Attributes Error:", err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: "Server error",
        data: null,
      },
    };
  }
}
