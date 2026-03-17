const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getPosts, getPost, getAllPostsAdmin, createPost, updatePost, deletePost,
} = require('../controllers/postController');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Bahari CBO news & updates (public landing page)
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get published posts (public)
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [news, update, guide, announcement, success_story] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Published posts
 *   post:
 *     summary: Create post (Admin only)
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               coverImage: { type: string }
 *               category: { type: string, enum: [news, update, guide, announcement, success_story] }
 *               tags: { type: array, items: { type: string } }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Post created
 */
router
  .route('/')
  .get(getPosts)  // public
  .post(
    protect, authorize('admin'),
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('content').notEmpty().withMessage('Content is required'),
    ],
    validate,
    createPost
  );

/**
 * @swagger
 * /api/posts/admin/all:
 *   get:
 *     summary: Get all posts including drafts (Admin only)
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: All posts
 */
router.get('/admin/all', protect, authorize('admin'), getAllPostsAdmin);

/**
 * @swagger
 * /api/posts/{slug}:
 *   get:
 *     summary: Get single post by slug (public)
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post content
 *       404:
 *         description: Not found
 */
router.get('/:slug', getPost); // public

/**
 * @swagger
 * /api/posts/id/{id}:
 *   put:
 *     summary: Update post (Admin only)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated post
 *   delete:
 *     summary: Delete post (Admin only)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router
  .route('/id/:id')
  .put(protect, authorize('admin'), updatePost)
  .delete(protect, authorize('admin'), deletePost);

module.exports = router;
