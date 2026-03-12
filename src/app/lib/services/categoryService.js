
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { successResponse, errorResponse } from '../../utils/response.js';
import CategoryRepository from '../repository/categoryRepository.js';
import { ProductSchema } from '../models/Product.js';

class CategoryService {
  constructor(conn) {
    this.conn = conn;
    this.categoryRepo = new CategoryRepository(conn);
  }

  async getSubCategoriesByCategoryId(categoryId) {
    try {
      //consolle.log('Fetching subcategories for categoryId:', categoryId);

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        //consolle.warn('Invalid categoryId:', categoryId);
        return errorResponse('Invalid categoryId', StatusCodes.BAD_REQUEST);
      }

      //   const subCategories = await SubCategory.find({ category: categoryId, deletedAt: null });
      //   //consolle.log('Subcategories found:', subCategories);
      //   return successResponse(subCategories, 'Subcategories fetched', StatusCodes.OK);
    } catch (error) {
      //consolle.log('Error in getSubCategoriesByCategoryId:', error.message);
      return errorResponse('Cannot fetch subcategories', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getAllCategories(query) {
    try {
      console.log("CategoryService.getAllCategories - Query received:", query);
      const {
        page = 1,
        limit = 10,
        filters = "{}",
        searchFields = "{}",
        sort = "{}",
        sortBy,
        sortOrder,
      } = query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Parse JSON strings from query parameters to objects with robustness
      const tryParse = (val, defaultVal = {}) => {
        if (!val || val === "undefined" || val === "null") return defaultVal;
        if (typeof val === "object") return val;
        try {
          return JSON.parse(val);
        } catch (e) {
          console.error(`Failed to parse parameter: ${val}`, e);
          return defaultVal;
        }
      };

      const parsedFilters = tryParse(filters);
      const parsedSearchFields = tryParse(searchFields);

      let sortConditions = {};

      if (sortBy) {
        // Remove quotes if present (some versions of the admin panel might send stringified strings)
        const cleanSortBy = typeof sortBy === "string" ? sortBy.replace(/^"+|"+$/g, "") : sortBy;
        sortConditions[cleanSortBy] = sortOrder === "asc" ? 1 : -1;
      } else {
        const parsedSort = tryParse(sort);
        for (const [field, direction] of Object.entries(parsedSort)) {
          sortConditions[field] = direction === "asc" ? 1 : -1;
        }
      }

      if (Object.keys(sortConditions).length === 0) {
        sortConditions = { createdAt: -1 };
      }

      // Build filter conditions for multiple fields
      const filterConditions = { deletedAt: null };

      for (const [key, value] of Object.entries(parsedFilters)) {
        if (value !== undefined && value !== null && value !== "") {
          filterConditions[key] = value;
        }
      }

      // Build search conditions for multiple fields with partial matching
      const searchConditions = [];
      for (const [field, term] of Object.entries(parsedSearchFields)) {
        searchConditions.push({ [field]: { $regex: term, $options: "i" } });
      }
      if (searchConditions.length > 0) {
        filterConditions.$or = searchConditions;
      }


      // Execute query with dynamic filters, sorting, and pagination
      const courseCategories = await this.categoryRepo.getAll(filterConditions, sortConditions, pageNum, limitNum);
      return successResponse(courseCategories, 'Categories fetched', StatusCodes.OK);
    } catch (error) {
      //consolle.log("error category", error.message);
      return errorResponse("Cannot fetch data of all the courseCategories", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await this.categoryRepo.findById(id);
      if (!category) {
        return errorResponse('Category not found', StatusCodes.NOT_FOUND);
      }
      return successResponse(category, 'Category fetched', StatusCodes.OK);
    } catch (error) {
      //consolle.error('Error in getCategoryById:', error);
      return errorResponse('Error fetching category', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async createCategory(data) {
    try {
      const created = await this.categoryRepo.create(data);
      return successResponse(created, 'Category created', StatusCodes.CREATED);
    } catch (error) {
      //consolle.log('Error in createCategory:', error.message);
      return errorResponse('Error creating category', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async findByName(name) {
    try {
      const found = await this.categoryRepo.findByName(name);
      if (!found) {
        return errorResponse('Category not found', StatusCodes.NOT_FOUND);
      }
      return successResponse(found, 'Category found', StatusCodes.OK);
    } catch (error) {
      //consolle.error('Error in findByName:', error);
      return errorResponse('Error finding category', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async updateCategory(id, data) {
    try {
      //consolle.log('Service updateCategory called with:', id, data);
      const updated = await this.categoryRepo.update(id, data);
      if (!updated) {
        return errorResponse('Category not found', StatusCodes.NOT_FOUND);
      }
      return successResponse(updated, 'Category updated', StatusCodes.OK);
    } catch (error) {
      //consolle.error('Error in updateCategory:', error);
      return errorResponse('Error updating category', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async deleteCategory(id) {
    try {
      // Check whether any non-deleted products reference this category
      const Product = this.conn.models.Product || this.conn.model('Product', ProductSchema);
      const productCount = await Product.countDocuments({ category: id, deletedAt: null });
      if (productCount > 0) {
        return errorResponse(
          'This category cannot be deleted because it has associated products.',
          StatusCodes.CONFLICT
        );
      }

      const deleted = await this.categoryRepo.softDelete(id);
      if (!deleted) {
        return errorResponse('Category not found', StatusCodes.NOT_FOUND);
      }
      return successResponse(deleted, 'Category deleted', StatusCodes.OK);
    } catch (error) {
      //consolle.error('Error in deleteCategory:', error);
      return errorResponse('Error deleting category', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

export default CategoryService;
