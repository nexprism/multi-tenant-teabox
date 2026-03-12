import { StatusCodes } from 'http-status-codes';
import { successResponse, errorResponse } from '../../utils/response.js';
import TenantRepository from '../repository/tenantRepository.js';
import { v4 as uuidv4 } from 'uuid';
import { createTenantDatabase } from '../db/createTenantDatabase.js';

class TenantService {
  constructor() {
    this.tenantRepo = new TenantRepository();
  }

  async createTenant(data) {
    try {
      // Check required fields
      const { companyName, subdomain } = data;
      if (!companyName || !subdomain) {
        return errorResponse('Missing required fields', StatusCodes.BAD_REQUEST);
      }

      // Check if tenant already exists
      const existing = await this.tenantRepo.findByTenantId(data.tenantId);
      if (existing) return errorResponse('Tenant already exists', StatusCodes.BAD_REQUEST);

        // Check if subdomain is already taken
        const existingSubdomain = await this.tenantRepo.findBySubdomain(subdomain);
        if (existingSubdomain) {
            return errorResponse('Subdomain already taken', StatusCodes.BAD_REQUEST);
        }


      // Create a unique DB name and URI for the tenant
      const dbName = `tenant_${subdomain}`;
      const dbUri = `mongodb+srv://anshul:anshul149@clusterdatabase.24furrx.mongodb.net/${dbName}?retryWrites=true&w=majority`;

      // Create the tenant's database connection (creates DB if not exists)
      //console.log('Creating tenant database:', dbUri);
      await createTenantDatabase(dbName);


      // Prepare tenant data with generated fields
      const tenantData = {
        ...data,
        tenantId: data.tenantId || uuidv4(),
        dbUri
      };

      const created = await this.tenantRepo.create(tenantData);
      return successResponse(created, 'Tenant created successfully', StatusCodes.CREATED);
    } catch (error) {
      return errorResponse('Error creating tenant', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getAllTenants(query) {
    try {
      const { page = 1, limit = 10, filters = '{}', searchFields = '{}', sort = '{}' } = query;
      const parsedFilters = JSON.parse(filters);
      const parsedSearchFields = JSON.parse(searchFields);
      const parsedSort = JSON.parse(sort);

      const filterConditions = { isDeleted: false };
      for (const [key, value] of Object.entries(parsedFilters)) filterConditions[key] = value;

      const searchConditions = [];
      for (const [field, term] of Object.entries(parsedSearchFields)) {
        searchConditions.push({ [field]: { $regex: term, $options: 'i' } });
      }
      if (searchConditions.length > 0) filterConditions.$or = searchConditions;

      const tenants = await this.tenantRepo.getAll(filterConditions, parsedSort, parseInt(page), parseInt(limit));
      return successResponse(tenants, 'Tenants fetched', StatusCodes.OK);
    } catch (error) {
      return errorResponse('Error fetching tenants', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getTenantById(id) {
    try {
      const tenant = await this.tenantRepo.findById(id);
      if (!tenant) return errorResponse('Tenant not found', StatusCodes.NOT_FOUND);
      return successResponse(tenant, 'Tenant fetched', StatusCodes.OK);
    } catch (error) {
      return errorResponse('Error fetching tenant', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async updateTenant(id, data) {
    try {
      const updated = await this.tenantRepo.update(id, data);
      if (!updated) return errorResponse('Tenant not found', StatusCodes.NOT_FOUND);
      return successResponse(updated, 'Tenant updated successfully', StatusCodes.OK);
    } catch (error) {
      return errorResponse('Error updating tenant', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async deleteTenant(id) {
    try {
      const deleted = await this.tenantRepo.softDelete(id);
      if (!deleted) return errorResponse('Tenant not found', StatusCodes.NOT_FOUND);
      return successResponse(deleted, 'Tenant deleted', StatusCodes.OK);
    } catch (error) {
      return errorResponse('Error deleting tenant', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

export default TenantService;
