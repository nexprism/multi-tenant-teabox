import mongoose from 'mongoose';

const modulePermissionSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  permission: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

export default mongoose.models.ModulePermission || mongoose.model('ModulePermission', modulePermissionSchema);
