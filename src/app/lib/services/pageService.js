
import PageRepository from '../repository/pageRepository.js';

class PageService {
  constructor(conn) {
    this.conn = conn;
    this.pageRepo = new PageRepository(conn);
  }

  async createPage(data) {
    try {
      const created = await this.pageRepo.create(data);
      return { data: created };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async getPageById(id) {
    try {
      const page = await this.pageRepo.findById(id);
      return { data: page };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async updatePage(id, data) {
    try {
      const updated = await this.pageRepo.update(id, data);
      return { data: updated };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async deletePage(id) {
    try {
      const deleted = await this.pageRepo.softDelete(id);
      return { data: deleted };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async getAllPages(query = {}) {
    try {
      // If groupByMainTitle param is set, use aggregation
      if (query.groupByMainTitle === 'true' || query.groupByMainTitle === true) {
        const grouped = await this.pageRepo.groupByMainTitle();
        return { data: grouped };
      }

      const {
        page = 1,
        limit = 10,
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

      // Build search conditions for multiple fields with partial matching
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

      const result = await this.pageRepo.getAll(
        filterConditions,
        sortConditions,
        pageNum,
        limitNum,
        populateFields,
        selectFields
      );
      return { data: result };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

export default PageService;
