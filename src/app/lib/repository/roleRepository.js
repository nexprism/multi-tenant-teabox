

import mongoose from 'mongoose';
import roleSchema from '../models/role.js';
import CrudRepository from './CrudRepository.js';


class RoleRepository extends CrudRepository {
    constructor(conn) {
        // Use the provided connection for tenant DB, or global mongoose if not provided
        const connection = conn || mongoose;
        const RoleModel = connection.models.Role || connection.model('Role', roleSchema);
        super(RoleModel);
        this.Role = RoleModel;
    }


    async createRole(data) {
        try {
            const role = new this.Role(data);
            return await role.save();
        } catch (error) {
            //consolle.error('RoleRepo create error:', error);
            throw error;
        }
    }


    async findById(id) {
        try {
            return await this.Role.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('RoleRepo findById error:', error);
            throw error;
        }
    }


    async update(id, data) {
        try {
            const role = await this.Role.findById(id);
            if (!role) return null;
            role.set(data);
            return await role.save();
        } catch (error) {
            //consolle.error('RoleRepo update error:', error);
            throw error;
        }
    }


    async softDelete(id) {
        try {
            return await this.Role.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            //consolle.error('RoleRepo softDelete error:', error);
            throw error;
        }
    }


    async findByName(name) {
        try {
            return await this.Role.findOne({ name, deletedAt: null });
        } catch (error) {
            //consolle.error('RoleRepo findByName error:', error);
            throw error;
        }
    }


    async getRoleById(id) {
        try {
            return await this.Role.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('RoleRepo getRoleById error:', error);
            throw error;
        }
    }


    async updateRole(id, data) {
        try {
            const role = await this.Role.findById(id);
            if (!role) return null;
            role.set(data);
            return await role.save();
        } catch (error) {
            //consolle.error('RoleRepo updateRole error:', error);
            throw error;
        }
    }


    async deleteRole(id) {
        try {
            return await this.Role.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            //consolle.error('RoleRepo deleteRole error:', error);
            throw error;
        }
    }
}

export default RoleRepository;