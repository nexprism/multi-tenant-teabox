import BrandRepository from "../repository/brandRepository";

export default class BrandService {
  constructor(connection) {
    this.brandRepository = new BrandRepository(connection);
  }

  async createBrand(data) {
    return await this.brandRepository.create(data);
  }

  async getAllBrands({ search, page, limit, filters } = {}) {
    return await this.brandRepository.findAll({ search, page, limit, filters });
  }

  async getBrandById(id) {
    return await this.brandRepository.findById(id);
  }

  async updateBrand(id, data) {
    return await this.brandRepository.update(id, data);
  }

  async deleteBrand(id) {
    return await this.brandRepository.delete(id);
  }

  async searchBrandsByName(searchQuery, page, limit) {
    return await this.brandRepository.findAll({
      search: searchQuery,
      page,
      limit,
    });
  }
}
