import ModuleRepository from '../repository/moduleRepository.js';
import ModulePermissionRepository from '../repository/modulePermissionRepository.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { StatusCodes } from 'http-status-codes';
import seedTenantDBs from '../../../../tenantSeeder.js';

class ModuleService {
    constructor() {
        this.moduleRepo = new ModuleRepository();
        this.permissionRepo = new ModulePermissionRepository();
    }

    async createModuleWithPermissions(data) {
        const { name, permissions, createdBy } = data;
        try {
            const existing = await this.moduleRepo.findByName(name);
            if (existing) return errorResponse('Module already exists', StatusCodes.BAD_REQUEST);

            const module = await this.moduleRepo.createModule({ name, createdBy });

            if (permissions && permissions.length > 0) {
                const permissionDocs = permissions.map(p => ({
                    module: module._id,
                    permission: p,
                    createdBy
                }));
                await this.permissionRepo.createPermissions(permissionDocs);
            }

            // Automate seeding across all tenants to ensure the new module is available
            console.log('Automating seeder for new module:', module.name);
            seedTenantDBs().catch(err => console.error('Error in automated seeding:', err));

            return successResponse({ module }, 'Module created with permissions', StatusCodes.CREATED);
        } catch (error) {
            return errorResponse('Error creating module', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async updateModuleWithPermissions(id, data) {
        const { name, permissions, updatedBy } = data;
        try {
            if (!name) {
                return errorResponse('Module validation failed: name: Path `name` is required.', StatusCodes.BAD_REQUEST);
            }
            const module = await this.moduleRepo.update(id, { name });

            if (!module) return errorResponse('Module not found', StatusCodes.NOT_FOUND);

            await this.permissionRepo.softDeleteByModule(id);

            if (permissions && permissions.length > 0) {
                const permissionDocs = permissions.map(p => ({
                    module: id,
                    permission: p,
                    createdBy: updatedBy
                }));
                await this.permissionRepo.createPermissions(permissionDocs);
            }

            // Automate seeding across all tenants to ensure changes are synced
            console.log('Automating seeder for updated module:', module.name);
            seedTenantDBs().catch(err => console.error('Error in automated seeding:', err));

            return successResponse({ module }, 'Module updated with permissions', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error updating module', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async getModuleWithPermissions(id) {
        try {
            const module = await this.moduleRepo.getById(id);
            if (!module) return errorResponse('Module not found', StatusCodes.NOT_FOUND);

            const permissions = await this.permissionRepo.getPermissionsByModule(id);

            return successResponse({ module, permissions }, 'Module fetched', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error fetching module', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async deleteModule(id) {
        try {
            const deleted = await this.moduleRepo.softDelete(id);
            if (!deleted) return errorResponse('Module not found', StatusCodes.NOT_FOUND);

            await this.permissionRepo.softDeleteByModule(id);

            return successResponse(deleted, 'Module deleted', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error deleting module', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }


    async getAllModules() {
    try {
        const modules = await this.moduleRepo.findAllActive();
        return successResponse(modules, 'All modules fetched');
    } catch (error) {
        return errorResponse('Error fetching modules', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

}

export default ModuleService;
