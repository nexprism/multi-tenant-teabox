import PlanRepository from '../repository/planRepository.js';
import { StatusCodes } from 'http-status-codes';
import { successResponse, errorResponse } from '../../utils/response.js';

class PlanService {
    constructor() {
        this.planRepo = new PlanRepository();
    }

    //findByName
    async findByName(name) {
        try {
            const plan = await this.planRepo.findByName(name);
            if (!plan) {
                return errorResponse('Plan not found', StatusCodes.NOT_FOUND);
            }
            return successResponse(plan, 'Plan fetched', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error fetching plan', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async createPlan(data) {
        try {
            const created = await this.planRepo.createPlan(data);
            return successResponse(created, 'Plan created', StatusCodes.CREATED);
        } catch (error) {
            return errorResponse('Error creating plan', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }
    async getPlans(query) {
        try {
            //consolle.log("Query Parameters:", query);
            const { page = 1, limit = 10, filters = "{}", searchFields = "{}", sort = "{}" } = query;

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);

            // Parse JSON strings from query parameters to objects
            const parsedFilters = JSON.parse(filters);
            const parsedSearchFields = JSON.parse(searchFields);
            const parsedSort = JSON.parse(sort);

            // Build filter conditions for multiple fields
            const filterConditions = { deletedAt: null };

            for (const [key, value] of Object.entries(parsedFilters)) {
                filterConditions[key] = value;
            }

            // Build search conditions for multiple fields with partial matching
            const searchConditions = [];
            for (const [field, term] of Object.entries(parsedSearchFields)) {
                searchConditions.push({ [field]: { $regex: term, $options: "i" } });
            }
            if (searchConditions.length > 0) {
                filterConditions.$or = searchConditions;
            }

            // Build sort conditions
            const sortConditions = {};
            for (const [field, direction] of Object.entries(parsedSort)) {
                sortConditions[field] = direction === "asc" ? 1 : -1;
            }

            // Execute query with dynamic filters, sorting, and pagination
            const plans = await this.planRepo.getAll(filterConditions, sortConditions, pageNum, limitNum);
            return successResponse(plans, 'Plans fetched', StatusCodes.OK);
        } catch (error) {
            //consolle.log("error plan", error.message);
            return errorResponse("Cannot fetch data of all the plans", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async getPlanById(id) {
        try {
            const plan = await this.planRepo.getPlanById(id);
            if (!plan) {
                return errorResponse('Plan not found', StatusCodes.NOT_FOUND);
            }
            return successResponse(plan, 'Plan fetched', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error fetching plan', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async updatePlan(id, data) {
        try {
            const updated = await this.planRepo.update(id, data);
            if (!updated) {
                return errorResponse('Plan not found', StatusCodes.NOT_FOUND);
            }
            return successResponse(updated, 'Plan updated', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error updating plan', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    

    async deletePlan(id) {
        try {
            const deleted = await this.planRepo.deletePlan(id);
            if (!deleted) {
                return errorResponse('Plan not found', StatusCodes.NOT_FOUND);
            }
            return successResponse(deleted, 'Plan deleted', StatusCodes.OK);
        } catch (error) {
            return errorResponse('Error deleting plan', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

export default PlanService;
