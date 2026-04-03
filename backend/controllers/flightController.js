const Flight = require('../models/Flight');

exports.searchFlights = async (req, res) => {
  try {
    const { from, to, date, passengers = 1, seatClass = 'Economy', stops, maxPrice, sortBy } = req.query;
    const query = { isActive: true };

    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');

    let flights = await Flight.find(query).sort({ departureTime: 1 });

    // Filter by seat availability
    flights = flights.filter(f => {
      const seatInfo = f.seatClasses.find(s => s.className === seatClass);
      return seatInfo && seatInfo.seatsAvailable >= Number(passengers);
    });

    // Filter stops
    if (stops === '0') flights = flights.filter(f => f.stops === 0);
    if (stops === '1') flights = flights.filter(f => f.stops <= 1);

    // Filter max price
    if (maxPrice) {
      flights = flights.filter(f => {
        const sc = f.seatClasses.find(s => s.className === seatClass);
        return sc && sc.price <= Number(maxPrice);
      });
    }

    // Sort
    if (sortBy === 'duration') flights.sort((a, b) => a.duration.localeCompare(b.duration));
    if (sortBy === 'departure') flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    res.json({ success: true, count: flights.length, flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
    res.json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllFlights = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const total = await Flight.countDocuments({ isActive: true });
    const flights = await Flight.find({ isActive: true }).skip(skip).limit(Number(limit));
    res.json({ success: true, count: flights.length, total, flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
    res.json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    await Flight.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Flight deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Set flight status (delay, cancel, etc.)
exports.setFlightStatus = async (req, res) => {
  try {
    const { status, delayMinutes } = req.body;
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      { status, delayMinutes: delayMinutes || 0 },
      { new: true }
    );
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });

    // TODO: Notify affected passengers via email/push (hook into emailService)
    res.json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Set price alert for a route
exports.setPriceAlert = async (req, res) => {
  try {
    const { targetPrice, email } = req.body;
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });

    flight.priceAlerts.push({ email: email || req.user.email, targetPrice });
    await flight.save();

    res.json({ success: true, message: 'Price alert set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
