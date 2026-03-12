import AttributeRepository from "../repository/attributeRepository.js";

class AttributeService {
  constructor(conn) {
    this.attributeRepo = new AttributeRepository(conn);
  }

  async createAttribute(data) {
    return await this.attributeRepo.create(data);
  }

  async getAllAttributes(query = {}) {
    // Support pagination, filtering, search, and sorting
    //consolle.log("Query Parameters attribute: ==>", query);
    const {
      page = 1,
      limit = 10,
      filters = "{}",
      searchFields = "{}",
      sort = "{}",
      populateFields = [],
      selectFields = {},
    } = query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const parsedFilters =
      typeof filters === "string" ? JSON.parse(filters) : filters;
    const parsedSearchFields =
      typeof searchFields === "string"
        ? JSON.parse(searchFields)
        : searchFields;
    const parsedSort = typeof sort === "string" ? JSON.parse(sort) : sort;

    // Parse selectFields for projection or fallback search
    let parsedSelectFields = {};
    try {
      parsedSelectFields =
        typeof selectFields === "string"
          ? JSON.parse(selectFields)
          : selectFields || {};
    } catch (err) {
      //consolle.warn(
      //   "Invalid selectFields JSON provided to getAllAttributes:",
      //   err.message
      // );
      parsedSelectFields = {};
    }

    //consolle.log("requestes ==> ", {
    //   page,
    //   limit,
    //   filters,
    //   searchFields,
    //   sort,
    //   populateFields,
    //   selectFields,
    // });
    // Build filter conditions
    const filterConditions = { deletedAt: null };

    for (const [key, value] of Object.entries(parsedFilters)) {
      filterConditions[key] = value;
    }

    // Build search conditions
    const searchConditions = [];

    // If no explicit searchFields provided, allow selectFields to be used as a fallback for searching
    const effectiveSearchFields =
      Object.keys(parsedSearchFields || {}).length === 0
        ? parsedSelectFields
        : parsedSearchFields;

    //consolle.log("parsedSearchFields ", parsedSearchFields);
    for (const [field, term] of Object.entries(effectiveSearchFields || {})) {
      if (term !== undefined && term !== null && term !== "") {
        // Only treat string/primitive values as search terms
        searchConditions.push({
          [field]: { $regex: String(term), $options: "i" },
        });
      }
    }
    if (searchConditions.length > 0) {
      filterConditions.$or = searchConditions;
    }
    // Build sort conditions
    const sortConditions = {};
    for (const [field, direction] of Object.entries(parsedSort)) {
      sortConditions[field] = direction === "asc" ? 1 : -1;
    }

    // Build projection object for mongoose .select()
    const projection = {};
    for (const [field, val] of Object.entries(parsedSelectFields || {})) {
      if (val === 1 || val === "1" || val === 0 || val === "0") {
        projection[field] = Number(val);
      }
    }

    // Call repository getAll for paginated, filtered, sorted results (pass projection)
    return await this.attributeRepo.getAll(
      filterConditions,
      sortConditions,
      pageNum,
      limitNum,
      populateFields,
      projection
    );
  }

  async getAttributeById(id) {
    // get from CrudRepository returns by id
    return await this.attributeRepo.get(id);
  }

  //getAttributesByProductId
  async getAttributesByProductId(productId) {
    // Assuming the repository has a method to find attributes by product ID
    return await this.attributeRepo.findByProductId(productId);
  }

  async updateAttribute(id, data) {
    return await this.attributeRepo.update(id, data);
  }

  async deleteAttribute(id) {
    // Use custom soft delete from AttributeRepository
    return await this.attributeRepo.delete(id);
  }

  async searchAttributesByName(name) {
    return await this.attributeRepo.searchByName(name);
  }

  async searchAttributesByNameIncludingDeleted(name) {
    return await this.attributeRepo.searchByNameIncludingDeleted(name);
  }

  async permanentDeleteByName(name) {
    return await this.attributeRepo.permanentDeleteByName(name);
  }
}

export default AttributeService;
