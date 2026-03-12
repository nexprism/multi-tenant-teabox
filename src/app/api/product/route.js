import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getSubdomain, getDbConnection } from "../../lib/tenantDb";
import ProductRepository from "../../lib/repository/productRepository";
import ProductService from "../../lib/services/productService";
import ProductController from "../../lib/controllers/productController";
import ProductModel from "../../lib/models/Product";
import { saveFile, validateImageFile } from "../../config/fileUpload";
import { ReviewSchema } from "../../lib/models/Review.js";

// GET /api/product
export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());
  ////console.log("Route received query:", query);

  try {
    const subdomain = getSubdomain(req);
    console.log(`GET /api/product - Subdomain: ${subdomain}`);
    console.log(`GET /api/product - Query: ${JSON.stringify(query)}`);
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
    const productsResult = await productController.getAll(query, conn);

    // Populate reviews for each product using actual _id
    if (productsResult?.data?.products && Array.isArray(productsResult.data.products)) {
      for (let product of productsResult.data.products) {
        const reviews = await Review.find({ productId: product._id.toString() })
          .populate("userId", "name email")
          .lean();
        product.reviews = reviews;
        product.rating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        product.reviewCount = reviews.length;
      }
    }

    return NextResponse.json({ success: true, products: productsResult });
  } catch (error) {
    ////console.error("GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/product
export async function POST(req) {
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

    const contentType = req.headers.get("content-type") || "";
    let body = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Initialize thumbnail object to ensure it exists
      body.thumbnail = { url: "", alt: "" };

      for (const [key, value] of formData.entries()) {
        ////console.log(
        //   `Processing form field: ${key}=${
        //     value instanceof File ? `File(${value.name})` : value
        //   }`
        // );

        // Handle thumbnail fields specifically
        if (
          key === "thumbnail.file" ||
          (key === "thumbnail" && value instanceof File)
        ) {
          if (value instanceof File) {
            try {
              validateImageFile(value);
              const url = await saveFile(value, "uploads/Product");
              body.thumbnail.url = url;
              ////console.log(`Thumbnail URL set: ${url}`);
            } catch (error) {
              ////console.error(
              //   `Error saving thumbnail file (${value.name}):`,
              //   error.message
              // );
              body.thumbnail.url = "";
            }
          }
          continue; // Skip further processing for this field
        }

        if (key === "thumbnail.alt") {
          body.thumbnail.alt = value;
          continue;
        }

        // Handle nested object patterns like thumbnail[file], thumbnail[alt]
        const thumbnailMatch = key.match(/^thumbnail\[(\w+)\]$/);
        if (thumbnailMatch) {
          const prop = thumbnailMatch[1]; // 'file' or 'alt'
          if (prop === "file" && value instanceof File) {
            try {
              validateImageFile(value);
              const url = await saveFile(value, "uploads/Product");
              body.thumbnail.url = url;
              ////console.log(`Thumbnail URL set via bracket notation: ${url}`);
            } catch (error) {
              ////console.error(
              //   `Error saving thumbnail file (${value.name}):`,
              //   error.message
              // );
              body.thumbnail.url = "";
            }
          } else if (prop === "alt") {
            body.thumbnail.alt = value;
          }
          continue;
        }

        // Handle array patterns for other fields
        const arrObjMatch = key.match(/([\w]+)\[(\d+)\](?:\[([\w]+)\])?/);
        const arrDotMatch = key.match(/([\w]+)\[(\d+)\]\.(\w+)/);
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
          }
        } else if (arrDotMatch || arrObjMatch) {
          const match = arrDotMatch || arrObjMatch;
          const arrKey = match[1]; // e.g., "images"
          const arrIdx = parseInt(match[2]); // e.g., 0
          const objKey = match[3]; // e.g., "file", "alt"

          if (["images", "descriptionImages"].includes(arrKey)) {
            if (!body[arrKey]) body[arrKey] = [];
            if (!body[arrKey][arrIdx])
              body[arrKey][arrIdx] = { url: "", alt: "" };
            if (
              (objKey === "file" || objKey === "url") &&
              value instanceof File
            ) {
              try {
                validateImageFile(value);
                const url = await saveFile(value, "uploads/Product");
                body[arrKey][arrIdx].url = url;
              } catch (error) {
                ////console.error(
                //   `Error saving file for ${arrKey}[${arrIdx}][${objKey}] (${value.name}):`,
                //   error.message
                // );
                body[arrKey][arrIdx].url = "";
              }
            } else if (objKey) {
              body[arrKey][arrIdx][objKey] = value;
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
            if (objKey === "image" && value instanceof File) {
              try {
                validateImageFile(value);
                const url = await saveFile(value, "uploads/Product");
                body[arrKey][arrIdx].image = url;
              } catch (error) {
                ////console.error(
                //   `Error saving file for ${arrKey}[${arrIdx}][image] (${value.name}):`,
                //   error.message
                // );
                body[arrKey][arrIdx].image = null;
              }
            } else if (objKey) {
              body[arrKey][arrIdx][objKey] = value;
            }
          } else if (arrKey === "attributeSet") {
            if (!body[arrKey]) body[arrKey] = [];
            if (!body[arrKey][arrIdx]) body[arrKey][arrIdx] = {};
            body[arrKey][arrIdx][objKey] = value;
          } else if (
            ["searchKeywords", "highlights", "frequentlyPurchased"].includes(
              arrKey
            )
          ) {
            if (!body[arrKey]) body[arrKey] = [];
            body[arrKey][arrIdx] = value;
          }
        } else if (objObjMatch) {
          const objKey = objObjMatch[1]; // e.g., "thumbnail"
          const prop = objObjMatch[2]; // e.g., "file", "alt"

          // Skip thumbnail here since we handled it above
          if (objKey === "thumbnail") {
            continue;
          } else {
            body[key] = value;
          }
        } else if (key === "images" && value instanceof File) {
          try {
            validateImageFile(value);
            if (!body.images) body.images = [];
            const url = await saveFile(value, "uploads/Product");
            body.images.push({ url, alt: "" });
          } catch (error) {
            ////console.error(
            //   `Error saving images file (${value.name}):`,
            //   error.message
            // );
          }
        } else if (key === "descriptionImages" && value instanceof File) {
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
              ////console.log(`storyVideoUrl saved: ${url}`);
            } else {
              ////console.error(
              //   `Invalid story video type: ${mime} for file ${value.name}`
              // );
            }
          } catch (error) {
            ////console.error(
            //   `Error saving storyVideoUrl file (${value.name}):`,
            //   error.message
            // );
            body.storyVideoUrl = "";
          }
          continue;
        } else if (/^storyVideoUrl\[(\w+)\]$/.test(key)) {
          const prop = key.match(/^storyVideoUrl\[(\w+)\]$/)[1];
          if (prop === "file" && value instanceof File) {
            try {
              const mime = value.type || "";
              if (mime.startsWith("video/") || mime === "image/gif") {
                const url = await saveFile(value, "uploads/Product");
                body.storyVideoUrl = url;
                ////console.log(`storyVideoUrl saved via bracket: ${url}`);
              } else {
                ////console.error(
                //   `Invalid story video type: ${mime} for file ${value.name}`
                // );
              }
            } catch (error) {
              ////console.error(
              //   `Error saving storyVideoUrl file (${value.name}):`,
              //   error.message
              // );
              body.storyVideoUrl = "";
            }
          } else if (prop === "url") {
            body.storyVideoUrl = value;
          }
          continue;
          try {
            validateImageFile(value);
            if (!body.descriptionImages) body.descriptionImages = [];
            const url = await saveFile(value, "uploads/Product");
            body.descriptionImages.push({ url, alt: "" });
          } catch (error) {
            ////console.error(
            //   `Error saving descriptionImages file (${value.name}):`,
            //   error.message
            // );
          }
        } else {
          body[key] = value;
        }
      }

      // Normalize array fields
      const arrayObjectFields = [
        "howToUseSteps",
        "ingredients",
        "benefits",
        "precautions",
      ];
      for (const field of arrayObjectFields) {
        if (Array.isArray(body[field])) {
          body[field] = body[field]
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              title: item.title || "",
              description: item.description || "",
              image: item.image || undefined,
              alt: item.alt || undefined,
              name: item.name || undefined,
              quantity: item.quantity || undefined,
            }));
        } else {
          body[field] = [];
        }
      }

      // Normalize images and descriptionImages
      if (body.images) {
        body.images = body.images
          .filter((img) => img && img.url)
          .map((img) => ({
            url: img.url || "",
            alt: img.alt || "",
          }));
      }
      if (body.descriptionImages) {
        body.descriptionImages = body.descriptionImages
          .filter((img) => img && img.url)
          .map((img) => ({
            url: img.url || "",
            alt: img.alt || "",
          }));
      }

      // Handle thumbnail - only keep if URL exists
      if (body.thumbnail && body.thumbnail.url) {
        body.thumbnail = {
          url: body.thumbnail.url,
          alt: body.thumbnail.alt || "",
        };
        ////console.log(`Final thumbnail object:`, body.thumbnail);
      } else {
        // Remove thumbnail if no valid URL
        delete body.thumbnail;
        ////console.log("Thumbnail removed - no valid URL found");
      }

      // Clean up any remaining thumbnail form fields
      delete body["thumbnail[alt]"];
      delete body["thumbnail[file]"];
      delete body["thumbnail.alt"];
      delete body["thumbnail.file"];

      // Filter out empty strings from targetAudience arrays
      if (body.targetAudience) {
        if (body.targetAudience.idealFor) {
          body.targetAudience.idealFor = body.targetAudience.idealFor.filter(item => item && item.trim() !== '');
        }
        if (body.targetAudience.consultDoctor) {
          body.targetAudience.consultDoctor = body.targetAudience.consultDoctor.filter(item => item && item.trim() !== '');
        }
      }
    } else {
      body = await req.json();
    }

    ////console.log("Final parsed product body:", JSON.stringify(body, null, 2));
    const result = await productController.create(body, conn);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true, product: result }, { status: 201 });
  } catch (error) {
    ////console.error("POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
