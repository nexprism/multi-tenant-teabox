export default class EmailTemplateService {
  constructor(emailTemplateRepository) {
    this.emailTemplateRepository = emailTemplateRepository;
  }

  async getAll(query, conn) {
    try {
      //console.log('Service getAll called with query:', query);
      return await this.emailTemplateRepository.getAll(query, conn);
    } catch (error) {
      //console.error('Service getAll error:', error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      //console.log('Service getById called with id:', id);
      return await this.emailTemplateRepository.getById(id, conn);
    } catch (error) {
      //console.error('Service getById error:', error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      //console.log('Service create called with data:', data);

      // Validation logic
      const { body } = data;
      if (!body.name || !body.subject || !body.content) {
        return {
          success: false,
          message: 'Name, subject, and content are required fields'
        };
      }

      return await this.emailTemplateRepository.create(body, conn);
    } catch (error) {
      //console.error('Service create error:', error.message);
      throw error;
    }
  }

  async update(id, data, conn) {
    try {
      //console.log('Service update called with id:', id, 'and data:', data);

      const { body } = data;
      if (!body || Object.keys(body).length === 0) {
        return {
          success: false,
          message: 'No data provided for update'
        };
      }

      return await this.emailTemplateRepository.update(id, body, conn);
    } catch (error) {
      //console.error('Service update error:', error.message);
      throw error;
    }
  }

  async delete(id, conn) {
    try {
      //console.log('Service delete called with id:', id);
      return await this.emailTemplateRepository.delete(id, conn);
    } catch (error) {
      //console.error('Service delete error:', error.message);
      throw error;
    }
  }
}
