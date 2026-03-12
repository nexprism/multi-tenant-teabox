import { saveFile, validateImageFile } from '../../config/fileUpload.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { subCategoryCreateValidator, subCategoryUpdateValidator } from '../../validators/subCategoryValidator.js';
import SubCategory from '../../lib/models/SubCategory.js';
import { categorySchema } from '../models/Category.js';
export async function createSubCategory(form, conn) {
  try {
    let imageUrl = '';
    let thumbnailUrl = '';
    const SubCategoryService = (await import('../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);

    const name = form.get('name');
    const slug = form.get('slug');
    const description = form.get('description');
    const image = form.get('image');
    const thumbnail = form.get('thumbnail');
    const seoTitle = form.get('seoTitle');
    const seoDescription = form.get('seoDescription');
    const status = form.get('status');
    const sortOrder = form.get('sortOrder');
    const isFeatured = form.get('isFeatured');
    const parentCategory = form.get('parentCategory');

    // Ensure Category model is registered on tenant connection
    const CategoryModel = conn.models.Category || conn.model('Category', categorySchema);
    const parentExists = await CategoryModel.findById(parentCategory);
    if (!parentExists) {
      return {
        status: 400,
        body: errorResponse('Parent category does not exist', 400),
      };
    }

    const existing = await subCategoryService.findByName(name);
    if (existing?.status !== 404) {
      return {
        status: 400,
        body: errorResponse('Subcategory with this name already exists', 400),
      };
    }

    if (image && image instanceof File) {
      validateImageFile(image);
      imageUrl = await saveFile(image, 'subcategory-images');
    } else if (typeof image === 'string') {
      imageUrl = image;
    }

    if (thumbnail && thumbnail instanceof File) {
      validateImageFile(thumbnail);
      thumbnailUrl = await saveFile(thumbnail, 'subcategory-thumbnails');
    } else if (typeof thumbnail === 'string') {
      thumbnailUrl = thumbnail;
    }

    const { error, value } = subCategoryCreateValidator.validate({
      name,
      slug,
      description,
      image: imageUrl,
      thumbnail: thumbnailUrl,
      seoTitle,
      seoDescription,
      status,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' || isFeatured === true : undefined,
      parentCategory
    });

    if (error) {
      //consolle.error("🚫 Validation failed:", error.details);
      return {
        status: 400,
        body: errorResponse('Validation error', 400, error.details),
      };
    }

    const newSubCategory = await subCategoryService.createSubCategory(value);
    return newSubCategory;
  } catch (err) {
    //consolle.log('Create Subcategory error:', err.message);
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}

export async function getSubCategories(query, conn) {
  try {
    const SubCategoryService = (await import('../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);
    const result = await subCategoryService.getAllSubCategories(query);
    return result;
  } catch (err) {
    //consolle.error('Get Subcategories error:', err.message);
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}

export async function getSubCategoryById(id, conn) {
  try {
    const SubCategoryService = (await import('../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);
    const subCategory = await subCategoryService.getSubCategoryById(id);
    return subCategory;
  } catch (err) {
    //consolle.error('Get Subcategory error:', err.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error' },
    };
  }
}

export async function updateSubCategory(id, data, conn) {
  try {
    let imageUrl = '';
    let thumbnailUrl = '';
    const { image, thumbnail, ...fields } = data;
    const SubCategoryService = (await import('../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);

    if (image && image instanceof File) {
      validateImageFile(image);
      imageUrl = await saveFile(image, 'subcategory-images');
    }

    if (thumbnail && thumbnail instanceof File) {
      validateImageFile(thumbnail);
      thumbnailUrl = await saveFile(thumbnail, 'subcategory-thumbnails');
    }

    const cleanedFields = Object.entries(fields).reduce((acc, [key, value]) => {
      if (value !== '') acc[key] = value;
      return acc;
    }, {});

    const payload = {
      ...cleanedFields,
      ...(imageUrl ? { image: imageUrl } : (image ? { image } : {})),
      ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : (thumbnail ? { thumbnail } : {})),
    };

    const { error, value } = subCategoryUpdateValidator.validate(payload);
    if (error) {
      return {
        status: 400,
        body: errorResponse("Validation error", 400, error.details),
      };
    }
    const updated = await subCategoryService.updateSubCategory(id, value);
    return updated;
  } catch (err) {
    //consolle.error('Update Subcategory error:', err.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error' },
    };
  }
}

export async function deleteSubCategory(id, conn) {
  try {
    const SubCategoryService = (await import('../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);
    const deleted = await subCategoryService.deleteSubCategory(id);
    return deleted;
  } catch (err) {
    //consolle.error('Delete Subcategory error:', err.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error' },
    };
  }
}