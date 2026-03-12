export default class EmailTemplateRepository {
  constructor(emailTemplateModel) {
    this.EmailTemplate = emailTemplateModel;
  }

  async getAll(query, conn) {
    try {
      console.log('Repository getAll called with query:', query);
      
      let filter = {};
      const options = {};
      
      // Handle search
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: 'i' } },
          { subject: { $regex: query.search, $options: 'i' } }
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

      const emailTemplates = await this.EmailTemplate.find(filter, null, options);
      const total = await this.EmailTemplate.countDocuments(filter);
      
      return {
        success: true,
        data: emailTemplates,
        total,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : total
      };
    } catch (error) {
      console.error('Repository getAll error:', error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      console.log('Repository getById called with id:', id);
      
      // Validate ID format
      if (!id || typeof id !== 'string') {
        console.error('Invalid ID format:', id);
        return null;
      }
      
      const emailTemplate = await this.EmailTemplate.findById(id);
      
      if (!emailTemplate) {
        console.log('Email template not found for id:', id);
        return null;
      }
      
      return emailTemplate;
    } catch (error) {
      console.error('Repository getById error:', error.message);
      // Return null instead of throwing to allow graceful handling
      if (error.name === 'CastError') {
        return null;
      }
      throw error;
    }
  }

  async create(data, conn) {
    try {
      console.log('Repository create called with data:', data);
      const emailTemplate = new this.EmailTemplate(data);
      const savedEmailTemplate = await emailTemplate.save();
      return {
        success: true,
        data: savedEmailTemplate
      };
    } catch (error) {
      console.error('Repository create error:', error.message);
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Email template with this name already exists'
        };
      }
      throw error;
    }
  }

  async update(id, data, conn) {
    try {
      console.log('Repository update called with id:', id, 'and data:', data);
      const emailTemplate = await this.EmailTemplate.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!emailTemplate) {
        return {
          success: false,
          message: 'Email template not found'
        };
      }

      return {
        success: true,
        data: emailTemplate
      };
    } catch (error) {
      console.error('Repository update error:', error.message);
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Email template with this name already exists'
        };
      }
      throw error;
    }
  }

  async delete(id, conn) {
    try {
      console.log('Repository delete called with id:', id);
      const emailTemplate = await this.EmailTemplate.findByIdAndDelete(id);
      
      if (!emailTemplate) {
        return {
          success: false,
          message: 'Email template not found'
        };
      }

      return {
        success: true,
        data: emailTemplate
      };
    } catch (error) {
      console.error('Repository delete error:', error.message);
      throw error;
    }
  }
}
