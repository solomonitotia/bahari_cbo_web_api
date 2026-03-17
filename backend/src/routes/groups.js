const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize, requireVerified } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addMember, updateMemberRole, removeMember, assignDevices,
} = require('../controllers/groupController');

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Community groups — device access & member management
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get groups (admin=all, others=own groups)
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups
 *   post:
 *     summary: Create a group (Admin only)
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               devices: { type: array, items: { type: string } }
 *               locations: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Group created
 */
router
  .route('/')
  .get(protect, requireVerified, getGroups)
  .post(
    protect, requireVerified, authorize('admin'),
    [body('name').trim().notEmpty().withMessage('Group name is required')],
    validate,
    createGroup
  );

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group details with members and devices
 *   put:
 *     summary: Update group (Admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated group
 *   delete:
 *     summary: Deactivate group (Admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group deactivated
 */
router
  .route('/:id')
  .get(protect, requireVerified, getGroup)
  .put(protect, requireVerified, authorize('admin'), updateGroup)
  .delete(protect, requireVerified, authorize('admin'), deleteGroup);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   post:
 *     summary: Add member to group (Admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *               role: { type: string, enum: [member, custodian] }
 *     responses:
 *       200:
 *         description: Member added
 */
router.post(
  '/:id/members',
  protect, requireVerified, authorize('admin'),
  [body('userId').notEmpty().withMessage('User ID is required')],
  validate,
  addMember
);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   put:
 *     summary: Update member role (Admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [member, custodian] }
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     summary: Remove member from group (Admin only)
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Member removed
 */
router
  .route('/:id/members/:userId')
  .put(protect, requireVerified, authorize('admin'), [body('role').isIn(['member', 'custodian'])], validate, updateMemberRole)
  .delete(protect, requireVerified, authorize('admin'), removeMember);

/**
 * @swagger
 * /api/groups/{id}/devices:
 *   put:
 *     summary: Assign devices to group (Admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceIds]
 *             properties:
 *               deviceIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Devices assigned
 */
router.put('/:id/devices', protect, requireVerified, authorize('admin'), assignDevices);

module.exports = router;
