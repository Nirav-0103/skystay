const express = require('express');
const router = express.Router();
const { searchFlights, getFlightById, getAllFlights, createFlight, updateFlight, deleteFlight, setFlightStatus, setPriceAlert } = require('../controllers/flightController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllFlights);
router.get('/search', searchFlights);
router.get('/:id', getFlightById);
router.post('/', protect, adminOnly, createFlight);
router.put('/:id', protect, adminOnly, updateFlight);
router.delete('/:id', protect, adminOnly, deleteFlight);
router.put('/:id/status', protect, adminOnly, setFlightStatus);
router.post('/:id/price-alert', protect, setPriceAlert);

module.exports = router;
