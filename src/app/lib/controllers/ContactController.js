export default class ContactController {
  constructor(contactService) {
    this.contactService = contactService;
  }

  async getAll(query, conn) {
    try {
      return await this.contactService.getAll(query, conn);
    } catch (error) {
      //consolle.error("ContactController getAll error:", error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      return await this.contactService.create(data, conn);
    } catch (error) {
      //consolle.error("ContactController create error:", error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      return await this.contactService.getById(id, conn);
    } catch (error) {
      //consolle.error("ContactController getById error:", error.message);
      throw error;
    }
  }

  async updateById(id, data, conn) {
    try {
      return await this.contactService.updateById(id, data, conn);
    } catch (error) {
      //consolle.error("ContactController updateById error:", error.message);
      throw error;
    }
  }
}
