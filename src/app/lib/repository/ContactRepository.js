export default class ContactRepository {
  constructor(contactModel) {
    this.Contact = contactModel;
  }

  async getAll(query, conn) {
    try {
      let filter = {};
      const options = {};

      // Filter by status
      if (query.status && ["new", "read", "closed"].includes(query.status)) {
        filter.status = query.status;
      }

      // Handle search across name, email, message
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: "i" } },
          { email: { $regex: query.search, $options: "i" } },
          { message: { $regex: query.search, $options: "i" } },
        ];
      }

      // Pagination
      let page = 1;
      let limit = 0;
      if (query.page) page = parseInt(query.page) || 1;
      if (query.limit) limit = parseInt(query.limit) || 0;
      if (limit > 0) {
        options.skip = (page - 1) * limit;
        options.limit = limit;
      }

      // Sorting
      if (query.sort) {
        const sortOrder = query.order === "desc" ? -1 : 1;
        options.sort = { [query.sort]: sortOrder };
      } else {
        options.sort = { createdAt: -1 };
      }

      const contacts = await this.Contact.find(filter, null, options);
      const total = await this.Contact.countDocuments(filter);

      return {
        success: true,
        data: contacts,
        total,
        page,
        limit: limit || total,
      };
    } catch (error) {
      console.error("ContactRepository getAll error:", error.message);
      throw error;
    }
  }

  async create(data, conn) {
    try {
      const contact = new this.Contact(data);
      const saved = await contact.save();
      return { success: true, data: saved };
    } catch (error) {
      console.error("ContactRepository create error:", error.message);
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return { success: false, message: messages.join(", ") };
      }
      throw error;
    }
  }

  async getById(id, conn) {
    try {
      if (!id)
        return { success: false, message: "ID is required", status: 400 };
      const contact = await this.Contact.findById(id);
      if (!contact)
        return { success: false, message: "Contact not found", status: 404 };
      return { success: true, data: contact };
    } catch (error) {
      console.error("ContactRepository getById error:", error.message);
      throw error;
    }
  }

  async updateById(id, data, conn) {
    try {
      if (!id)
        return { success: false, message: "ID is required", status: 400 };
      if (!data || Object.keys(data).length === 0)
        return {
          success: false,
          message: "No data provided for update",
          status: 400,
        };

      const updated = await this.Contact.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!updated)
        return { success: false, message: "Contact not found", status: 404 };
      return { success: true, data: updated };
    } catch (error) {
      console.error("ContactRepository updateById error:", error.message);
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return { success: false, message: messages.join(", "), status: 400 };
      }
      throw error;
    }
  }
}
