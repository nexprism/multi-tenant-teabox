import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    scope: { type: String, enum: ['global', 'tenant'], required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    modulePermissions: [{
        module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
        permissions: [{ type: String }]
    }],
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date ,default: null },
});

export default roleSchema;
