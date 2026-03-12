// lib/services/productService.js
import mongoose from "mongoose";
import { VariantSchema, variantSchema } from "../models/Variant.js";
import { attributeSchema } from "../models/Attribute.js";
import { wishlistSchema } from "../models/Wishlist";

class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async createProduct(data, conn) {
    if (conn && conn.models && conn.models.Product) {
      this.productRepository.model = conn.models.Product;
    }
    const result = await this.productRepository.create(data);
    return result;
  }

  async getAllProducts(query = {}, conn) {
    if (conn && conn.models && conn.models.Product) {
      this.productRepository.model = conn.models.Product;
    }

    const {
      page = 1,
      limit = 10,
      filters = "{}",
      searchFields = "{}",
      sort = "{}",
      populateFields = [],
      selectFields = {},
      status,
      category,
      subcategory,
      isAddon,
      // keep legacy names but we'll also accept `min`/`max` below
      minPrice,
      maxPrice,
      name,
      sortBy,
      sortOrder,
      onlyWithVariants,
    } = query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    console.log(`[ProductService] RECEIVED QUERY at ${new Date().toISOString()}:`, JSON.stringify(query));

    // Parse JSON strings from query parameters to objects with robustness
    const tryParse = (val, defaultVal = {}) => {
      if (!val || val === "undefined" || val === "null") return defaultVal;
      if (typeof val === "object") return val;
      try {
        return JSON.parse(val);
      } catch (e) {
        console.warn(`[ProductService] Failed to parse parameter: ${val}`, e.message);
        return defaultVal;
      }
    };

    const parsedFilters = tryParse(filters);
    const parsedSearchFields = tryParse(searchFields);
    const parsedSort = tryParse(sort);

    const filterConditions = { deletedAt: null, ...parsedFilters };

    if (status) {
      filterConditions.status = status;
    }

    if (category && category !== "undefined" && category !== "null" && category !== "") {
      try {
        filterConditions.category = mongoose.Types.ObjectId.isValid(category)
          ? new mongoose.Types.ObjectId(category)
          : category;
        console.log(`[ProductService] Applying category filter: ${filterConditions.category} (type: ${typeof filterConditions.category})`);
      } catch (e) {
        filterConditions.category = category;
        console.warn(`[ProductService] Category ObjectId conversion failed, using raw value:`, category);
      }
    }

    if (subcategory && subcategory !== "undefined" && subcategory !== "null" && subcategory !== "") {
      try {
        filterConditions.subcategory = mongoose.Types.ObjectId.isValid(subcategory)
          ? new mongoose.Types.ObjectId(subcategory)
          : subcategory;
        console.log(`[ProductService] Applying subcategory filter: ${filterConditions.subcategory}`);
      } catch (e) {
        filterConditions.subcategory = subcategory;
      }
    }

    if (isAddon) {
      filterConditions.isAddon = isAddon === "true";
    }

    if (name && name !== "undefined" && name !== "null" && name !== "") {
      filterConditions.name = { $regex: name, $options: "i" };
      console.log(`[ProductService] Applying name filter: ${name}`);
    }

    // Handle onlyWithVariants filter - must be checked separately to ensure it always runs
    if (onlyWithVariants === "true" || onlyWithVariants === true || onlyWithVariants === "1" || onlyWithVariants === 1) {
      const Variant = conn.models.Variant || conn.model("Variant", variantSchema);
      // Find all variants that are not deleted and get distinct productIds
      // Use lean() to get plain JavaScript objects and handle both ObjectId and string formats
      const variants = await Variant.find({ deletedAt: null }).lean();
      const productsWithVariants = [...new Set(variants.map(v => {
        const pid = v.productId;
        // Convert to string for consistent comparison, handle both ObjectId and string
        return pid ? (pid.toString ? pid.toString() : String(pid)) : null;
      }).filter(Boolean))];
      
      console.log(`[ProductService] Found ${variants.length} variants (deletedAt: null)`);
      console.log(`[ProductService] Found ${productsWithVariants.length} unique products with variants (onlyWithVariants=true)`);
      console.log(`[ProductService] Product IDs with variants:`, productsWithVariants);

      if (Array.isArray(productsWithVariants) && productsWithVariants.length > 0) {
        // Convert all IDs to ObjectIds for MongoDB query
        const productIds = productsWithVariants.map(idStr => {
          try {
            if (mongoose.Types.ObjectId.isValid(idStr)) {
              return new mongoose.Types.ObjectId(idStr);
            }
            return idStr;
          } catch {
            return idStr;
          }
        });
        const productIdStrings = productIds.map(id => id ? id.toString() : String(id));

        // Merge with existing _id filter if present
        if (filterConditions._id) {
          if (filterConditions._id.$in) {
            // If _id already has $in, intersect the arrays
            filterConditions._id.$in = filterConditions._id.$in.filter(id => {
              const idStr = id ? id.toString() : String(id);
              return productIdStrings.includes(idStr);
            });
            // If intersection is empty, ensure we get no results
            if (filterConditions._id.$in.length === 0) {
              filterConditions._id = { $in: [] };
            }
          } else {
            // If _id is a single value, check if it's in productsWithVariants
            const idStr = filterConditions._id ? filterConditions._id.toString() : String(filterConditions._id);
            if (!productIdStrings.includes(idStr)) {
              filterConditions._id = { $in: [] }; // Product doesn't have variants
            }
          }
        } else {
          filterConditions._id = { $in: productIds };
        }
      } else {
        // No products have variants, return empty result
        filterConditions._id = { $in: [] };
      }
      
      console.log(`[ProductService] Final filterConditions._id after onlyWithVariants:`, 
        filterConditions._id?.$in ? `${filterConditions._id.$in.length} product IDs` : filterConditions._id);
    }

    // Handle price filters separately (only apply if not already handled by onlyWithVariants)
    const minQuery =
      minPrice || query.min || query.min_price || query.minprice || null;
    const maxQuery =
      maxPrice || query.max || query.max_price || query.maxprice || null;

    if ((minQuery || maxQuery) && onlyWithVariants !== "true" && onlyWithVariants !== true) {
      const minVal = minQuery ? parseFloat(minQuery) : null;
      const maxVal = maxQuery ? parseFloat(maxQuery) : null;

      // Build variant filters
      const variantFilters = { deletedAt: null };

      if (minVal != null || maxVal != null) {
        if (minVal != null && maxVal != null) {
          variantFilters.$or = [
            { price: { $gte: minVal, $lte: maxVal } },
            { salePrice: { $gte: minVal, $lte: maxVal } },
          ];
        } else if (minVal != null) {
          variantFilters.$or = [
            { price: { $gte: minVal } },
            { salePrice: { $gte: minVal } },
          ];
        } else if (maxVal != null) {
          variantFilters.$or = [
            { price: { $lte: maxVal } },
            { salePrice: { $lte: maxVal } },
          ];
        }
      }

      console.log(`[ProductService] Variant filters:`, JSON.stringify(variantFilters));
      const Variant = conn.models.Variant || conn.model("Variant", variantSchema);
      const matchingVariants = await Variant.find(variantFilters).distinct("productId");
      console.log(`[ProductService] Found ${matchingVariants.length} products with matching variants`);

      if (Array.isArray(matchingVariants) && matchingVariants.length > 0) {
        if (filterConditions._id) {
          filterConditions._id = {
            $all: [filterConditions._id, { $in: matchingVariants }],
          };
        } else {
          filterConditions._id = { $in: matchingVariants };
        }
      } else {
        filterConditions._id = { $in: [] };
      }
    }

    // Build search conditions for multiple fields with partial matching
    const searchConditions = [];
    for (const [field, term] of Object.entries(parsedSearchFields)) {
      if (term && term !== "undefined" && term !== "null" && term !== "") {
        searchConditions.push({ [field]: { $regex: term, $options: "i" } });
      }
    }

    if (searchConditions.length > 0) {
      console.log(`[ProductService] Applying search conditions:`, JSON.stringify(searchConditions));
      if (searchConditions.length === 1) {
        // If only one search field, add it directly to minimize $or complexity
        const [field, condition] = Object.entries(searchConditions[0])[0];
        // Ensure we don't accidentally override essential filters like category if they were somehow in searchFields
        if (!filterConditions[field] || field === "name") {
          filterConditions[field] = condition;
        } else {
          // Fallback to $and if conflict
          if (!filterConditions.$and) filterConditions.$and = [];
          filterConditions.$and.push({ [field]: condition });
        }
      } else {
        // Use implicit $and behavior: { category, $or: [...] }
        filterConditions.$or = searchConditions;
      }
    }

    // Sorting logic: handle sortBy/sortOrder and merge with parsedSort
    const sortConditions = {};
    for (const [field, direction] of Object.entries(parsedSort)) {
      sortConditions[field] = direction === "asc" ? 1 : -1;
    }
    if (sortBy) {
      const cleanSortBy =
        typeof sortBy === "string" ? sortBy.replace(/^"+|"+$/g, "") : sortBy;
      sortConditions[cleanSortBy] = sortOrder === "asc" ? 1 : -1;
    }

    console.log("[ProductService.getAllProducts] FINAL MONGODB FILTER:", JSON.stringify(filterConditions, null, 2));

    return await this.productRepository.getAll(
      filterConditions,
      sortConditions,
      pageNum,
      limitNum,
      populateFields,
      selectFields,
      conn // Pass connection to repository
    );
  }

  async getProductById(id, conn) {
    //consolle.log("Fetching product with ID:", id);

    if (!conn) throw new Error("Database connection is required");
    if (!conn.models || !conn.models.Product) {
      throw new Error("Product model not found in the provided connection");
    }
    if (conn && conn.models && conn.models.Product) {
      this.productRepository.model = conn.models.Product;
    }
    return await this.productRepository.findById(id);
  }

  async updateProduct(id, data, conn) {
    if (conn && conn.models && conn.models.Product) {
      this.productRepository.model = conn.models.Product;
    }
    return await this.productRepository.update(id, data);
  }

  async deleteProduct(id, conn) {
    if (conn && conn.models && conn.models.Product) {
      this.productRepository.model = conn.models.Product;
    }
    return await this.productRepository.delete(id);
  }
}

export default ProductService;
