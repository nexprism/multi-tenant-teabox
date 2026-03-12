import {
  contactCreateValidator,
  contactUpdateValidator,
} from "../../validators/contactValidator.js";

export default class ContactService {
  constructor(contactRepository) {
    this.contactRepository = contactRepository;
  }

  async getAll(query, conn) {
    try {
      return await this.contactRepository.getAll(query, conn);
    } catch (error) {
      //consolle.error("ContactService getAll error:", error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      const { body } = data;
      if (!body) {
        return { success: false, message: "Request body is required" };
      }
      // Validate using Joi validator
      const { error, value } = contactCreateValidator.validate(body);
      if (error) {
        return {
          success: false,
          message: "Validation error",
          data: error.details,
        };
      }

      // value is sanitized/trimmed by Joi rules
      const payload = {
        name: value.name,
        email: value.email,
        phone: value.phone,
        message: value.message,
      };

      return await this.contactRepository.create(payload, conn);
    } catch (error) {
      //consolle.error("ContactService create error:", error.message);
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      if (!id)
        return { success: false, message: "ID is required", status: 400 };
      return await this.contactRepository.getById(id, conn);
    } catch (error) {
      //consolle.error("ContactService getById error:", error.message);
      throw error;
    }
  }

  async updateById(id, data, conn) {
    try {
      if (!id)
        return { success: false, message: "ID is required", status: 400 };
      const { body } = { body: data };
      if (!body || Object.keys(body).length === 0)
        return { success: false, message: "Request body is required" };

      const { error, value } = contactUpdateValidator.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        return {
          success: false,
          message: "Validation error",
          data: error.details,
        };
      }

      // Build payload only with provided fields
      const payload = {};
      if (typeof value.name !== "undefined") payload.name = value.name;
      if (typeof value.email !== "undefined") payload.email = value.email;
      if (typeof value.phone !== "undefined") payload.phone = value.phone;
      if (typeof value.message !== "undefined") payload.message = value.message;
      if (typeof value.status !== "undefined") payload.status = value.status;

      return await this.contactRepository.updateById(id, payload, conn);
    } catch (error) {
      //consolle.error("ContactService updateById error:", error.message);
      throw error;
    }
  }
}
