const express = require('express');
const router  = express.Router();
const { protect, requireVerified } = require('../middleware/auth');
const { getLatestIoT, getIoTReadings, getIoTStats, getIoTChart } = require('../controllers/iotController');

// All routes require login
router.use(protect, requireVerified);

router.get('/latest',   getLatestIoT);
router.get('/readings', getIoTReadings);
router.get('/stats',    getIoTStats);
router.get('/chart',    getIoTChart);

module.exports = router;
