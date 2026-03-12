

import getBlogModel from '../models/Blog';
import CrudRepository from './CrudRepository';

export class BlogRepository extends CrudRepository {
  constructor(conn) {
    super(getBlogModel(conn));
    this.model = getBlogModel(conn);
  }

  // Always include slug in getAll and filter out deleted
// async getAll(filterCon = {}, sortCon = {}, pageNum, limitNum, populateFields = [], selectFields = {}) {
//     filterCon = { ...filterCon, deleted: false };
//     // Always include slug, but allow all other fields unless selectFields is specified
//     if (selectFields && Object.keys(selectFields).length > 0) {
//         selectFields.slug = 1;
//     }
//     return await super.getAll(filterCon, sortCon, pageNum, limitNum, populateFields, selectFields);
// }

  // Always include slug in get and filter out deleted
  async get(id, populateFields = []) {
    const doc = await this.model.findOne({ _id: id, deleted: false });
    if (!doc) return null;
    if (populateFields?.length > 0) {
      return await this.model.findOne({ _id: id }).populate(populateFields);
    }
    return doc;
  }

  // Soft delete
  async destroy(id) {
    return await this.model.findByIdAndUpdate(id, {  deletedAt: new Date(), deleted: true  }, { new: true });
  }

  // Ensure slug is returned on update
  async update(id, data) {
    const result = await this.model.findByIdAndUpdate(id, data, { new: true }).select('+slug');
    return result;
  }
}
