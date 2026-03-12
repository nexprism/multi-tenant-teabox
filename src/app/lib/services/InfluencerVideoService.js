import influencerVideoRepository from '../repository/InfluencerVideoRepository.js';
import mongoose from 'mongoose';
import { ProductModel } from '../models/Product.js';
import { influencerVideoSchema } from '../models/InfluencerVideo.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InfluencerVideoService {
  async createInfluencerVideo(data, conn) {
    //console.log('[InfluencerVideoService.createInfluencerVideo] Creating influencer video:', JSON.stringify(data, null, 2), 'Connection:', conn.name || 'global mongoose');
    await this.validateInfluencerVideoData(data, false, conn);
    return await influencerVideoRepository.createInfluencerVideo(data, conn);
  }

  async getInfluencerVideoById(id, conn) {
    //console.log('[InfluencerVideoService.getInfluencerVideoById] Fetching influencer video:', id, 'Connection:', conn.name || 'global mongoose');
    return await influencerVideoRepository.getInfluencerVideoById(id, conn);
  }

  async getAllInfluencerVideos(conn, { page = 1, limit = 10, search = '' }) {
    //console.log('[InfluencerVideoService.getAllInfluencerVideos] Fetching all influencer videos', 'Connection:', conn.name || 'global mongoose', 'Page:', page, 'Limit:', limit, 'Search:', search);

    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const InfluencerVideo = conn.models.InfluencerVideo || conn.model('InfluencerVideo', influencerVideoSchema);

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

  async updateInfluencerVideo(id, data, conn) {
    //console.log('[InfluencerVideoService.updateInfluencerVideo] Updating influencer video:', id, 'Data:', JSON.stringify(data, null, 2), 'Connection:', conn.name || 'global mongoose');
    await this.validateInfluencerVideoData(data, true, conn);

    const existingVideo = await this.getInfluencerVideoById(id, conn);
    if (data.videoUrl && existingVideo.videoUrl.startsWith('/uploads/')) {
      try {
        await fs.unlink(path.join(__dirname, '../../public', existingVideo.videoUrl));
      } catch (err) {
        //console.warn('Failed to delete old video file:', err.message);
      }
    }

    return await influencerVideoRepository.updateInfluencerVideo(id, data, conn);
  }

  async deleteInfluencerVideo(id, conn) {
    //console.log('[InfluencerVideoService.deleteInfluencerVideo] Deleting influencer video:', id, 'Connection:', conn.name || 'global mongoose');
    const influencerVideo = await this.getInfluencerVideoById(id, conn);

    if (influencerVideo.videoUrl.startsWith('/uploads/')) {
      try {
        await fs.unlink(path.join(__dirname, '../../public', influencerVideo.videoUrl));
      } catch (err) {
        //console.warn('Failed to delete video file:', err.message);
      }
    }

    return await influencerVideoRepository.deleteInfluencerVideo(id, conn);
  }

  async validateInfluencerVideoData(data, isUpdate = false, conn) {
    if (!isUpdate) {
      if (!data.title || data.title.trim() === '') throw new Error('Title is required');
      if (!data.video) throw new Error('Video (URL or file) is required');
      if (!data.videoType || !['youtube', 'upload'].includes(data.videoType)) {
        throw new Error('Video type must be "youtube" or "upload"');
      }
      if (!data.type || !['product', 'other'].includes(data.type)) {
        throw new Error('Valid type is required (product or other)');
      }
      if (data.type === 'product') {
        if (!data.productId || !mongoose.Types.ObjectId.isValid(data.productId)) {
          throw new Error('Valid product ID is required for product type');
        }
        const Product = conn.models.Product || conn.model('Product', ProductModel.schema);
        const product = await Product.findById(data.productId);
        if (!product) throw new Error('Product ID does not exist');
      } else {
        data.productId = null;
      }
      if (data.videoType === 'youtube' && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(data.video)) {
        throw new Error('Video must be a valid YouTube URL for videoType youtube');
      }
      if (data.videoType === 'upload' && !data.video.startsWith('/uploads/')) {
        throw new Error('Video must be a local upload path for videoType upload');
      }
      data.videoUrl = data.video;
      delete data.video;
    } else {
      if (data.title && data.title.trim() === '') throw new Error('Title cannot be empty');
      if (data.videoType && !['youtube', 'upload'].includes(data.videoType)) {
        throw new Error('Video type must be "youtube" or "upload"');
      }
      if (data.type && !['product', 'other'].includes(data.type)) {
        throw new Error('Valid type is required (product or other)');
      }
      if (data.type === 'product' || (data.productId && data.type === 'product')) {
        if (!data.productId || !mongoose.Types.ObjectId.isValid(data.productId)) {
          throw new Error('Valid product ID is required for product type');
        }
        const Product = conn.models.Product || conn.model('Product', ProductModel.schema);
        const product = await Product.findById(data.productId);
        if (!product) throw new Error('Product ID does not exist');
      } else if (data.type === 'other') {
        data.productId = null;
      }
      if (data.video && data.videoType === 'youtube' && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(data.video)) {
        throw new Error('Video must be a valid YouTube URL for videoType youtube');
      }
      if (data.video && data.videoType === 'upload' && !data.video.startsWith('/uploads/')) {
        throw new Error('Video must be a local upload path for videoType upload');
      }
      if (data.video) {
        data.videoUrl = data.video;
        delete data.video;
      }
    }
  }
}

const influencerVideoService = new InfluencerVideoService();
export default influencerVideoService;