const express = require('express');
const router = express.Router();
const { getAllHotels, getHotelById, searchHotels, createHotel, updateHotel, deleteHotel, addReview, getFeaturedHotels, generateAIImage } = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllHotels);
router.get('/featured', getFeaturedHotels);
router.get('/search', searchHotels);
router.get('/:id', getHotelById);
router.post('/', protect, adminOnly, createHotel);
router.put('/:id', protect, adminOnly, updateHotel);
router.delete('/:id', protect, adminOnly, deleteHotel);
router.post('/:id/ai-image', protect, adminOnly, generateAIImage);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
