const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize, requireVerified } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getLocations, getLocation, createLocation, updateLocation, deleteLocation,
} = require('../controllers/locationController');

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Fish cage and seaweed farm locations
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [fish_cage, seaweed_farm]
 *     responses:
 *       200:
 *         description: List of locations
 *   post:
 *     summary: Create a new location (Admin only)
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [fish_cage, seaweed_farm]
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               description:
 *                 type: string
 *               tempMin:
 *                 type: number
 *               tempMax:
 *                 type: number
 *     responses:
 *       201:
 *         description: Location created
 */
router
  .route('/')
  .get(protect, requireVerified, getLocations)
  .post(
    protect, requireVerified, authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('type').isIn(['fish_cage', 'seaweed_farm']).withMessage('Type must be fish_cage or seaweed_farm'),
    ],
    validate,
    createLocation
  );

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Location data
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update location (Admin only)
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       200:
 *         description: Updated location
 *   delete:
 *     summary: Deactivate location (Admin only)
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Location deactivated
 */
router
  .route('/:id')
  .get(protect, requireVerified, getLocation)
  .put(protect, requireVerified, authorize('admin'), updateLocation)
  .delete(protect, requireVerified, authorize('admin'), deleteLocation);

module.exports = router;
