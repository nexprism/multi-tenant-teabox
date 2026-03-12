import CategoryService from "../.././lib/services/categoryService.js";
import { saveFile, validateImageFile } from "../../config/fileUpload.js";
import Category from "../../lib/models/Category.js";
import { redisWrapper } from "../../config/redis.js";
import {
  categoryCreateValidator,
  categoryUpdateValidator,
} from "../../validators/categoryValidator.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import SettingModel from "../models/Setting.js"; // already imported

// Helper to get Setting model safely
function getSettingModel(conn) {
  return conn.models.Setting || conn.model("Setting", SettingModel.schema);
}

// Helper to refresh allCategories cache
async function refreshCategoriesCache(conn) {
  try {
    const categoryService = new CategoryService(conn);
    const allCategories = await categoryService.getAllCategories({});

    if (redisWrapper.isEnabled()) {
      const client = await redisWrapper.getClient();
      await client.set("allCategories", JSON.stringify(allCategories));
      //consolle.log("✅ Categories cache refreshed in Redis");
    } else {
      //consolle.log("📴 Redis disabled - skipping cache refresh");
    }
  } catch (error) {
    //consolle.error("Failed to refresh categories cache:", error);
  }
}

// Helper to update codAllowed in Setting model based on all categories
async function updateGlobalCodAllowed(conn) {
  const CategoryModel = conn.models.Category || conn.model("Category");
  const Setting = getSettingModel(conn);
  // If any category disables COD or is prepaid only, disable COD globally
  const codRestricted = await CategoryModel.findOne({
    $or: [{ allowPrepaidOnly: true }, { disableCOD: true }],
    deletedAt: null,
  });
  await Setting.updateMany(
    {},
    { codAllowed: !codRestricted }
  );
}

// Helper to update category-wise payment settings in Setting model
async function updateCategoryPaymentSetting(conn, categoryId, allowPrepaidOnly, disableCOD) {
  const Setting = getSettingModel(conn);
  // Update or insert the category's payment settings
  await Setting.updateMany(
    {},
    {
      $pull: { categoryPaymentSettings: { categoryId } }
    }
  );
  await Setting.updateMany(
    {},
    {
      $push: {
        categoryPaymentSettings: {
          categoryId,
          allowPrepaidOnly: !!allowPrepaidOnly,
          disableCOD: !!disableCOD,
        }
      }
    }
  );
}

export async function createCategory(form, conn) {
  try {
    let imageUrl = "";
    let thumbnailUrl = "";
    const categoryService = new CategoryService(conn);

    //consolle.log("Create Category form:", form);
    const name = form.get("name");
    const slug = form.get("slug");
    const description = form.get("description");
    const image = form.get("image");
    const thumbnail = form.get("thumbnail");
    const seoTitle = form.get("seoTitle");
    const seoDescription = form.get("seoDescription");
    const status = form.get("status");
    const sortOrder = form.get("sortOrder");
    const isFeatured = form.get("isFeatured");
    const allowPrepaidOnly = form.get("allowPrepaidOnly"); // new
    const disableCOD = form.get("disableCOD"); // new

    const existing = await categoryService.findByName(name);
    //consolle.log("Existing Category:", existing?.status);

    if (existing?.status !== 404) {
      return {
        status: 400,
        body: errorResponse("Category with this name already exists", 400),
      };
    }
    //consolle.log("Category name:", image);
    //consolle.log("Category description:", image instanceof File);

    if (image && image instanceof File) {
      try {
        validateImageFile(image);
        imageUrl = await saveFile(image, "category-images");
        //consolle.log("Image saved at:", imageUrl);
      } catch (fileError) {
        return {
          status: 400,
          body: errorResponse("Image upload error", 400, fileError.message),
        };
      }
    } else if (typeof image === "string") {
      imageUrl = image;
    }

    if (thumbnail && thumbnail instanceof File) {
      try {
        validateImageFile(thumbnail);
        thumbnailUrl = await saveFile(thumbnail, "category-thumbnails");
      } catch (fileError) {
        return {
          status: 400,
          body: errorResponse("Thumbnail upload error", 400, fileError.message),
        };
      }
    } else if (typeof thumbnail === "string") {
      thumbnailUrl = thumbnail;
    }

    const { error, value } = categoryCreateValidator.validate({
      name,
      slug,
      description,
      image: imageUrl,
      thumbnail: thumbnailUrl,
      seoTitle,
      seoDescription,
      status,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isFeatured:
        isFeatured !== undefined
          ? isFeatured === "true" || isFeatured === true
          : undefined,
      allowPrepaidOnly:
        allowPrepaidOnly !== undefined
          ? allowPrepaidOnly === "true" || allowPrepaidOnly === true
          : undefined,
      disableCOD:
        disableCOD !== undefined
          ? disableCOD === "true" || disableCOD === true
          : undefined,
    });

    if (error) {
      return {
        status: 400,
        body: errorResponse("Validation error", 400, error.details),
      };
    }

    const newCategoryResp = await categoryService.createCategory(value);
    // Use the correct status and body from the service response
    const respStatus = newCategoryResp?.status || 201;
    const respBody = newCategoryResp?.body || newCategoryResp;

    await refreshCategoriesCache(conn);

    // Update category-wise payment settings in Setting model
    if (respBody?.data && respBody.data._id) {
      await updateCategoryPaymentSetting(
        conn,
        respBody.data._id,
        value.allowPrepaidOnly,
        value.disableCOD
      );
    }

    // Update global COD allowed in Setting model
    await updateGlobalCodAllowed(conn);

    return {
      status: respStatus,
      body: respBody,
    };
  } catch (err) {
    console.error("Create Category error:", err.message, err);
    return {
      status: 500,
      body: errorResponse("Server error", 500, err.message),
    };
  }
}

