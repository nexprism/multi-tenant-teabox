import mongoose from 'mongoose';
import { influencerVideoSchema } from '../models/InfluencerVideo.js';

class InfluencerVideoRepository {
  constructor() {
    this.getInfluencerVideoModel = this.getInfluencerVideoModel.bind(this);
    this.createInfluencerVideo = this.createInfluencerVideo.bind(this);
    this.getInfluencerVideoById = this.getInfluencerVideoById.bind(this);
    this.getAllInfluencerVideos = this.getAllInfluencerVideos.bind(this);
    this.updateInfluencerVideo = this.updateInfluencerVideo.bind(this);
    this.deleteInfluencerVideo = this.deleteInfluencerVideo.bind(this);
  }

  getInfluencerVideoModel(conn) {
    if (!conn) {
      throw new Error('Database connection is required');
    }
    console.log('InfluencerVideoRepository using connection:', conn.name || 'global mongoose');
    delete conn.models.InfluencerVideo;
    return conn.models.InfluencerVideo || conn.model('InfluencerVideo', influencerVideoSchema);
  }

  async createInfluencerVideo(data, conn) {
    const InfluencerVideo = this.getInfluencerVideoModel(conn);
    const influencerVideo = new InfluencerVideo(data);
    return await influencerVideo.save();
  }

  async getInfluencerVideoById(id, conn) {
    const InfluencerVideo = this.getInfluencerVideoModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid influencer video ID');
    const influencerVideo = await InfluencerVideo.findById(id).populate('productId');
    if (!influencerVideo) throw new Error('Influencer video not found');
    return influencerVideo;
  }

  async getAllInfluencerVideos(conn, { page = 1, limit = 10, search = '' }) {
    const InfluencerVideo = this.getInfluencerVideoModel(conn);
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [influencerVideos, totalItems] = await Promise.all([
      InfluencerVideo.find(query)
        .populate('productId')
        .skip(skip)
        .limit(limit)
        .lean(),
      InfluencerVideo.countDocuments(query),
    ]);

    return {
      influencerVideos,
      totalItems,
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async updateInfluencerVideo(id, update, conn) {
    const InfluencerVideo = this.getInfluencerVideoModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid influencer video ID');
    const influencerVideo = await InfluencerVideo.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).populate('productId');
    if (!influencerVideo) throw new Error('Influencer video not found');
    return influencerVideo;
  }

  async deleteInfluencerVideo(id, conn) {
    const InfluencerVideo = this.getInfluencerVideoModel(conn);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid influencer video ID');
    const influencerVideo = await InfluencerVideo.findByIdAndDelete(id);
    if (!influencerVideo) throw new Error('Influencer video not found');
    return influencerVideo;
  }
}

export default new InfluencerVideoRepository();