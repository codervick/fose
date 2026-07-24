const express = require('express');
const { sendNodeEmail, getNodeEmail } = require('../controllers/emailController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.post('/:nodeId/send', protect, sendNodeEmail);
router.get('/:nodeId/email', protect, getNodeEmail);

module.exports = router;    