import influencerVideoService from '../services/InfluencerVideoService.js';
import { NextResponse } from 'next/server';
import { saveFile } from '../../config/fileUpload.js';
import mongoose from 'mongoose';

class InfluencerVideoController {
  async createInfluencerVideo(req, _res, conn) {
    try {
      const userId = req.user._id;
      const contentType = req.headers.get('content-type') || '';
      let body;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          if (key === 'video' && value instanceof File && body.videoType === 'upload') {
            body[key] = await saveFile(value, 'uploads/Videos');
          } else {
            body[key] = value;
          }
        }
      } else {
        body = await req.json();
      }

      //consolle.log('[InfluencerVideoController.createInfluencerVideo] Creating influencer video for user:', userId, 'Body:', JSON.stringify(body, null, 2));

      const data = {
        title: body.title,
        description: body.description,
        type: body.type,
        productId: body.productId,
        videoType: body.videoType,
        video: body.video,
      };

      if (!data.video) {
        throw new Error('Video (URL or file) is required');
      }

      const influencerVideo = await influencerVideoService.createInfluencerVideo(data, conn);
      return NextResponse.json({ status: 'success', message: 'Influencer video created successfully', influencerVideo }, { status: 201 });
    } catch (err) {
      //consolle.error('[InfluencerVideoController.createInfluencerVideo] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getInfluencerVideoById(req, _res, id, conn) {
    try {
      //consolle.log('[InfluencerVideoController.getInfluencerVideoById] Fetching influencer video:', id, 'Connection:', conn.name || 'global mongoose');
      const influencerVideo = await influencerVideoService.getInfluencerVideoById(id, conn);
      return NextResponse.json({ status: 'success', message: 'Influencer video fetched successfully', influencerVideo }, { status: 200 });
    } catch (err) {
      //consolle.error('[InfluencerVideoController.getInfluencerVideoById] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getAllInfluencerVideos(req, _res, conn) {
    try {
      //consolle.log('[InfluencerVideoController.getAllInfluencerVideos] Fetching all influencer videos', 'Connection:', conn.name || 'global mongoose');
      const { searchParams } = new URL(req.url);
      const page = searchParams.get('page') || 1;
      const limit = searchParams.get('limit') || 10;
      const search = searchParams.get('search') || '';
      
      const result = await influencerVideoService.getAllInfluencerVideos(conn, { page, limit, search });
      return NextResponse.json({ 
        status: 'success', 
        message: 'Influencer videos fetched successfully', 
        influencerVideos: result.influencerVideos,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          itemsPerPage: result.itemsPerPage,
        }
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[InfluencerVideoController.getAllInfluencerVideos] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async updateInfluencerVideo(req, _res, id, conn) {
    try {
      const userId = req.user._id;
      const contentType = req.headers.get('content-type') || '';
      let body;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          if (key === 'video' && value instanceof File && body.videoType === 'upload') {
            body[key] = await saveFile(value, 'uploads/Videos');
          } else {
            body[key] = value;
          }
        }
      } else {
        body = await req.json();
      }

      //consolle.log('[InfluencerVideoController.updateInfluencerVideo] Updating influencer video:', id, 'for user:', userId, 'Body:', JSON.stringify(body, null, 2));

      const data = {
        title: body.title,
        description: body.description,
        type: body.type,
        productId: body.productId,
        videoType: body.videoType,
        video: body.video,
      };

      const influencerVideo = await influencerVideoService.updateInfluencerVideo(id, data, conn);
      return NextResponse.json({ status: 'success', message: 'Influencer video updated successfully', influencerVideo }, { status: 200 });
    } catch (err) {
      //consolle.error('[InfluencerVideoController.updateInfluencerVideo] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async deleteInfluencerVideo(req, _res, id, conn) {
    try {
      const userId = req.user._id;
      //consolle.log('[InfluencerVideoController.deleteInfluencerVideo] Deleting influencer video:', id, 'for user:', userId, 'Connection:', conn.name || 'global mongoose');
      const influencerVideo = await influencerVideoService.deleteInfluencerVideo(id, conn);
      return NextResponse.json({ status: 'success', message: 'Influencer video deleted successfully', influencerVideo }, { status: 200 });
    } catch (err) {
      //consolle.error('[InfluencerVideoController.deleteInfluencerVideo] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }
}

const influencerVideoController = new InfluencerVideoController();
export default influencerVideoController;