// import { NextResponse } from "next/server";
// import { getSubdomain, getDbConnection } from "../../../../lib/tenantDb.js";
import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../../lib/tenantDb.js";
import {
  getVariantById,
  updateVariant,
} from "../../../../lib/controllers/variantController.js";

// DELETE /api/variant/image/:id
// DELETE /api/variant/image/:id?index=0&type=images&variantId=xxxx
export async function DELETE(req, { params }) {
  try {
    const url = new URL(req.url, "http://localhost");
    const index = parseInt(url.searchParams.get("index"), 10);
    const type = url.searchParams.get("type"); // should be 'images' only
    const variantId = url.searchParams.get("variantId");
    const subdomain = getSubdomain(req);
    // console.log("Subdomain:", subdomain);
    // console.log(
    //   "Attempting to delete variant image at index:",
    //   index,
    //   "from:",
    //   type,
    //   "variantId:",
    //   variantId
    // );

    if (isNaN(index) || index < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid index" },
        { status: 400 }
      );
    }
    if (type !== "images") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid type. Must be 'images'",
        },
        { status: 400 }
      );
    }
    // Simple validation for MongoDB ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(variantId);
    if (!variantId || !isValidObjectId) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing variantId" },
        { status: 400 }
      );
    }

    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    // Get variant using the service instead of direct model access
    const variantResult = await getVariantById(variantId, conn);
    if (!variantResult?.body?.success || !variantResult?.body?.data) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    const variant = variantResult.body.data;

    if (!Array.isArray(variant.images)) {
      return NextResponse.json(
        { success: false, message: `No images array found` },
        { status: 400 }
      );
    }

    if (index >= variant.images.length) {
      return NextResponse.json(
        { success: false, message: "Index out of bounds" },
        { status: 400 }
      );
    }

    // Remove the image at the specified index
    // Since variant is a plain object (not Mongoose doc), we need to create a new array
    const updatedImages = variant.images.filter((_, idx) => idx !== index);

    if (updatedImages.length === variant.images.length) {
      // No image was removed (index was out of bounds or invalid)
      return NextResponse.json(
        { success: false, message: "No image at given index" },
        { status: 404 }
      );
    }

    // Convert to plain object for updating
    // Use spread operator to convert to plain JavaScript array
    const variantData = {
      images: updatedImages, // New array without the deleted image
    };

    // Update the variant
    const updateResult = await updateVariant(variant._id, variantData, conn);

    console.log("Update result:", JSON.stringify(updateResult, null, 2));

    let fullVariant = null;

    // Access the response correctly (updateResult.body.success, not updateResult.success)
    if (updateResult?.body?.success) {
      const getResult = await getVariantById(variant._id, conn);
      if (getResult?.body?.success) {
        fullVariant = getResult.body.data;
      }
    } else {
      console.error("Failed to update variant:", updateResult?.body?.message || "Unknown error");
    }

    return NextResponse.json(
      {
        success: updateResult?.body?.success || false,
        message: updateResult?.body?.message || "Image deleted successfully",
        variant: fullVariant,
      },
      {
        status: updateResult?.body?.success ? 200 : 400,
      }
    );
  } catch (error) {
    console.error("DELETE variant image error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
