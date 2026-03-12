import Module from '../models/Module.js';
import mongoose from 'mongoose';
import CrudRepository from './CrudRepository.js';

class ModuleRepository extends CrudRepository {
    constructor() {
        super(Module);
    }

    async findAllActive() {
    try {
        return await Module.find({ deletedAt: null });
    } catch (error) {
        //consolle.error('ModuleRepo findAllActive error:', error);
        throw error;
    }
}


    async createModule(data) {
        try {
            // eslint-disable-next-line @next/next/no-assign-module-variable
            const module = new Module(data);
            return await module.save();
        } catch (error) {
            //consolle.error('ModuleRepo createModule error:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            return await Module.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('ModuleRepo findById error:', error);
            throw error;
        }
    }

    async getById(id) {
        try {
            return await Module.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('ModuleRepo getById error:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const ModuleModel = mongoose.models.Module;
            // eslint-disable-next-line @next/next/no-assign-module-variable
            const module = await ModuleModel.findById(id);
            if (!module) return null;

            module.set(data);
            return await module.save();
        } catch (error) {
            //consolle.error('ModuleRepo update error:', error);
            throw error;
        }
    }

    async softDelete(id) {
        try {
            return await Module.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            //consolle.error('ModuleRepo softDelete error:', error);
            throw error;
        }
    }

    async findByName(name) {
        try {
            return await Module.findOne({ name, deletedAt: null });
        } catch (error) {
            //consolle.error('ModuleRepo findByName error:', error);
            throw error;
        }
    }

    async getModuleById(id) {
        try {
            return await Module.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('ModuleRepo getModuleById error:', error);
            throw error;
        }
    }

    async updateModule(id, data) {
        try {
            // eslint-disable-next-line @next/next/no-assign-module-variable
            const module = await Module.findById(id);
            if (!module) return null;
            module.set(data);
            return await module.save();
        } catch (error) {
            //consolle.error('ModuleRepo updateModule error:', error);
            throw error;
        }
    }

    async deleteModule(id) {
        try {
            return await Module.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            //consolle.error('ModuleRepo deleteModule error:', error);
            throw error;
        }
    }
}

export default ModuleRepository;
