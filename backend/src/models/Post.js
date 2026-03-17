const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, required: [true, 'Content is required'] },
    coverImage: { type: String, trim: true }, // URL
    category: {
      type: String,
      enum: ['news', 'update', 'guide', 'announcement', 'success_story'],
      default: 'news',
    },
    tags: [{ type: String, trim: true }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'bahari_cbo_posts' }
);

// Auto-generate slug from title
postSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();
  }
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
