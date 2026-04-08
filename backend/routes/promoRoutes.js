const express = require('express');
const { validatePromo } = require('../controllers/promoController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/validate', protect, validatePromo);

module.exports = router;
