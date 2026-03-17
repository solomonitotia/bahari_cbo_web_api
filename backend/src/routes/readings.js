const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, deviceAuth, requireVerified, attachGroupFilter } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  postReading, getReadings, getLatestReadings, getStats, getAlerts,
} = require('../controllers/readingController');

/**
 * @swagger
 * tags:
 *   name: Readings
 *   description: Temperature readings from IoT devices
 */

/**
 * @swagger
 * /api/readings:
 *   post:
 *     summary: Post a temperature reading (IoT device only)
 *     tags: [Readings]
 *     security:
 *       - deviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature]
 *             properties:
 *               temperature:
 *                 type: number
 *                 example: 28.5
 *               unit:
 *                 type: string
 *                 enum: [C, F]
 *                 default: C
 *               humidity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reading stored
 *       401:
 *         description: Invalid device API key
 *   get:
 *     summary: Get readings with filters
 *     tags: [Readings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: device
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: alert
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Paginated readings
 */
router
  .route('/')
  .post(
    deviceAuth,
    [body('temperature').isNumeric().withMessage('Temperature must be a number')],
    validate,
    postReading
  )
  .get(protect, requireVerified, attachGroupFilter, getReadings);

/**
 * @swagger
 * /api/readings/latest:
 *   get:
 *     summary: Get latest reading per device
 *     tags: [Readings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Latest readings per device
 */
router.get('/latest', protect, requireVerified, attachGroupFilter, getLatestReadings);

/**
 * @swagger
 * /api/readings/stats:
 *   get:
 *     summary: Get temperature statistics (avg/min/max) over a time period
 *     tags: [Readings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: device
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [minute, hour, day], default: hour }
 *     responses:
 *       200:
 *         description: Aggregated temperature stats
 */
router.get('/stats', protect, requireVerified, attachGroupFilter, getStats);

/**
 * @swagger
 * /api/readings/alerts:
 *   get:
 *     summary: Get temperature alert readings
 *     tags: [Readings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Alert readings
 */
router.get('/alerts', protect, requireVerified, attachGroupFilter, getAlerts);

module.exports = router;
