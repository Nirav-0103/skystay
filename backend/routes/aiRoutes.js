const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatbot, tripPlanner, naturalLanguageSearch } = require('../controllers/aiController');

// Optional auth — if token present, attach user (for booking awareness)
const optionalAuth = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (e) { /* ignore */ }
  next();
};

router.post('/chat', optionalAuth, chatbot);
router.post('/trip-planner', tripPlanner);
router.post('/nl-search', naturalLanguageSearch);

// Test route to verify key (REMOVE IN PRODUCTION)
router.get('/test-key', (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.json({ success: false, message: 'No key found in process.env' });
  res.json({ 
    success: true, 
    message: 'Key found', 
    prefix: key.substring(0, 10) + '...',
    length: key.length 
  });
});

module.exports = router;
