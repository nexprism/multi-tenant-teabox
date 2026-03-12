import PlanService from '../services/planService.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const planService = new PlanService();

// Create a new plan
export async function createPlan(form) {
    try {
        const {
            name,
            description,
            price,
            currency,
            features,
            availability,
            duration,
            isActive,
            discount,
            discountType,
            trialPeriod,
            trialPeriodType,
            isFeatured,
            metadata,
            createdBy
        } = form;

        // Optionally add validation here

        const existing = await planService.findByName(name);
        if (existing && existing.status !== 404) {
            return errorResponse('Plan with this name already exists', 400);
        }

        const newPlan = await planService.createPlan({
            name,
            description,
            price,
            currency,
            features,
            availability,
            duration,
            isActive: typeof isActive === 'boolean' ? isActive : true,
            discount,
            discountType,
            trialPeriod,
            trialPeriodType,
            isFeatured,
            metadata: metadata || {},
            createdBy: createdBy || null
        });

        return successResponse(newPlan, "Plan created", 201);
    } catch (err) {
        //consolle.error('Create Plan error:', err.message);
        return errorResponse('Server error', 500);
    }
}

// Get all plans
export async function getPlans(query) {
    try {
        const plans = await planService.getPlans(query);
        return successResponse(plans, "Plans fetched successfully");
    } catch (err) {
        //consolle.error('Get Plans error:', err.message);
        return errorResponse('Server error', 500);
    }
}

// Get a plan by ID
export async function getPlanById(id) {
    try {
        const plan = await planService.getPlanById(id);
        if (!plan) {
            return errorResponse('Plan not found', 404);
        }
        return successResponse(plan, "Plan fetched");
    } catch (err) {
        //consolle.error('Get Plan error:', err.message);
        return errorResponse('Server error', 500);
    }
}

// Update a plan by ID
export async function updatePlan(id, data) {
    try {
        const updated = await planService.updatePlan(id, data);
        if (!updated) {
            return errorResponse('Plan not found', 404);
        }
        return successResponse(updated, "Plan updated");
    } catch (err) {
        //consolle.error('Update Plan error:', err.message);
        return errorResponse('Server error', 500);
    }
}

// Delete a plan by ID
export async function deletePlan(id) {
    try {
        const deleted = await planService.deletePlan(id);
        if (!deleted) {
            return errorResponse('Plan not found', 404);
        }
        return successResponse(deleted, "Plan deleted");
    } catch (err) {
        //consolle.error('Delete Plan error:', err.message);
        return errorResponse('Server error', 500);
    }
}

