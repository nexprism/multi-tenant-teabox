export default class FaqRepository {
  constructor(faqModel) {
    this.Faq = faqModel;
  }

  async getAll(query, conn) {
    try {
      //consolle.log('Repository getAll called with query:', query);
      
      let filter = {};
      const options = {};
      
      // Filter by type
      if (query.type && ['website', 'product'].includes(query.type)) {
        filter.type = query.type;
      }

      // Filter by status
      if (query.status && ['active', 'inactive'].includes(query.status)) {
        filter.status = query.status;
      }

      // Filter by product
      if (query.product) {
        filter.product = query.product;
      }

      // Handle search
      if (query.search) {
        filter.$or = [
          { question: { $regex: query.search, $options: 'i' } },
          { answer: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Handle pagination
      if (query.page && query.limit) {
        const page = parseInt(query.page);
        const limit = parseInt(query.limit);
        options.skip = (page - 1) * limit;
        options.limit = limit;
      }

      // Handle sorting
      if (query.sort) {
        const sortOrder = query.order === 'desc' ? -1 : 1;
        options.sort = { [query.sort]: sortOrder };
      } else {
        options.sort = { createdAt: -1 };
      }

      // Check if Product model is available before populating
      let faqs;
      try {
        const hasProductModel = conn.models.Product;
        if (hasProductModel) {
          faqs = await this.Faq.find(filter, null, options).populate('product', 'name slug');
        } else {
          faqs = await this.Faq.find(filter, null, options);
        }
      } catch (populateError) {
        //consolle.warn('Product population failed, returning FAQs without product details:', populateError.message);
        faqs = await this.Faq.find(filter, null, options);
      }
      
      const total = await this.Faq.countDocuments(filter);
      
      return {
        success: true,
        data: faqs,
        total,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : total
      };
    } catch (error) {
      //consolle.error('Repository getAll error:', error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      //consolle.log('Repository getById called with id:', id);
      
      // Check if Product model is available before populating
      let faq;
      try {
        const hasProductModel = conn.models.Product;
        if (hasProductModel) {
          faq = await this.Faq.findById(id).populate('product', 'name slug');
        } else {
          faq = await this.Faq.findById(id);
        }
      } catch (populateError) {
        //consolle.warn('Product population failed, returning FAQ without product details:', populateError.message);
        faq = await this.Faq.findById(id);
      }
      
      return faq;
    } catch (error) {
      //consolle.error('Repository getById error:', error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      //consolle.log('Repository create called with data:', data);
      const faq = new this.Faq(data);
      const savedFaq = await faq.save();
      
      // Check if Product model is available before populating
      let populatedFaq;
      try {
        const hasProductModel = conn.models.Product;
        if (hasProductModel) {
          populatedFaq = await this.Faq.findById(savedFaq._id).populate('product', 'name slug');
        } else {
          populatedFaq = savedFaq;
        }
      } catch (populateError) {
        //consolle.warn('Product population failed, returning FAQ without product details:', populateError.message);
        populatedFaq = savedFaq;
      }
      
      return {
        success: true,
        data: populatedFaq
      };
    } catch (error) {
      //consolle.error('Repository create error:', error.message);
      if (error.code === 11000) {
        return {
          success: false,
          message: 'FAQ with this question already exists'
        };
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return {
          success: false,
          message: messages.join(', ')
        };
      }
      throw error;
    }
  }

  async update(id, data, conn) {
    try {
      //consolle.log('Repository update called with id:', id, 'and data:', data);
      
      // Check if Product model is available before populating
      let faq;
      try {
        const hasProductModel = conn.models.Product;
        if (hasProductModel) {
          faq = await this.Faq.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
          ).populate('product', 'name slug');
        } else {
          faq = await this.Faq.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
          );
        }
      } catch (populateError) {
        //consolle.warn('Product population failed, returning FAQ without product details:', populateError.message);
        faq = await this.Faq.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true, runValidators: true }
        );
      }
      
      if (!faq) {
        return {
          success: false,
          message: 'FAQ not found'
        };
      }

      return {
        success: true,
        data: faq
      };
    } catch (error) {
      //consolle.error('Repository update error:', error.message);
      if (error.code === 11000) {
        return {
          success: false,
          message: 'FAQ with this question already exists'
        };
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return {
          success: false,
          message: messages.join(', ')
        };
      }
      throw error;
    }
  }

  async delete(id, conn) {
    try {
      //consolle.log('Repository delete called with id:', id);
      const faq = await this.Faq.findByIdAndDelete(id);
      
      if (!faq) {
        return {
          success: false,
          message: 'FAQ not found'
        };
      }

      return {
        success: true,
        data: faq
      };
    } catch (error) {
      //consolle.error('Repository delete error:', error.message);
      throw error;
    }
  }
}
