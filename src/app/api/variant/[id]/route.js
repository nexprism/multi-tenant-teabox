import {
  getVariantById,
  updateVariant,
  deleteVariant,
} from "@/app/lib/controllers/variantController";
import { getSubdomain, getDbConnection } from "@/app/lib/tenantDb";
import { saveFile } from "@/app/config/fileUpload";

// GET /api/variant/[id] → Get a variant by ID
export async function GET(req, context) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return new Response(
        JSON.stringify({ success: false, message: "DB not found" }),
        { status: 404 }
      );
    }
    const params = await context.params;
    const { id } = params;
    const result = await getVariantById(id, conn);
    return new Response(JSON.stringify(result.body), { status: result.status });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}

// PUT /api/variant/[id] → Update a variant by ID
export async function PUT(req, context) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return new Response(
        JSON.stringify({ success: false, message: "DB not found" }),
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const formData = await req.formData();

    // fetch existing variant
    const variant = await getVariantById(id, conn);
    const body = {};

    //consolle.log("existing variant:", variant);
    // Always start with old images
    body.images = variant.body.data.images ? [...variant.body.data.images] : [];

    for (const [key, value] of formData.entries()) {
      const match = key.match(/([\w]+)(\[(\d+)\])?(\[(\w+)\])?/);
      if (match && (match[2] || match[4])) {
        const arrKey = match[1];
        const arrIdx = match[3];
        const objKey = match[5];

        if (objKey) {
          // attributes[0][attributeId]
          if (!body[arrKey]) body[arrKey] = [];
          if (!body[arrKey][arrIdx]) body[arrKey][arrIdx] = {};
          body[arrKey][arrIdx][objKey] = value;
        } else if (arrIdx) {
          // images[0] or newImages[0]
          if (!body[arrKey]) body[arrKey] = [];

          if (typeof value === "object" && value.arrayBuffer && value.name) {
            const uploadedFile = await saveFile(value, "uploads/Variant");
            body[arrKey][arrIdx] = uploadedFile;
          } else {
            body[arrKey][arrIdx] = value;
          }
        }
      } else {
        body[key] = value;
      }
    }

    // ✅ Merge newImages into existing images
    if (body.newImages && Array.isArray(body.newImages)) {
      body.images = [...body.images, ...body.newImages];
      delete body.newImages;
    }
    //consolle.log("variant body:", body);

    const result = await updateVariant(id, body, conn);
    return new Response(JSON.stringify(result.body), { status: result.status });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}

// DELETE /api/variant/[id] → Soft delete a variant by ID
export async function DELETE(req, context) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return new Response(
        JSON.stringify({ success: false, message: "DB not found" }),
        { status: 404 }
      );
    }
    const params = await context.params;
    const { id } = params;
    const result = await deleteVariant(id, conn);
    return new Response(JSON.stringify(result.body), { status: result.status });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}
