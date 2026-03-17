const Post = require('../models/Post');

// @desc  Get published posts (public)
// @route GET /api/posts
const getPosts = async (req, res) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // exclude body for listing; load on detail

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single post by slug (public)
// @route GET /api/posts/:slug
const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, isPublished: true }).populate('author', 'name');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.views += 1;
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all posts including drafts (admin)
// @route GET /api/posts/admin/all
const getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create post (admin)
// @route POST /api/posts
const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, isPublished } = req.body;
    const post = await Post.create({
      title, excerpt, content, coverImage, category, tags,
      isPublished: isPublished || false,
      author: req.user._id,
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update post (admin)
// @route PUT /api/posts/:id
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    Object.assign(post, req.body);
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete post (admin)
// @route DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPosts, getPost, getAllPostsAdmin, createPost, updatePost, deletePost };
