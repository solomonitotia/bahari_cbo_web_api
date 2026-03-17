const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize, requireVerified, attachGroupFilter } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getDevices, getDevice, createDevice, updateDevice, regenerateApiKey, deleteDevice,
} = require('../controllers/deviceController');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: IoT device management
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [fish_cage, seaweed_farm] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, maintenance] }
 *     responses:
 *       200:
 *         description: List of devices
 *   post:
 *     summary: Register a new device (Admin only)
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, location]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [fish_cage, seaweed_farm] }
 *               location: { type: string }
 *               firmware: { type: string }
 *     responses:
 *       201:
 *         description: Device registered with API key (shown once)
 */
router
  .route('/')
  .get(protect, requireVerified, attachGroupFilter, getDevices)
  .post(
    protect, requireVerified, authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Device name is required'),
      body('type').isIn(['fish_cage', 'seaweed_farm']).withMessage('Invalid type'),
      body('location').notEmpty().withMessage('Location ID is required'),
    ],
    validate,
    createDevice
  );

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device data
 *   put:
 *     summary: Update device (Admin only)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated device
 *   delete:
 *     summary: Delete device (Admin only)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device deleted
 */
router
  .route('/:id')
  .get(protect, requireVerified, getDevice)
  .put(protect, requireVerified, authorize('admin'), updateDevice)
  .delete(protect, requireVerified, authorize('admin'), deleteDevice);

/**
 * @swagger
 * /api/devices/{id}/regenerate-key:
 *   post:
 *     summary: Regenerate device API key (Admin only)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: New API key returned (shown once)
 */
router.post('/:id/regenerate-key', protect, requireVerified, authorize('admin'), regenerateApiKey);

module.exports = router;
