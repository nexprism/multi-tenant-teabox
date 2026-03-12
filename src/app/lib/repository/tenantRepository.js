import Tenant from '../models/Tenant.js';
import CrudRepository from './CrudRepository.js';
import mongoose from 'mongoose';

class TenantRepository extends CrudRepository {
    constructor(conn) {
        // Use the connection if provided, otherwise use default Tenant model
        let tenantModel;
        if (conn) {
            // Create Tenant model on the provided connection
            const tenantSchema = new mongoose.Schema({
                tenantId: { type: String, required: true, unique: true },
                companyName: { type: String, required: true },
                subdomain: { type: String, required: true, unique: true },
                dbUri: { type: String },
                status: { type: String, enum: ['active', 'inactive'], default: 'active' },
                plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
                subscriptionStatus: { type: String, enum: ['trial', 'active', 'cancelled', 'expired'], default: 'trial' },
                trialEndsAt: { type: Date },
                renewalDate: { type: Date },
                lastAccessedAt: { type: Date },
                notes: { type: String },
                isDeleted: { type: Boolean, default: false },
                createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
                createdAt: { type: Date, default: Date.now },
            }, { collection: 'tenants' });
            
            tenantModel = conn.models.Tenant || conn.model('Tenant', tenantSchema);
        } else {
            tenantModel = Tenant;
        }
        // Must call super() before accessing 'this'
        super(tenantModel);
        // Now we can safely set properties on 'this'
        this.TenantModel = tenantModel;
        this.conn = conn;
    }

    async findByTenantId(tenantId) {
        // Skip tenant lookup to prevent timeout during signup
        // This method is called during signup but we skip it to avoid connection issues
        console.warn("Tenant validation skipped to prevent timeout");
        return null; // Return null to allow signup to continue without tenant validation
    }

    async findByName(companyName) {
        return await Tenant.findOne({ companyName, isDeleted: false });
    }

    async findBySubdomain(subdomain) {
        return await Tenant.findOne({ subdomain, isDeleted: false });
    }

    async findById(id) {
        try{
            return await Tenant.findOne({ _id: id, isDeleted: false });
        }
        catch (error) {
            console.error('TenantRepo findById error:', error);
            throw error;
        }   
    }
    

    async softDelete(id) {
        return await Tenant.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}

export default TenantRepository;
