import mongoose from 'mongoose';

export default class FaqService {
  constructor(faqRepository) {
    this.faqRepository = faqRepository;
  }

  async getAll(query, conn) {
    try {
      //consolle.log('Service getAll called with query:', query);
      return await this.faqRepository.getAll(query, conn);
    } catch (error) {
      //consolle.error('Service getAll error:', error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      //consolle.log('Service getById called with id:', id);
      return await this.faqRepository.getById(id, conn);
    } catch (error) {
      //consolle.error('Service getById error:', error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      //consolle.log('Service create called with data:', data);
      
      // Validation logic
      const { body } = data;
      if (!body.question || !body.answer || !body.type) {
        return {
          success: false,
          message: 'Question, answer, and type are required fields'
        };
      }

      // Validate type
      if (!['website', 'product'].includes(body.type)) {
        return {
          success: false,
          message: 'Type must be either "website" or "product"'
        };
      }

      // Validate product for product type FAQ
      if (body.type === 'product') {
        if (!body.product) {
          return {
            success: false,
            message: 'Product is required for product type FAQ'
          };
        }
        if (!mongoose.Types.ObjectId.isValid(body.product)) {
          return {
            success: false,
            message: 'Invalid product ID'
          };
        }
      }

      // Validate status if provided
      if (body.status && !['active', 'inactive'].includes(body.status)) {
        return {
          success: false,
          message: 'Status must be either "active" or "inactive"'
        };
      }

      return await this.faqRepository.create(body, conn);
    } catch (error) {
      //consolle.error('Service create error:', error.message);
      throw error;
    }
  }

  async update(id, data, conn) {
    try {
      //consolle.log('Service update called with id:', id, 'and data:', data);
      
      const { body } = data;
      if (!body || Object.keys(body).length === 0) {
        return {
          success: false,
          message: 'No data provided for update'
        };
      }

      // Validate type if being updated
      if (body.type && !['website', 'product'].includes(body.type)) {
        return {
          success: false,
          message: 'Type must be either "website" or "product"'
        };
      }

      // Validate product if type is product
      if (body.type === 'product' && body.product && !mongoose.Types.ObjectId.isValid(body.product)) {
        return {
          success: false,
          message: 'Invalid product ID'
        };
      }

      // Validate status if provided
      if (body.status && !['active', 'inactive'].includes(body.status)) {
        return {
          success: false,
          message: 'Status must be either "active" or "inactive"'
        };
      }

      return await this.faqRepository.update(id, body, conn);
    } catch (error) {
      //consolle.error('Service update error:', error.message);
      throw error;
    }
  }

  async delete(id, conn) {
    try {
      //consolle.log('Service delete called with id:', id);
      return await this.faqRepository.delete(id, conn);
    } catch (error) {
      //consolle.error('Service delete error:', error.message);
      throw error;
    }
  }
}
