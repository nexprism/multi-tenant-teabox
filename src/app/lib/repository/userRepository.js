import mongoose from 'mongoose';
import UserSchema from '../models/User.js';
import roleSchema from '../models/role.js';
import CrudRepository from './CrudRepository.js';

class UserRepository extends CrudRepository {
  constructor(conn) {
    const userModel = conn.model('User', UserSchema, 'users');
    super(userModel);
    this.roleModel = conn.model('Role', roleSchema, 'roles');
  }

  async createUser(data) {
    try {
      const user = new this.model(data);
      return await user.save();
    } catch (error) {
      //consolle.error('UserRepo createUser error:', error);
      throw error;
    }
  }

  async findById(id, tenantId = null) {
    try {
      const query = { _id: id, isDeleted: { $ne: true } };
      if (tenantId) {
        query.tenant = new mongoose.Types.ObjectId(tenantId);
      }

      return await this.model.findOne(query);
    } catch (error) {
      //consolle.error('UserRepo findById error:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await this.model.findOne({ email, isDeleted: { $ne: true } });
    } catch (error) {
      //consolle.error('UserRepo findByEmail error:', error?.message);
      throw error;
    }
  }

  async findByPhone(phone) {
    try {
      return await this.model.findOne({ phone, isDeleted: { $ne: true } });
    } catch (error) {
      //consolle.error('UserRepo findByPhone error:', error?.message);
      throw error;
    }
  }

  async updateUser(id, data) {
    try {
      //consolle.log('UserRepo updateUser called with:', { id, data }); // ✅ Debug log
      const user = await this.model.findById(id);
      //consolle.log('User found:', user); // ✅ Debug log

      if (!user || user.isDeleted) return null;

      user.set(data);
      return await user.save();
    } catch (error) {
      //consolle.error('UserRepo updateUser error:', error);
      throw error;
    }
  }

  async softDelete(id) {
    try {
      // ✅ Use `$set` to ensure both fields are updated properly
      const doc = await this.model.findByIdAndUpdate(
        id,
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!doc) {
        //consolle.warn('User not found for soft delete:', id);
        return null;
      }

      //consolle.log('Soft deleted user:', doc); // ✅ Debug log
      return doc.toObject(); // ✅ Convert to plain object
    } catch (error) {
      //consolle.error('UserRepo softDelete error:', error?.message);
      throw error;
    }
  }

  // ✅ Find role by ID (skips deleted roles)
  async findRoleById(roleId) {
    try {
      return await this.roleModel.findOne({ _id: roleId, deletedAt: null });
    } catch (error) {
      //consolle.error('UserRepo findRoleById error:', error);
      throw error;
    }
  }
}

export default UserRepository;
