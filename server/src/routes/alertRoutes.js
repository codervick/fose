const express = require('express');
const { getAlerts, markAlertSeen, triggerAlerts } = require('../controllers/alertController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getAlerts);
router.patch('/:alertId/seen', protect, markAlertSeen);
router.post('/trigger', protect, triggerAlerts);

module.exports = router;