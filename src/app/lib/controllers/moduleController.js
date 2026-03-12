import ModuleService from '../services/moduleService.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const moduleService = new ModuleService();
export async function createModule(request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return {
                status: 400,
                body: errorResponse('Module name is required', 400),
            };
        }

        const newModule = await moduleService.createModuleWithPermissions(body);
        return {
            status: 201,
            body: successResponse(newModule, "Module created"),
        };
    } catch (err) {
        //consolle.error('Create Module error:', err.message);
        return {
            status: 500,
            body: errorResponse('Error creating module', 500, err.message),
        };
    }
}

// Update a module by ID
export async function updateModule(id, data) {
    try {
        const updated = await moduleService.updateModuleWithPermissions(id, data);
        if (!updated) {
            return {
                status: 404,
                body: errorResponse('Module not found', 404),
            };
        }
        return {
            status: 200,
            body: successResponse("Module updated", updated),
        };
    } catch (err) {
        //consolle.error('Update Module error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}

// Get a module by ID
export async function getModule(id) {
    try {
        const response = await moduleService.getModuleWithPermissions(id);

        // `getModuleWithPermissions` already returns a full successResponse or errorResponse
        return {
            status: 200,
            body: successResponse("Module fetched", module),
        };
    } catch (err) {
        //consolle.error('Get Module error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}


export async function getAllModules() {
    try {
        const result = await moduleService.getAllModules();
        return {
            status: 200,
            body: result,
        };
    } catch (err) {
        //consolle.error('Get All Modules error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}


// Delete a module by ID
export async function deleteModule(id) {
    try {
        const deleted = await moduleService.deleteModule(id);
        if (!deleted) {
            return {
                status: 404,
                body: errorResponse('Module not found', 404),
            };
        }
        return {
            status: 200,
            body: successResponse("Module deleted", deleted),
        };
    } catch (err) {
        //consolle.error('Delete Module error:', err.message);
        return {
            status: 500,
            body: errorResponse('Server error', 500),
        };
    }
}
