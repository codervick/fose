const express = require('express');
const { connectGmail, gmailCallback } = require('../controllers/gmailController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/connect', protect, connectGmail);
router.get('/callback', gmailCallback);

module.exports = router;