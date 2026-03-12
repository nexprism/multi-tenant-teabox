export default class EmailTemplateController {
  constructor(emailTemplateService) {
    this.emailTemplateService = emailTemplateService;
  }

  async getAll(query, conn) {
    try {
      //consolle.log('Controller getAll called with query:', query);
      return await this.emailTemplateService.getAll(query, conn);
    } catch (error) {
      //consolle.error('Controller getAll error:', error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      //consolle.log('Controller getById called with id:', id);
      return await this.emailTemplateService.getById(id, conn);
    } catch (error) {
      //consolle.error('Controller getById error:', error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      //consolle.log('Controller create called with data:', data);
      return await this.emailTemplateService.create(data, conn);
    } catch (error) {
      //consolle.error('Controller create error:', error.message);
      throw error;
    }
  }

  async update(id, data, conn) {
    try {
      //consolle.log('Controller update called with id:', id, 'and data:', data);
      return await this.emailTemplateService.update(id, data, conn);
    } catch (error) {
      //consolle.error('Controller update error:', error.message);
      throw error;
    }
  }

  async delete(id, conn) {
    try {
      //consolle.log('Controller delete called with id:', id);
      return await this.emailTemplateService.delete(id, conn);
    } catch (error) {
      //consolle.error('Controller delete error:', error.message);
      throw error;
    }
  }
}
