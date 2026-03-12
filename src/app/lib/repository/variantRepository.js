import Variant from '../models/Variant.js';
import CrudRepository from './CrudRepository.js';

class VariantRepository extends CrudRepository {
  constructor(conn) {
    const connection = conn || require('mongoose');
    const VariantModel = connection.models.Variant || connection.model('Variant', Variant.schema);
    super(VariantModel);
    this.Variant = VariantModel;
  }

  async searchByTitle(title) {
    return await this.Variant.find({
      title: { $regex: title, $options: 'i' },
      deletedAt: null,
    });
  }

  async delete(id) {
    return await this.Variant.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  }
}

export default VariantRepository;