export async function getCategories(query, conn) {
  try {
    const categoryService = new CategoryService(conn);
    //consolle.log("Get Categories query:", query);
    const result = await categoryService.getAllCategories(query);
    return {
      status: 200,
      body: {
        success: true,
        message: "Categories fetched successfully",
        data: result,
      },
    };
  } catch (err) {
    //consolle.error("Get Categories error:", err.message);
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

export async function getCategoryById(id, conn) {
  try {
    const categoryService = new CategoryService(conn);
    const category = await categoryService.getCategoryById(id);
    if (!category) {
      return {
        status: 404,
        body: {
          success: false,
          message: "Category not found",
          data: null,
        },
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Category fetched",
        data: category,
      },
    };
  } catch (err) {
    //consolle.error("Get Category error:", err.message);
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

export async function updateCategory(id, data, conn) {
  try {
    let imageUrl = "";
    const categoryService = new CategoryService(conn);
    let thumbnailUrl = "";
    const { image, thumbnail, ...fields } = data;

    if (image && image instanceof File) {
      try {
        validateImageFile(image);
        imageUrl = await saveFile(image, "category-images");
      } catch (fileError) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Image upload error",
            details: fileError.message,
            data: null,
          },
        };
      }
    } else if (typeof image === "string") {
      imageUrl = image;
    }

    if (thumbnail && thumbnail instanceof File) {
      try {
        validateImageFile(thumbnail);
        thumbnailUrl = await saveFile(thumbnail, "category-thumbnails");
      } catch (fileError) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Thumbnail upload error",
            details: fileError.message,
            data: null,
          },
        };
      }
    } else if (typeof thumbnail === "string") {
      thumbnailUrl = thumbnail;
    }

    const cleanedFields = Object.entries(fields).reduce((acc, [key, value]) => {
      if (value !== "") acc[key] = value;
      return acc;
    }, {});

    const payload = {
      ...cleanedFields,
      ...(imageUrl ? { image: imageUrl } : {}),
      ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
    };

    const { error, value } = categoryUpdateValidator.validate(payload);
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

    const updatedResp = await categoryService.updateCategory(id, value);
    // Use the correct status and body from the service response
    const respStatus = updatedResp?.status || 200;
    const respBody = updatedResp?.body || updatedResp;

    if (!respBody?.data) {
      return {
        status: 404,
        body: { success: false, message: "Category not found", data: null },
      };
    }

    // Invalidate and refresh cache
    await refreshCategoriesCache(conn);

    // Update category-wise payment settings in Setting model
    await updateCategoryPaymentSetting(
      conn,
      id,
      value.allowPrepaidOnly,
      value.disableCOD
    );

    return {
      status: respStatus,
      body: respBody,
    };
  } catch (err) {
    console.error("Update Category error:", err.message, err);
    return {
      status: 500,
      body: { success: false, message: "Server error", data: err.message },
    };
  }
}

export async function deleteCategory(id, conn) {
  try {
    const categoryService = new CategoryService(conn);
    const result = await categoryService.deleteCategory(id);

    const respStatus = result?.status || 200;
    const respBody = result?.body || result;

    if (respStatus >= 400) {
      return {
        status: respStatus,
        body: respBody,
      };
    }

    // Invalidate and refresh cache
    await refreshCategoriesCache(conn);

    return {
      status: respStatus,
      body: respBody,
    };
  } catch (err) {
    //consolle.error("Delete Category error:", err.message);
    return {
      status: 500,
      body: { success: false, message: "Server error" },
    };
  }
}

export async function getAttributesByCategoryId(categoryId) {
  try {
    const attributes = await ProductAttribute.find({
      category_id: categoryId,
      deletedAt: null,
    });

    return {
      status: 200,
      body: successResponse("Attributes fetched successfully", attributes),
    };
  } catch (err) {
    //consolle.error("Error fetching attributes for category:", err.message);
    return {
      status: 500,
      body: errorResponse("Failed to fetch attributes", 500),
    };
  }
}

export async function getNavbarCategoriesWithAttributes() {
  try {
    const categories = await Category.find({ deletedAt: null });

    const categoryIds = categories.map((c) => c._id.toString());

    const attributes = await ProductAttribute.find({
      category_id: { $in: categoryIds },
      deletedAt: null,
    });

    // Group attributes by category_id
    const groupedAttributes = {};
    for (const attr of attributes) {
      const catId = attr.category_id.toString();
      if (!groupedAttributes[catId]) groupedAttributes[catId] = [];
      groupedAttributes[catId].push(attr);
    }

    // Attach attributes to each category
    const result = categories.map((cat) => {
      return {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        status: cat.status,
        attributes: groupedAttributes[cat._id.toString()] || [],
      };
    });

    return {
      status: 200,
      body: successResponse("Categories with attributes fetched", result),
    };
  } catch (err) {
    //consolle.error("Navbar fetch error:", err.message);
    return {
      status: 500,
      body: errorResponse("Failed to fetch categories", 500),
    };
  }
}
