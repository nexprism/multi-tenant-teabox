import VariantRepository from '../repository/variantRepository.js';

class VariantService {
  constructor(conn) {
    this.variantRepo = new VariantRepository(conn);
  }

  async createVariant(data) {
    return await this.variantRepo.create(data);
  }

  async getAllVariants(query = {}) {
    // Support pagination, filtering, search, and sorting
    const {
      page = 1,
      limit = 1000,
      filters = '{}',
      searchFields = '{}',
      sort = '{}',
      populateFields = [],
      selectFields = {}
    } = query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    const parsedSearchFields = typeof searchFields === 'string' ? JSON.parse(searchFields) : searchFields;
    const parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;

    // Build filter conditions
    const filterConditions = { deletedAt: null, ...parsedFilters };
    // Build search conditions
    const searchConditions = [];
    for (const [field, term] of Object.entries(parsedSearchFields)) {
      searchConditions.push({ [field]: { $regex: term, $options: 'i' } });
    }
    if (searchConditions.length > 0) {
      filterConditions.$or = searchConditions;
    }
    // Build sort conditions
    const sortConditions = {};
    for (const [field, direction] of Object.entries(parsedSort)) {
      sortConditions[field] = direction === 'asc' ? 1 : -1;
    }

    // Call repository getAll for paginated, filtered, sorted results
    return await this.variantRepo.getAll(
      filterConditions,
      sortConditions,
      pageNum,
      limitNum,
      populateFields,
      selectFields
    );
  }

  async getVariantById(id) {
    return await this.variantRepo.get(id);
  }

  async updateVariant(id, data) {
    return await this.variantRepo.update(id, data);
  }

  async deleteVariant(id) {
    return await this.variantRepo.delete(id);
  }

  async searchVariantsByTitle(title) {
    return await this.variantRepo.searchByTitle(title);
  }
}

export default VariantService;
