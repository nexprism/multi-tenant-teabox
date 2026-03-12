import Plan from '../models/SubscriptionPlan.js';
import mongoose from 'mongoose';
import CrudRepository from './CrudRepository.js';

class PlanRepository extends CrudRepository {
    constructor() {
        super(Plan);
    }

    //findByName
    async findByName(name) {
        try {
            return await Plan.findOne({ name, deletedAt: null });
        } catch (error) {
            //consolle.error('PlanRepo findByName error:', error);
            throw error;
        }
    }

    async createPlan(data) {
        try {
            const plan = new Plan(data);
            return plan.save();
        } catch (error) {
            //consolle.error('PlanRepo create error:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            return await Plan.findOne({ _id: id, deletedAt: null });
        } catch (error) {
            //consolle.error('PlanRepo findById error:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const plan = await Plan.findOne({ _id: id, deletedAt: null });
            if (!plan) {
                throw new Error('Plan not found');
            }
            

            plan.set(data);
            return await plan.save();
        } catch (error) {
            //consolle.error('PlanRepo update error:', error);
            throw error;
        }
    }

    async softDelete(id) {
        try {
            return await Plan.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            //consolle.error('PlanRepo softDelete error:', error);
            throw error;
        }
    }

    async findByName(name) {
        try {
            return await Plan.findOne({ name, deletedAt: null });
        } catch (error) {
            //consolle.error('PlanRepo findByName error:', error);
            throw error;
        }
    }
}

export default PlanRepository;
  
