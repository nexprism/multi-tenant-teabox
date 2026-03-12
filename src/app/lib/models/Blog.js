
import mongoose from 'mongoose';


const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },
      alt: { type: String },
    }
  ],
  thumbnail: {
    url: { type: String },
    alt: { type: String },
  },
  tags: [{ type: String }],
  category: { type: String },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }, 
  updatedAt: { type: Date, default: Date.now },
      deletedAt: { type: Date, default: null },

  slug: { type: String, unique: true },
});

// Auto-generate slug from title if not provided
BlogSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  
});

const getBlogModel = (conn) => {
  return conn.models.Blog || conn.model('Blog', BlogSchema);
};
export default getBlogModel;
