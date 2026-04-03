const Hotel = require('../models/Hotel');
const { getWeatherData } = require('../services/weatherService');
const { generateHotelImage } = require('../services/aiImageService');

exports.getAllHotels = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, rating, amenities, sort, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (city) query.city = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ];
    }
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };
    if (amenities) {
      const amenityList = amenities.split(',');
      query.amenities = { $all: amenityList };
    }

    let sortObj = {};
    if (sort === 'price_asc') sortObj = { pricePerNight: 1 };
    else if (sort === 'price_desc') sortObj = { pricePerNight: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else sortObj = { createdAt: -1 };

    const skip = (page - 1) * limit;
    const total = await Hotel.countDocuments(query);
    const hotels = await Hotel.find(query).sort(sortObj).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      count: hotels.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      hotels
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('reviews.user', 'name avatar');
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    // Get live weather for hotel city
    const weather = await getWeatherData(hotel.city);
    
    res.json({ success: true, hotel, weather });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchHotels = async (req, res) => {
  try {
    const { q } = req.query;
    const hotels = await Hotel.find({
      isActive: true,
      $or: [
        { name: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }).limit(20);
    res.json({ success: true, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHotel = async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    res.json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateAIImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const imageUrl = await generateHotelImage(hotel.name, hotel.city);
    if (imageUrl) {
      hotel.images.push(imageUrl);
      await hotel.save();
      res.json({ success: true, imageUrl });
    } else {
      res.status(500).json({ success: false, message: 'Failed to generate image' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    const review = { user: req.user._id, name: req.user.name, ...req.body };
    hotel.reviews.push(review);
    hotel.reviewCount = hotel.reviews.length;
    hotel.rating = hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length;
    await hotel.save();
    res.status(201).json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeaturedHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true, featured: true }).limit(6);
    res.json({ success: true, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};