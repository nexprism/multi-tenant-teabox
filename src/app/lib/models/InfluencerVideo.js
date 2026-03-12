import mongoose from "mongoose";

export const influencerVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return v.startsWith('/uploads/') || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
        },
        message: 'Video must be a valid YouTube URL or a local upload path',
      },
    },
    videoType: {
      type: String,
      enum: ['youtube', 'upload'],
      required: true,
    },
    type: {
      type: String,
      enum: ['product', 'other'],
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to validate productId and videoType
influencerVideoSchema.pre('save', function () {
  if (this.type === 'product' && !this.productId) {
    throw new Error('Product ID is required for product type videos');
  }
  if (this.type !== 'product' && this.productId) {
    this.productId = undefined;
  }
  if (this.videoType === 'youtube' && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(this.videoUrl)) {
    throw new Error('Video URL must be a valid YouTube URL for videoType youtube');
  }
  if (this.videoType === 'upload' && !this.videoUrl.startsWith('/uploads/')) {
    throw new Error('Video URL must be a local upload path for videoType upload');
  }
});

// Clear cached model
delete mongoose.models.InfluencerVideo;

export const InfluencerVideoModel = mongoose.models.InfluencerVideo || mongoose.model('InfluencerVideo', influencerVideoSchema);
export default InfluencerVideoModel;