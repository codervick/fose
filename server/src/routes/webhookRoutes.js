const express = require('express');
const { handleGmailWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/gmail', handleGmailWebhook);

module.exports = router;