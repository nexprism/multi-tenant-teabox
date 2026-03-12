import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

export default mongoose.models.Module || mongoose.model('Module', moduleSchema);
