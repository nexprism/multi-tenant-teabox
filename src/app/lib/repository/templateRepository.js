import CrudRepository from "./CrudRepository.js";
import { templateSchema } from "../models/Template.js";
import mongoose from "mongoose";

class TemplateRepository extends CrudRepository {
  constructor(conn) {
    // Use the provided connection for tenant DB, or global mongoose if not provided
    const connection = conn || mongoose;
    const TemplateModel =
      connection.models.Template ||
      connection.model("Template", templateSchema);
    super(TemplateModel);
    this.Template = TemplateModel;
    this.connection = connection;
  }

  async create(data) {
    try {
      const template = new this.Template(data);
      return await template.save();
    } catch (error) {
      //consolle.error("TemplateRepository create error:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await this.Template.findOne({ _id: id, deletedAt: null });
    } catch (error) {
      throw error;
    }
  }

  async findByProductId(productId) {
    try {
      return await this.Template.findOne({ productId });
    } catch (error) {
      //consolle.error("TemplateRepository findByProductId error:", error);
      throw error;
    }
  }

 

  async update(id, data) {
    try {
      const updatedTemplate = await this.Template.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      return updatedTemplate;
    } catch (error) {
      //consolle.error("TemplateRepository update error:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await this.Template.findByIdAndDelete(id);
    } catch (error) {
      //consolle.error("TemplateRepository delete error:", error);
      throw error;
    }
  }

  async findByLayoutId(layoutId) {
    try {
      return await this.Template.find({ layoutId });
    } catch (error) {
      //consolle.error("TemplateRepository findByLayoutId error:", error);
      throw error;
    }
  }

  async findByLayoutName(layoutName) {
    try {
      return await this.Template.find({
        layoutName: new RegExp(layoutName, "i"),
      });
    } catch (error) {
      //consolle.error("TemplateRepository findByLayoutName error:", error);
      throw error;
    }
  }
}

export default TemplateRepository;
