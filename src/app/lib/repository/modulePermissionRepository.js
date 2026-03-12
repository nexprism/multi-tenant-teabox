import ModulePermission from '../models/modulePermission.js';
import CrudRepository from './CrudRepository.js';

class ModulePermissionRepository extends CrudRepository {
    constructor() {
        super(ModulePermission);
    }

    async createPermissions(permissionArray) {
        try {
            return await ModulePermission.insertMany(permissionArray);
        } catch (error) {
            throw error;
        }
    }

    async getPermissionsByModule(moduleId) {
        try {
            return await ModulePermission.find({ module: moduleId, deletedAt: null });
        } catch (error) {
            throw error;
        }
    }

    async softDeleteByModule(moduleId) {
        try {
            return await ModulePermission.updateMany(
                { module: moduleId },
                { deletedAt: new Date() }
            );
        } catch (error) {
            throw error;
        }
    }
}

export default ModulePermissionRepository;