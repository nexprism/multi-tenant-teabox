import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb.js";
import ProductRepository from "../../../lib/repository/productRepository.js";
import ProductService from "../../../lib/services/productService.js";
import ProductController from "../../../lib/controllers/productController.js";
import ProductModel from "../../../lib/models/Product.js";
import UserSchema from "../../../lib/models/User.js";
import { saveFile } from "../../../config/fileUpload";
import { ReviewSchema } from "../../../lib/models/Review.js";
import { FaqSchema } from "../../../lib/models/Faq.js";
import mongoose from "mongoose";

// GET /api/product/:id
export async function GET(req, context) {
  const resolvedParams = await context.params;
  try {
    const id = resolvedParams.id;
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);
    const Review = conn.models.Review || conn.model("Review", ReviewSchema);
    const productRepo = new ProductRepository(Product);
    const productService = new ProductService(productRepo);
    const productController = new ProductController(productService);

    // Check if id is a valid ObjectId or a slug
    // Use controller to fetch product by ID or slug (controller/repository handles variants population)
    const response = await productController.getById(id, conn);
    const product = response.success ? response.data : null;

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Ensure `User` model is registered on this connection so populate('userId') works
    conn.models.User || conn.model("User", UserSchema);

    // Populate reviews using the actual _id
    const reviews = await Review.find({ productId: product._id.toString() })
      .populate("userId", "name email")
      .lean();
    product.reviews = reviews;
    product.rating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    product.reviewCount = reviews.length;

    // Fetch product-specific FAQs and attach to product response
    try {
      const Faq = conn.models.Faq || conn.model("Faq", FaqSchema);
      const faqs = await Faq.find({ product: product._id, type: "product", status: "active" })
        .sort({ createdAt: -1 })
        .lean();
      product.faqs = faqs;
    } catch (err) {
      // swallow — don't fail the whole request if FAQs can't be loaded
      product.faqs = [];
    }


    return NextResponse.json(
      {
        success: true,
        message: "Product fetched successfully",
        product: product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Product GET error:", error.stack || error);
    return NextResponse.json(
      { success: false, message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// PATCH /api/product/:id

// PATCH and DELETE handlers must also unwrap params from a promise
export async function PATCH(req, context) {
  const resolvedParams = await context.params;
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);
    const productRepo = new ProductRepository(Product);
    const productService = new ProductService(productRepo);
    const productController = new ProductController(productService);
    const body = await req.json();
    const response = await productController.update(resolvedParams.id, body, conn);
    return NextResponse.json(response, {
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/product/:id
export async function PUT(req, context) {
  try {
    if (!context || !context.params) {
      return NextResponse.json(
        { success: false, message: "Invalid request context" },
        { status: 400 }
      );
    }
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
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
    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);
    const productRepo = new ProductRepository(Product);
    const productService = new ProductService(productRepo);
    const productController = new ProductController(productService);

    // First, get the existing product to preserve current images
    const existingProductResult = await productController.getById(id, conn);
    if (!existingProductResult.success) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }
    const existingProduct = existingProductResult.data;
    console.log("DEBUG: Existing Product Benefits:", JSON.stringify(existingProduct.benefits, null, 2));

    const contentType = req.headers.get("content-type") || "";
    let body = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      console.log("DEBUG: FormData Keys:", [...formData.keys()]);


      // Initialize arrays as empty if we are receiving updates for them
      const arrayFields = [
        "images",
        "descriptionImages",
        "ingredients",
        "benefits",
        "precautions",
        "howToUseSteps",
        "attributeSet",
        "searchKeywords",
        "highlights",
      ];

      // We'll keep track of which arrays are present in the formData
      const presentArrays = new Set();
      const maxIndices = {};

      // Initialize body with existing product fields
      body = { ...existingProduct };

      // Specifically prepare arrays for potential partial update or full replacement
      // But we will use maxIndices to truncate them later if they are present.

      for (const [key, value] of formData.entries()) {
        // Handle thumbnail fields specifically
        if (
          key === "thumbnail.file" ||
          (key === "thumbnail" && value instanceof File)
        ) {
          if (value instanceof File) {
            try {
              const url = await saveFile(value, "uploads/Product");
              body.thumbnail = { url, alt: body.thumbnail?.alt || "" };
              //consolle.log(`Thumbnail updated: ${url}`);
            } catch (error) {
              //consolle.error(`Error saving thumbnail file:`, error.message);
            }
          }
          continue;
        }

        if (key === "thumbnail.alt") {
          if (body.thumbnail) {
            body.thumbnail.alt = value;
          } else {
            body.thumbnail = { url: "", alt: value };
          }
          continue;
        }

        // Handle thumbnail[file], thumbnail[alt] patterns
        const thumbnailMatch = key.match(/^thumbnail\[(\w+)\]$/);
        if (thumbnailMatch) {
          const prop = thumbnailMatch[1];
          if (prop === "file" && value instanceof File) {
            try {
              const url = await saveFile(value, "uploads/Product");
              body.thumbnail = { url, alt: body.thumbnail?.alt || "" };
              //consolle.log(`Thumbnail updated via bracket: ${url}`);
            } catch (error) {
              //consolle.error(`Error saving thumbnail file:`, error.message);
            }
          } else if (prop === "alt") {
            if (body.thumbnail) {
              body.thumbnail.alt = value;
            } else {
              body.thumbnail = { url: "", alt: value };
            }
          }
          continue;
        }

        // Handle array patterns for images
        const arrObjMatch = key.match(/([\w]+)\[(\d+)\](?:\.([\w]+|file))?/);
        const objObjMatch = key.match(/([\w]+)\.(\w+)/);

        if (key.startsWith("targetAudience.")) {
          // Handle targetAudience.idealFor[index] and targetAudience.consultDoctor[index]
          const taMatch = key.match(/^targetAudience\.(idealFor|consultDoctor)\[(\d+)\]$/);
          if (taMatch) {
            const field = taMatch[1]; // 'idealFor' or 'consultDoctor'
            const index = parseInt(taMatch[2]);

            if (!body.targetAudience) {
              body.targetAudience = { idealFor: [], consultDoctor: [] };
            }
            if (!body.targetAudience[field]) {
              body.targetAudience[field] = [];
            }
            body.targetAudience[field][index] = value;

            presentArrays.add(`targetAudience.${field}`);
            const taKey = `targetAudience.${field}`;
            if (maxIndices[taKey] === undefined || index > maxIndices[taKey]) {
              maxIndices[taKey] = index;
            }
          }
        } else if (arrObjMatch) {
          const arrKey = arrObjMatch[1];
          const arrIdx = parseInt(arrObjMatch[2]);
          const objKey = arrObjMatch[3];

          if (["images", "descriptionImages"].includes(arrKey)) {
            // Ensure the array index exists
            if (!body[arrKey][arrIdx])
              body[arrKey][arrIdx] = { url: "", alt: "" };

            if (objKey === "file" && value instanceof File) {
              try {
                const url = await saveFile(value, "uploads/Product");
                body[arrKey][arrIdx].url = url;
                //consolle.log(`${arrKey}[${arrIdx}] file updated: ${url}`);
              } catch (error) {
                //consolle.error(`Error saving ${arrKey} file:`, error.message);
              }
            } else if (objKey === "alt") {
              body[arrKey][arrIdx].alt = value;
            } else if (objKey === "url" && typeof value === "string") {
              body[arrKey][arrIdx].url = value;
            }
          } else if (
            [
              "howToUseSteps",
              "ingredients",
              "benefits",
              "precautions",
            ].includes(arrKey)
          ) {
            if (!body[arrKey]) body[arrKey] = [];
            if (!body[arrKey][arrIdx]) body[arrKey][arrIdx] = {};


            if (objKey === "image") {
              if (value instanceof File) {
                try {
                  const url = await saveFile(value, "uploads/Product");
                  body[arrKey][arrIdx].image = url;
                } catch (error) {
                  // console.error(`Error saving ${arrKey} image:`, error.message);
                }
              } else if (typeof value === "string") {
                // If value is an empty string, set to null to clear the image
                // Otherwise, use the existing URL
                body[arrKey][arrIdx].image = value.trim() === "" ? null : value;
              }
            } else if (objKey) {
              body[arrKey][arrIdx][objKey] = value;
            }
          } else if (arrKey === "attributeSet") {
            if (!body[arrKey]) body[arrKey] = [];
            if (!body[arrKey][arrIdx]) body[arrKey][arrIdx] = {};
            if (objKey) {
              body[arrKey][arrIdx][objKey] = value;
            } else {
              body[arrKey][arrIdx] = { attributeId: value };
            }
          } else if (
            ["searchKeywords", "highlights", "frequentlyPurchased"].includes(
              arrKey
            )
          ) {
            if (!body[arrKey]) body[arrKey] = [];
            body[arrKey][arrIdx] = value;
          }
        } else if (objObjMatch) {
          const objKey = objObjMatch[1];
          const prop = objObjMatch[2];

          if (objKey === "thumbnail") {
            // Already handled above
            continue;
          } else {
            body[key] = value;
          }
        } else if (key === "images" && value instanceof File) {
          try {
            const url = await saveFile(value, "uploads/Product");
            body.images.push({ url, alt: "" });
            //consolle.log(`New image added: ${url}`);
          } catch (error) {
            //consolle.error(`Error saving images file:`, error.message);
          }
        } else if (key === "descriptionImages" && value instanceof File) {
          try {
            const url = await saveFile(value, "uploads/Product");
            body.descriptionImages.push({ url, alt: "" });
            //consolle.log(`New description image added: ${url}`);
          } catch (error) {
            //consolle.error(
            //   `Error saving descriptionImages file:`,
            //   error.message
            // );
          }
        } else if (
          (key === "storyVideoUrl" || key === "storyVideo") &&
          value instanceof File
        ) {
          // Accept videos (mp4, mov, etc.) and gifs for storyVideoUrl
          try {
            const mime = value.type || "";
            if (mime.startsWith("video/") || mime === "image/gif") {
              const url = await saveFile(value, "uploads/Product");
              body.storyVideoUrl = url;
              //consolle.log(`storyVideoUrl updated: ${url}`);
            } else {
              //consolle.error(
              //   `Invalid story video type for PUT: ${mime} (${value.name})`
              // );
            }
          } catch (error) {
            //consolle.error("Error saving storyVideoUrl in PUT:", error.message);
          }
        } else if (/^storyVideoUrl\[(\w+)\]$/.test(key)) {
          const prop = key.match(/^storyVideoUrl\[(\w+)\]$/)[1];
          if (prop === "file" && value instanceof File) {
            try {
              const mime = value.type || "";
              if (mime.startsWith("video/") || mime === "image/gif") {
                const url = await saveFile(value, "uploads/Product");
                body.storyVideoUrl = url;
                //consolle.log(`storyVideoUrl updated via bracket: ${url}`);
              } else {
                //consolle.error(
                //   `Invalid story video type for PUT bracket: ${mime} (${value.name})`
                // );
              }
            } catch (error) {
              //consolle.error(
              //   "Error saving storyVideoUrl (bracket) in PUT:",
              //   error.message
              // );
            }
          } else if (prop === "url") {
            body.storyVideoUrl = value;
          }
        } else if (key === "comparison" && typeof value === "string") {
          // Parse comparison JSON string from FormData
          try {
            body.comparison = JSON.parse(value);
          } catch (e) {
            console.error("Failed to parse comparison JSON:", e);
            body.comparison = value; // Fallback to string if parsing fails
          }
        } else {
          body[key] = value;
        }

        // Track max indices for arrays to handle truncation/deletion
        const match = key.match(/^(\w+)\[(\d+)\]/);
        if (match) {
          const arrKey = match[1];
          const arrIdx = parseInt(match[2]);
          presentArrays.add(arrKey);
          if (maxIndices[arrKey] === undefined || arrIdx > maxIndices[arrKey]) {
            maxIndices[arrKey] = arrIdx;
          }
        }
      }

      // Handle truncation for arrays that were present in the request
      presentArrays.forEach((arrKey) => {
        if (Array.isArray(body[arrKey]) && maxIndices[arrKey] !== undefined) {
          // Truncate the array to the max index found + 1
          body[arrKey] = body[arrKey].slice(0, maxIndices[arrKey] + 1);
        }
      });

      // Handle targetAudience truncation separately
      if (body.targetAudience) {
        if (presentArrays.has('targetAudience.idealFor') && maxIndices['targetAudience.idealFor'] !== undefined) {
          body.targetAudience.idealFor = body.targetAudience.idealFor.slice(0, maxIndices['targetAudience.idealFor'] + 1);
        }
        if (presentArrays.has('targetAudience.consultDoctor') && maxIndices['targetAudience.consultDoctor'] !== undefined) {
          body.targetAudience.consultDoctor = body.targetAudience.consultDoctor.slice(0, maxIndices['targetAudience.consultDoctor'] + 1);
        }

        // Filter out empty strings from targetAudience arrays
        if (body.targetAudience.idealFor) {
          body.targetAudience.idealFor = body.targetAudience.idealFor.filter(item => item && item.trim() !== '');
        }
        if (body.targetAudience.consultDoctor) {
          body.targetAudience.consultDoctor = body.targetAudience.consultDoctor.filter(item => item && item.trim() !== '');
        }
      }

      // Clean up arrays - remove entries with no valid url
      if (body.images) {
        body.images = body.images.filter((img) => img && img.url);
      }
      if (body.descriptionImages) {
        body.descriptionImages = body.descriptionImages.filter(
          (img) => img && img.url
        );
      }

      // Clean up attributeSet - remove entries with invalid ObjectIds
      if (body.attributeSet && Array.isArray(body.attributeSet)) {
        body.attributeSet = body.attributeSet.filter((attr) => {
          if (!attr || !attr.attributeId) return false;
          const id = attr.attributeId;
          // Filter out null, empty strings, or the string "null"
          if (id === null || id === "" || id === "null") return false;
          // Validate it's a valid ObjectId format
          return mongoose.Types.ObjectId.isValid(id);
        });
      }

      // Only remove thumbnail if explicitly set to empty
      if (body.thumbnail && !body.thumbnail.url && !body.thumbnail.alt) {
        delete body.thumbnail;
      }
    } else {
      body = await req.json();

      // For JSON updates, preserve existing images if not provided
      if (body.thumbnail === undefined) {
        body.thumbnail = existingProduct.thumbnail;
      }
      if (body.images === undefined) {
        body.images = existingProduct.images;
      }
      if (body.descriptionImages === undefined) {
        body.descriptionImages = existingProduct.descriptionImages;
      }
      if (body.storyVideoUrl === undefined) {
        body.storyVideoUrl = existingProduct.storyVideoUrl;
      }

      // Preserve nested images
      const nestedFields = [
        "ingredients",
        "benefits",
        "precautions",
        "howToUseSteps",
      ];
      nestedFields.forEach((field) => {
        if (body[field] === undefined) {
          body[field] = existingProduct[field];
        } else if (
          Array.isArray(body[field]) &&
          Array.isArray(existingProduct[field])
        ) {
          body[field] = body[field].map((item, index) => {
            const existingItem = existingProduct[field][index];
            if (existingItem && item && !item.image && existingItem.image) {
              return { ...item, image: existingItem.image };
            }
            return item;
          });
        }
      });
    }

    console.log("DEBUG: Body Benefits before update:", JSON.stringify(body.benefits, null, 2));
    console.log("DEBUG: Body Comparison before update:", JSON.stringify(body.comparison, null, 2));

    const updateResult = await productController.update(id, body, conn);

    let fullProduct = null;
    if (updateResult && updateResult.success) {
      const getResult = await productController.getById(id, conn);
      if (getResult && getResult.success) {
        fullProduct = getResult.data;

        // CHECK: If the product has NO attributes (attributeSet is empty), delete its variants but KEEP the product.
        // The previous logic in EditProduct.tsx ensures we send an empty list if all are unchecked.
        if (!fullProduct.attributeSet || fullProduct.attributeSet.length === 0) {
          console.log(`[ProductController] Product ${id} has no attributes remaining. Deleting variants only.`);

          // 1. Delete all variants associated with this product (as they rely on attributes)
          const Variant = conn.models.Variant;
          if (Variant) {
            await Variant.updateMany({ productId: id }, { deletedAt: new Date() });
            console.log(`[ProductController] Soft-deleted variants for product ${id}`);
          }

          // We do NOT delete the product itself anymore.
          // Proceed to return the product (which is now a simple product without variants)

          // Manually clear variants in response since we just deleted them
          fullProduct.variants = [];
        }
      }
    }

    return NextResponse.json(
      {
        success: updateResult.success,
        message: updateResult.message,
        product: fullProduct,
      },
      {
        status: updateResult.success ? 200 : 400,
      }
    );
  } catch (error) {
    //consolle.error("PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/product/:id
export async function DELETE(req, context) {
  const resolvedParams = await context.params;
  try {
    const id = resolvedParams.id;
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    const Product =
      conn.models.Product || conn.model("Product", ProductModel.schema);
    const productRepo = new ProductRepository(Product);
    const productService = new ProductService(productRepo);
    const productController = new ProductController(productService);
    const response = await productController.delete(id, conn);
    return NextResponse.json(response, {
      status: response.success ? 200 : 404,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
