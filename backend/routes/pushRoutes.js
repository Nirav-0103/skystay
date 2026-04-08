const express = require('express');
const { subscribe, unsubscribe, sendTest } = require('../controllers/pushController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/test', protect, sendTest);

module.exports = router;
