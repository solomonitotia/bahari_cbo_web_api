const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize, requireVerified } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getUsers, getUser, updateUser, updateProfile, changePassword, deleteUser,
} = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', protect, requireVerified, authorize('admin'), getUsers);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put('/profile', protect, requireVerified, updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change own password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put(
  '/change-password',
  protect, requireVerified,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User data
 *   put:
 *     summary: Update user role/status (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [admin, monitor] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router
  .route('/:id')
  .get(protect, requireVerified, authorize('admin'), getUser)
  .put(protect, requireVerified, authorize('admin'), updateUser)
  .delete(protect, requireVerified, authorize('admin'), deleteUser);

module.exports = router;
