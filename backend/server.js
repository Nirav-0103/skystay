const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Redis-backed rate limiter (graceful: falls back to memory if Redis unavailable)
let redisClient;
let RedisStore;
try {
  const IORedis = require('ioredis');
  const rateLimitRedis = require('rate-limit-redis');
  RedisStore = rateLimitRedis.RedisStore;
  if (process.env.REDIS_URL) {
    redisClient = new IORedis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    redisClient.on('error', (err) => console.warn('⚠️  Redis rate-limit store unavailable, falling back to memory:', err.message));
  }
} catch (_) {
  console.warn('⚠️  rate-limit-redis not installed — using in-memory store. Run: npm install ioredis rate-limit-redis inside backend/');
}

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const billRoutes = require('./routes/billRoutes');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { startScheduler } = require('./services/scheduler');

const app = express();
app.set('trust proxy', 1);

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

// ─── CORS — Safari fix: explicit methods + allowedHeaders ────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:42011',
  'https://skystay-nine.vercel.app',
  'https://skystay-frontend-dusky.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200, // Safari needs 200 (not 204) for preflight
}));

// Handle preflight OPTIONS for all routes (Safari fix)
app.options('*', cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store when available (required for multi-pod Kubernetes deployments)
  ...(redisClient && RedisStore ? {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  } : {}),
});
app.use('/api/', limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ROUTES ───────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({ status: 'OK', message: '🚀 SkyStay API is running!', version: '2.0.0' })
);
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'SkyStay API is healthy!', timestamp: new Date() })
);

app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bills', billRoutes);      // bills now on their own prefix — no /:id conflict
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

// ─── ERROR HANDLERS ───────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── AUTO INIT (Admin + Seed) ─────────────────────────────────
const autoInit = async () => {
  const User = require('./models/User');
  const Hotel = require('./models/Hotel');
  const Flight = require('./models/Flight');

  // 1. Default Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@skystay.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isDefaultAdmin: true
    });
    console.log(`✅ Admin created → ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  } else {
    console.log(`✅ Admin exists → ${adminEmail}`);
  }

  // 2. Seed Hotels & Flights only if DB is empty
  const [hotelCount, flightCount] = await Promise.all([
    Hotel.countDocuments(),
    Flight.countDocuments(),
  ]);

  if (hotelCount >= 45 && flightCount >= 35) {
    console.log(`✅ Data exists → ${hotelCount} hotels | ${flightCount} flights — skipping seed`);
    return;
  }

  console.log('🌱 Seeding hotels and flights...');
  await Hotel.deleteMany({});
  await Flight.deleteMany({});

  const hotels = [
    // ── MUMBAI ──
    { name: 'The Taj Mahal Palace', location: 'Apollo Bunder, Colaba', city: 'Mumbai', address: 'Apollo Bunder, Colaba, Mumbai 400001', description: 'Iconic luxury hotel overlooking the Gateway of India. Legendary hospitality since 1903.', images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'], rating: 4.9, reviewCount: 2840, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Bar','Concierge','Butler Service'], roomTypes: [{name:'Deluxe Room',price:22000,capacity:2,available:20},{name:'Grand Luxury',price:35000,capacity:2,available:10},{name:'Suite',price:65000,capacity:4,available:5}], pricePerNight: 22000, category: 'luxury', tags: ['luxury','heritage','iconic'], featured: true },
    { name: 'Four Seasons Hotel Mumbai', location: 'Worli', city: 'Mumbai', address: '114 Dr E Moses Rd, Worli, Mumbai 400018', description: 'Contemporary luxury with panoramic sea views and world-class dining.', images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'], rating: 4.8, reviewCount: 1950, amenities: ['WiFi','Rooftop Pool','Spa','Restaurant','Gym','Bar','Valet'], roomTypes: [{name:'Superior Room',price:18000,capacity:2,available:30},{name:'Deluxe Sea View',price:28000,capacity:2,available:15},{name:'Suite',price:55000,capacity:4,available:6}], pricePerNight: 18000, category: 'luxury', tags: ['luxury','sea view'], featured: true },
    { name: 'Trident Nariman Point', location: 'Nariman Point', city: 'Mumbai', address: 'Nariman Point, Mumbai 400021', description: 'Elegant business hotel with stunning Arabian Sea views.', images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800','https://images.unsplash.com/photo-1540541338537-d31c459b73f0?w=800','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'], rating: 4.6, reviewCount: 1850, amenities: ['WiFi','Pool','Restaurant','Gym','Business Center','Bar'], roomTypes: [{name:'Sea View Room',price:8500,capacity:2,available:30},{name:'Club Room',price:12000,capacity:2,available:15}], pricePerNight: 8500, category: 'standard', tags: ['business','sea view'], featured: false },
    { name: 'Novotel Mumbai Juhu Beach', location: 'Juhu', city: 'Mumbai', address: 'Balraj Sahani Marg, Juhu, Mumbai 400049', description: 'Beachside hotel perfect for families with Bollywood connections nearby.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'], rating: 4.3, reviewCount: 1200, amenities: ['WiFi','Pool','Beach Access','Restaurant','Gym'], roomTypes: [{name:'Standard Room',price:6500,capacity:2,available:40},{name:'Superior Room',price:8500,capacity:2,available:20}], pricePerNight: 6500, category: 'standard', tags: ['beach','family'], featured: false },
    { name: 'Hotel Suba Palace', location: 'Battery Street, Colaba', city: 'Mumbai', address: 'Battery Street, Colaba, Mumbai 400001', description: 'Comfortable budget hotel in prime Colaba location.', images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800','https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 3.8, reviewCount: 890, amenities: ['WiFi','Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:2800,capacity:2,available:25},{name:'Deluxe Room',price:3800,capacity:2,available:15}], pricePerNight: 2800, category: 'budget', tags: ['budget','colaba'], featured: false },
    { name: 'Hotel Diplomat', location: 'Colaba', city: 'Mumbai', address: 'Merewether Rd, Colaba, Mumbai 400001', description: 'Simple and clean budget stay in the heart of Colaba.', images: ['https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 3.5, reviewCount: 640, amenities: ['WiFi','AC','TV','Room Service'], roomTypes: [{name:'Standard Room',price:2200,capacity:2,available:20},{name:'Triple Room',price:3200,capacity:3,available:10}], pricePerNight: 2200, category: 'budget', tags: ['budget','tourist'], featured: false },
    { name: 'JW Marriott Mumbai Sahar', location: 'Andheri East', city: 'Mumbai', address: 'Sahar Airport Rd, Andheri East, Mumbai 400099', description: 'World-class business hotel near Mumbai airport with exceptional conference facilities.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800'], rating: 4.7, reviewCount: 2100, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center','Airport Shuttle'], roomTypes: [{name:'Deluxe Room',price:12000,capacity:2,available:40},{name:'Executive Suite',price:22000,capacity:2,available:20}], pricePerNight: 12000, category: 'business', tags: ['business','airport'], featured: false },
    // ── DELHI ──
    { name: 'Leela Palace New Delhi', location: 'Diplomatic Enclave', city: 'Delhi', address: 'Diplomatic Enclave, Chanakyapuri, New Delhi 110023', description: 'Opulent palace hotel in the diplomatic quarter with magnificent Mughal architecture.', images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'], rating: 4.9, reviewCount: 2150, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Bar','Butler Service'], roomTypes: [{name:'Grand Deluxe',price:25000,capacity:2,available:25},{name:'Royal Club',price:40000,capacity:2,available:12},{name:'Presidential Suite',price:90000,capacity:4,available:3}], pricePerNight: 25000, category: 'luxury', tags: ['luxury','diplomatic','palace'], featured: true },
    { name: 'ITC Maurya', location: 'Sardar Patel Marg', city: 'Delhi', address: 'Sardar Patel Marg, New Delhi 110021', description: 'Legendary 5-star hotel famous for Bukhara restaurant.', images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'], rating: 4.8, reviewCount: 2400, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Bar'], roomTypes: [{name:'Luxury Room',price:18000,capacity:2,available:40},{name:'Club Room',price:26000,capacity:2,available:20}], pricePerNight: 18000, category: 'luxury', tags: ['luxury','food','iconic'], featured: true },
    { name: 'Radisson Blu Marina', location: 'Connaught Place', city: 'Delhi', address: 'G-59, Connaught Place, New Delhi 110001', description: 'Centrally located hotel with modern amenities.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'], rating: 4.3, reviewCount: 1450, amenities: ['WiFi','Pool','Restaurant','Gym','Bar'], roomTypes: [{name:'Standard Room',price:7000,capacity:2,available:35},{name:'Superior Room',price:9500,capacity:2,available:20}], pricePerNight: 7000, category: 'standard', tags: ['central','connaught'], featured: false },
    { name: 'Hotel The Royal Plaza', location: 'Connaught Place', city: 'Delhi', address: '19, Ashoka Road, New Delhi 110001', description: 'Classic hotel in the heart of New Delhi with heritage charm.', images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800','https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 4.1, reviewCount: 980, amenities: ['WiFi','Restaurant','Gym','Bar'], roomTypes: [{name:'Deluxe Room',price:6000,capacity:2,available:30},{name:'Suite',price:10000,capacity:4,available:10}], pricePerNight: 6000, category: 'standard', tags: ['heritage','central'], featured: false },
    { name: 'Hotel Bloomrooms', location: 'Janpath', city: 'Delhi', address: 'Janpath Lane, New Delhi 110001', description: 'Modern budget hotel near Connaught Place.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 3.9, reviewCount: 760, amenities: ['WiFi','AC','TV','24hr Reception'], roomTypes: [{name:'Standard Room',price:2500,capacity:2,available:20},{name:'Twin Room',price:3200,capacity:2,available:15}], pricePerNight: 2500, category: 'budget', tags: ['budget','central'], featured: false },
    { name: 'Hyatt Regency Delhi', location: 'Bhikaji Cama Place', city: 'Delhi', address: 'Bhikaji Cama Place, New Delhi 110066', description: 'Premier business hotel with world-class meeting facilities.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800'], rating: 4.6, reviewCount: 1800, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center','Bar'], roomTypes: [{name:'King Room',price:10000,capacity:2,available:50},{name:'Regency Club',price:16000,capacity:2,available:25}], pricePerNight: 10000, category: 'business', tags: ['business','meetings'], featured: false },
    // ── GOA ──
    { name: 'Taj Exotica Resort Goa', location: 'Benaulim Beach', city: 'Goa', address: 'Benaulim, South Goa 403716', description: 'Sprawling beachfront luxury resort with private beach and infinity pools.', images: ['https://images.unsplash.com/photo-1455587734955-081b22074882?w=800','https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800','https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'], rating: 4.9, reviewCount: 1920, amenities: ['WiFi','Private Beach','Infinity Pool','Spa','Restaurant','Water Sports','Bar'], roomTypes: [{name:'Sea View Villa',price:32000,capacity:2,available:20},{name:'Ocean Suite',price:60000,capacity:2,available:8},{name:'Presidential Villa',price:130000,capacity:4,available:2}], pricePerNight: 32000, category: 'luxury', tags: ['beach','resort','honeymoon'], featured: true },
    { name: 'W Goa', location: 'Vagator Beach', city: 'Goa', address: 'Vagator Beach Rd, North Goa 403509', description: 'Ultra-trendy luxury resort where party meets paradise.', images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'], rating: 4.7, reviewCount: 1650, amenities: ['WiFi','Beach Access','Infinity Pool','Spa','Restaurant','Nightclub','Bar'], roomTypes: [{name:'Wonderful Room',price:22000,capacity:2,available:35},{name:'Marvelous Suite',price:42000,capacity:2,available:10}], pricePerNight: 22000, category: 'luxury', tags: ['trendy','beach','nightlife'], featured: false },
    { name: 'Holiday Inn Goa Candolim', location: 'Candolim Beach', city: 'Goa', address: 'Candolim Beach Rd, North Goa 403515', description: 'Comfortable beach-adjacent hotel perfect for families.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'], rating: 4.2, reviewCount: 1100, amenities: ['WiFi','Pool','Restaurant','Bar','Beach Access'], roomTypes: [{name:'Standard Room',price:5500,capacity:2,available:40},{name:'Pool View Room',price:7500,capacity:2,available:20}], pricePerNight: 5500, category: 'standard', tags: ['beach','family'], featured: false },
    { name: 'Zostel Goa', location: 'Anjuna', city: 'Goa', address: 'Anjuna, North Goa 403509', description: 'Vibrant hostel popular with backpackers and young travellers.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 4.1, reviewCount: 980, amenities: ['WiFi','Common Area','Restaurant','Bar'], roomTypes: [{name:'Dormitory Bed',price:800,capacity:1,available:30},{name:'Private Room',price:2500,capacity:2,available:15}], pricePerNight: 800, category: 'budget', tags: ['backpacker','hostel'], featured: false },
    // ── JAIPUR ──
    { name: 'Rambagh Palace', location: 'Bhawani Singh Road', city: 'Jaipur', address: 'Bhawani Singh Rd, Jaipur 302005', description: 'Once the residence of the Maharaja of Jaipur — now a Taj jewel.', images: ['https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800','https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800','https://images.unsplash.com/photo-1573483977249-cbdc8ab2e0df?w=800'], rating: 4.9, reviewCount: 2600, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Polo Ground','Bar'], roomTypes: [{name:'Palace Room',price:28000,capacity:2,available:20},{name:'Grand Luxury',price:48000,capacity:2,available:10},{name:'Royal Suite',price:130000,capacity:4,available:3}], pricePerNight: 28000, category: 'luxury', tags: ['heritage','palace','royal'], featured: true },
    { name: 'Samode Haveli', location: 'Gangapole', city: 'Jaipur', address: 'Gangapole, Jaipur 302002', description: '475-year old restored haveli with courtyards and Rajasthani decor.', images: ['https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'], rating: 4.5, reviewCount: 890, amenities: ['WiFi','Pool','Restaurant','Bar','Courtyard'], roomTypes: [{name:'Heritage Room',price:8500,capacity:2,available:20},{name:'Suite',price:14000,capacity:2,available:8}], pricePerNight: 8500, category: 'standard', tags: ['heritage','haveli'], featured: false },
    { name: 'Hotel Pearl Palace', location: 'Hathroi Fort', city: 'Jaipur', address: 'Hathroi Fort, Ajmer Rd, Jaipur 302001', description: 'Award-winning budget hotel with rooftop restaurant and Rajasthani decor.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 4.4, reviewCount: 1200, amenities: ['WiFi','Rooftop Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:1800,capacity:2,available:20},{name:'Deluxe Room',price:2800,capacity:2,available:12}], pricePerNight: 1800, category: 'budget', tags: ['budget','rooftop'], featured: false },
    { name: 'ITC Rajputana', location: 'Station Road', city: 'Jaipur', address: 'Palace Road, Jaipur 302006', description: 'Luxury business hotel with Rajput architecture.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800'], rating: 4.6, reviewCount: 1500, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center'], roomTypes: [{name:'Luxury Room',price:9000,capacity:2,available:40},{name:'Club Room',price:14000,capacity:2,available:20}], pricePerNight: 9000, category: 'business', tags: ['business','rajput'], featured: false },
    // ── UDAIPUR ──
    { name: 'Oberoi Udaivilas', location: 'Haridasji Ki Magri', city: 'Udaipur', address: 'Haridasji Ki Magri, Udaipur 313001', description: "Breathtaking palace on Lake Pichola — voted world's best hotel.", images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800','https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800','https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'], rating: 4.9, reviewCount: 2400, amenities: ['WiFi','Lake View Pool','Spa','Restaurant','Gym','Butler Service'], roomTypes: [{name:'Premier Room',price:48000,capacity:2,available:15},{name:'Luxury Suite',price:90000,capacity:2,available:8},{name:'Kohinoor Suite',price:160000,capacity:4,available:2}], pricePerNight: 48000, category: 'luxury', tags: ['lake view','palace','romantic'], featured: true },
    { name: 'Hotel Fateh Prakash Palace', location: 'City Palace Complex', city: 'Udaipur', address: 'City Palace Complex, Udaipur 313001', description: 'Heritage hotel within City Palace with stunning lake views.', images: ['https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800'], rating: 4.4, reviewCount: 780, amenities: ['WiFi','Restaurant','Bar','Lake View'], roomTypes: [{name:'Heritage Room',price:7500,capacity:2,available:15},{name:'Lake View Suite',price:12000,capacity:2,available:6}], pricePerNight: 7500, category: 'standard', tags: ['heritage','lake view'], featured: false },
    { name: 'Hotel Badi Haveli', location: 'Gangaur Ghat', city: 'Udaipur', address: 'Gangaur Ghat Rd, Udaipur 313001', description: 'Budget haveli with rooftop lake views and Rajasthani hospitality.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 4.0, reviewCount: 560, amenities: ['WiFi','Rooftop Restaurant','Lake View','AC'], roomTypes: [{name:'Standard Room',price:2000,capacity:2,available:12},{name:'Lake View Room',price:3200,capacity:2,available:8}], pricePerNight: 2000, category: 'budget', tags: ['budget','lake view'], featured: false },
    // ── BANGALORE ──
    { name: 'Taj West End', location: 'Race Course Road', city: 'Bangalore', address: '25 Race Course Rd, Bengaluru 560001', description: 'Heritage hotel in 20 acres of tropical garden.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'], rating: 4.8, reviewCount: 1750, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Garden','Bar'], roomTypes: [{name:'Garden View',price:14000,capacity:2,available:35},{name:'Heritage Room',price:22000,capacity:2,available:15},{name:'Suite',price:55000,capacity:4,available:3}], pricePerNight: 14000, category: 'luxury', tags: ['heritage','garden'], featured: false },
    { name: 'Ibis Bengaluru Hosur Road', location: 'Hosur Road', city: 'Bangalore', address: '75 Hosur Main Rd, Bengaluru 560068', description: 'Modern and comfortable hotel near Electronic City.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'], rating: 4.1, reviewCount: 1100, amenities: ['WiFi','Restaurant','Gym','Bar'], roomTypes: [{name:'Standard Room',price:4500,capacity:2,available:50},{name:'Superior Room',price:6000,capacity:2,available:25}], pricePerNight: 4500, category: 'standard', tags: ['tech','hosur'], featured: false },
    { name: 'FabHotel Prime Jayanagar', location: 'Jayanagar', city: 'Bangalore', address: '4th Block, Jayanagar, Bengaluru 560011', description: 'Clean and affordable stay in Jayanagar neighbourhood.', images: ['https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 3.8, reviewCount: 650, amenities: ['WiFi','AC','TV','24hr Reception'], roomTypes: [{name:'Standard Room',price:2000,capacity:2,available:20},{name:'Deluxe Room',price:2800,capacity:2,available:12}], pricePerNight: 2000, category: 'budget', tags: ['budget','clean'], featured: false },
    { name: 'Sheraton Grand Bengaluru Whitefield', location: 'Whitefield', city: 'Bangalore', address: 'ITPL Main Rd, Whitefield, Bengaluru 560066', description: 'Premium business hotel in the IT hub of Whitefield.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800'], rating: 4.6, reviewCount: 1900, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center','Bar'], roomTypes: [{name:'Deluxe Room',price:9500,capacity:2,available:60},{name:'Club Room',price:14000,capacity:2,available:30}], pricePerNight: 9500, category: 'business', tags: ['business','whitefield'], featured: false },
    // ── HYDERABAD ──
    { name: 'Taj Falaknuma Palace', location: 'Engine Bowli', city: 'Hyderabad', address: 'Engine Bowli, Falaknuma, Hyderabad 500053', description: '19th-century palace perched on a cliff — once home to the Nizam.', images: ['https://images.unsplash.com/photo-1573483977249-cbdc8ab2e0df?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'], rating: 4.9, reviewCount: 2200, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Carriage Ride','Bar'], roomTypes: [{name:'Grand Room',price:38000,capacity:2,available:15},{name:'Nizam Suite',price:80000,capacity:2,available:6},{name:'Royal Suite',price:160000,capacity:4,available:2}], pricePerNight: 38000, category: 'luxury', tags: ['palace','nizam','heritage'], featured: true },
    { name: 'Novotel Hyderabad Airport', location: 'Shamshabad', city: 'Hyderabad', address: 'Rajiv Gandhi International Airport, Hyderabad 500108', description: 'Modern hotel connected to Hyderabad airport.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'], rating: 4.2, reviewCount: 980, amenities: ['WiFi','Pool','Restaurant','Gym','Airport Access'], roomTypes: [{name:'Standard Room',price:7000,capacity:2,available:40},{name:'Superior Room',price:9500,capacity:2,available:20}], pricePerNight: 7000, category: 'standard', tags: ['airport','transit'], featured: false },
    { name: 'Hotel Sitara Grand', location: 'Begumpet', city: 'Hyderabad', address: 'Begumpet, Hyderabad 500016', description: 'Value-for-money hotel in central Hyderabad.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 3.9, reviewCount: 720, amenities: ['WiFi','Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:2500,capacity:2,available:25},{name:'Deluxe Room',price:3500,capacity:2,available:15}], pricePerNight: 2500, category: 'budget', tags: ['budget','central'], featured: false },
    // ── CHENNAI ──
    { name: 'ITC Grand Chola', location: 'Mount Road', city: 'Chennai', address: '63 Mount Road, Guindy, Chennai 600032', description: 'Majestic hotel inspired by Chola dynasty architecture.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'], rating: 4.8, reviewCount: 1920, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center'], roomTypes: [{name:'Tower View',price:14000,capacity:2,available:30},{name:'Chola Club',price:20000,capacity:2,available:15},{name:'Grand Suite',price:48000,capacity:4,available:6}], pricePerNight: 14000, category: 'luxury', tags: ['heritage','south india'], featured: true },
    { name: 'Radisson Blu Chennai City Centre', location: 'Arumbakkam', city: 'Chennai', address: '5 GST Road, Chennai 600106', description: 'Contemporary hotel with excellent business connectivity.', images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'], rating: 4.3, reviewCount: 1050, amenities: ['WiFi','Pool','Restaurant','Gym','Bar'], roomTypes: [{name:'Standard Room',price:6500,capacity:2,available:40},{name:'Superior Room',price:9000,capacity:2,available:20}], pricePerNight: 6500, category: 'standard', tags: ['business','modern'], featured: false },
    { name: 'Hotel Deccan Plaza', location: 'Royapettah', city: 'Chennai', address: 'Royapettah, Chennai 600014', description: 'Affordable and clean hotel in South Chennai.', images: ['https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 3.7, reviewCount: 580, amenities: ['WiFi','Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:2200,capacity:2,available:20},{name:'Deluxe Room',price:3000,capacity:2,available:12}], pricePerNight: 2200, category: 'budget', tags: ['budget','affordable'], featured: false },
    // ── KOLKATA ──
    { name: 'The Oberoi Grand', location: 'Jawaharlal Nehru Road', city: 'Kolkata', address: '15 JN Rd, Kolkata 700013', description: 'The Grande Dame of Kolkata with Victorian architecture.', images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800','https://images.unsplash.com/photo-1540541338537-d31c459b73f0?w=800','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'], rating: 4.8, reviewCount: 2000, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Bar','Concierge'], roomTypes: [{name:'Superior Room',price:12000,capacity:2,available:40},{name:'Luxury Room',price:18000,capacity:2,available:20},{name:'Suite',price:45000,capacity:4,available:5}], pricePerNight: 12000, category: 'luxury', tags: ['heritage','colonial','iconic'], featured: false },
    { name: 'Swissotel Kolkata', location: 'New Town', city: 'Kolkata', address: 'City Centre II, New Town, Kolkata 700156', description: 'Contemporary Swiss-branded hotel in the New Town business district.', images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'], rating: 4.4, reviewCount: 890, amenities: ['WiFi','Pool','Restaurant','Gym','Business Center'], roomTypes: [{name:'Classic Room',price:7500,capacity:2,available:40},{name:'Superior Room',price:10000,capacity:2,available:20}], pricePerNight: 7500, category: 'standard', tags: ['new town','business'], featured: false },
    { name: 'Lytton Hotel', location: 'Park Street', city: 'Kolkata', address: '14 Sudder St, Park Street, Kolkata 700016', description: 'Budget-friendly heritage property near Park Street.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 3.8, reviewCount: 650, amenities: ['WiFi','Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:2200,capacity:2,available:15},{name:'Superior Room',price:3200,capacity:2,available:10}], pricePerNight: 2200, category: 'budget', tags: ['budget','park street'], featured: false },
    // ── AGRA ──
    { name: 'The Oberoi Amarvilas', location: 'Taj East Gate Road', city: 'Agra', address: 'Taj East Gate Rd, Agra 282001', description: 'Every room has an unobstructed view of the Taj Mahal.', images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'], rating: 4.9, reviewCount: 2800, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Taj View','Butler Service'], roomTypes: [{name:'Premier Room',price:58000,capacity:2,available:10},{name:'Luxury Suite',price:110000,capacity:2,available:5}], pricePerNight: 58000, category: 'luxury', tags: ['taj mahal view','iconic','romantic'], featured: true },
    { name: 'ITC Mughal Agra', location: 'Fatehabad Road', city: 'Agra', address: 'Fatehabad Rd, Agra 282001', description: 'Grand Mughal-themed hotel with lush gardens near Taj Mahal.', images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800','https://images.unsplash.com/photo-1573483977249-cbdc8ab2e0df?w=800'], rating: 4.5, reviewCount: 1450, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Bar','Garden'], roomTypes: [{name:'Mughal Room',price:9500,capacity:2,available:30},{name:'Luxury Suite',price:18000,capacity:2,available:10}], pricePerNight: 9500, category: 'standard', tags: ['mughal','garden'], featured: false },
    { name: 'Hotel Kamal', location: 'Taj Ganj', city: 'Agra', address: 'Taj Ganj, Agra 282001', description: 'Budget hotel with Taj Mahal views from rooftop restaurant.', images: ['https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 3.9, reviewCount: 820, amenities: ['WiFi','Rooftop Restaurant','AC','Taj View'], roomTypes: [{name:'Standard Room',price:1800,capacity:2,available:15},{name:'Taj View Room',price:2800,capacity:2,available:10}], pricePerNight: 1800, category: 'budget', tags: ['budget','taj view'], featured: false },
    // ── VARANASI ──
    { name: 'Taj Ganges', location: 'Nadesar Palace Grounds', city: 'Varanasi', address: 'Nadesar Palace Grounds, Varanasi 221002', description: 'Tranquil luxury resort close to the mystical ghats of the Ganges.', images: ['https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800','https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800'], rating: 4.7, reviewCount: 1300, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Yoga','Ganga Tours'], roomTypes: [{name:'Garden Room',price:16000,capacity:2,available:20},{name:'Luxury Suite',price:30000,capacity:2,available:8}], pricePerNight: 16000, category: 'luxury', tags: ['spiritual','heritage'], featured: false },
    { name: 'Ramada Plaza JHV Varanasi', location: 'Cantonment', city: 'Varanasi', address: 'The Mall, Cantonment, Varanasi 221002', description: 'Modern hotel in the quieter Cantonment area of Varanasi.', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'], rating: 4.1, reviewCount: 780, amenities: ['WiFi','Pool','Restaurant','Gym','Bar'], roomTypes: [{name:'Standard Room',price:5500,capacity:2,available:30},{name:'Superior Room',price:7500,capacity:2,available:15}], pricePerNight: 5500, category: 'standard', tags: ['modern','cantonment'], featured: false },
    { name: 'Hotel Alka', location: 'Meer Ghat', city: 'Varanasi', address: 'Meer Ghat, Varanasi 221001', description: 'Budget ghat-facing hotel with direct Ganga views.', images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'], rating: 3.8, reviewCount: 920, amenities: ['WiFi','Rooftop Restaurant','Ganga View','AC'], roomTypes: [{name:'Standard Room',price:1500,capacity:2,available:15},{name:'Ganga View Room',price:2500,capacity:2,available:8}], pricePerNight: 1500, category: 'budget', tags: ['budget','ganga view'], featured: false },
    // ── PUNE ──
    { name: 'JW Marriott Pune', location: 'Senapati Bapat Road', city: 'Pune', address: 'Senapati Bapat Rd, Pune 411016', description: 'Sophisticated luxury in the Oxford of the East.', images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800','https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800'], rating: 4.7, reviewCount: 1500, amenities: ['WiFi','Pool','Spa','Restaurant','Gym','Business Center','Bar'], roomTypes: [{name:'Deluxe Room',price:11000,capacity:2,available:50},{name:'Executive Suite',price:20000,capacity:2,available:20}], pricePerNight: 11000, category: 'luxury', tags: ['business','luxury'], featured: false },
    { name: 'Novotel Pune', location: 'Nagar Road', city: 'Pune', address: 'Nagar Road, Viman Nagar, Pune 411014', description: 'Contemporary hotel near Pune airport with modern amenities.', images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'], rating: 4.2, reviewCount: 1100, amenities: ['WiFi','Pool','Restaurant','Gym','Bar'], roomTypes: [{name:'Standard Room',price:6000,capacity:2,available:40},{name:'Superior Room',price:8500,capacity:2,available:20}], pricePerNight: 6000, category: 'standard', tags: ['airport','modern'], featured: false },
    { name: 'Hotel Shreyas', location: 'Shivaji Nagar', city: 'Pune', address: 'Shivaji Nagar, Pune 411004', description: 'Value budget hotel centrally located in Pune.', images: ['https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800'], rating: 3.7, reviewCount: 480, amenities: ['WiFi','Restaurant','AC','TV'], roomTypes: [{name:'Standard Room',price:2000,capacity:2,available:20},{name:'Deluxe Room',price:2800,capacity:2,available:12}], pricePerNight: 2000, category: 'budget', tags: ['budget','central'], featured: false },
  ];

  const flights = [
    { flightNumber: 'AI-505', airline: 'Air India', airlineCode: 'AI', from: 'Bangalore', fromCode: 'BLR', to: 'Delhi', toCode: 'DEL', departureTime: '06:00', arrivalTime: '08:50', duration: '2h 50m', date: new Date('2026-09-30'), stops: 0, seatClasses: [{className:'Economy',price:4500,seatsAvailable:120,totalSeats:150},{className:'Business',price:14000,seatsAvailable:20,totalSeats:24},{className:'First Class',price:28000,seatsAvailable:8,totalSeats:8}], basePrice: 4500, aircraft: 'Boeing 787' },
    { flightNumber: 'UK-821', airline: 'Vistara', airlineCode: 'UK', from: 'Mumbai', fromCode: 'BOM', to: 'Delhi', toCode: 'DEL', departureTime: '07:30', arrivalTime: '09:45', duration: '2h 15m', date: new Date('2026-09-30'), stops: 0, seatClasses: [{className:'Economy',price:5200,seatsAvailable:100,totalSeats:130},{className:'Business',price:16500,seatsAvailable:18,totalSeats:20}], basePrice: 5200, aircraft: 'Airbus A320' },
    { flightNumber: 'SG-401', airline: 'SpiceJet', airlineCode: 'SG', from: 'Delhi', fromCode: 'DEL', to: 'Mumbai', toCode: 'BOM', departureTime: '10:00', arrivalTime: '12:15', duration: '2h 15m', date: new Date('2026-09-30'), stops: 0, seatClasses: [{className:'Economy',price:3800,seatsAvailable:140,totalSeats:180}], basePrice: 3800, aircraft: 'Boeing 737' },
    { flightNumber: '6E-601', airline: 'IndiGo', airlineCode: '6E', from: 'Chennai', fromCode: 'MAA', to: 'Mumbai', toCode: 'BOM', departureTime: '14:00', arrivalTime: '16:10', duration: '2h 10m', date: new Date('2026-09-30'), stops: 0, seatClasses: [{className:'Economy',price:4200,seatsAvailable:160,totalSeats:180}], basePrice: 4200, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-210', airline: 'Air India', airlineCode: 'AI', from: 'Delhi', fromCode: 'DEL', to: 'Goa', toCode: 'GOI', departureTime: '08:00', arrivalTime: '10:30', duration: '2h 30m', date: new Date('2026-10-01'), stops: 0, seatClasses: [{className:'Economy',price:5500,seatsAvailable:90,totalSeats:150},{className:'Business',price:18000,seatsAvailable:15,totalSeats:20}], basePrice: 5500, aircraft: 'Airbus A321' },
    { flightNumber: 'UK-302', airline: 'Vistara', airlineCode: 'UK', from: 'Bangalore', fromCode: 'BLR', to: 'Mumbai', toCode: 'BOM', departureTime: '16:00', arrivalTime: '17:55', duration: '1h 55m', date: new Date('2026-10-01'), stops: 0, seatClasses: [{className:'Economy',price:3500,seatsAvailable:120,totalSeats:150},{className:'Business',price:12000,seatsAvailable:12,totalSeats:16}], basePrice: 3500, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-801', airline: 'Air India', airlineCode: 'AI', from: 'Mumbai', fromCode: 'BOM', to: 'Jaipur', toCode: 'JAI', departureTime: '06:30', arrivalTime: '08:15', duration: '1h 45m', date: new Date('2026-10-02'), stops: 0, seatClasses: [{className:'Economy',price:4800,seatsAvailable:100,totalSeats:140},{className:'Business',price:15000,seatsAvailable:12,totalSeats:16}], basePrice: 4800, aircraft: 'Boeing 737' },
    { flightNumber: '6E-702', airline: 'IndiGo', airlineCode: '6E', from: 'Delhi', fromCode: 'DEL', to: 'Hyderabad', toCode: 'HYD', departureTime: '09:15', arrivalTime: '11:30', duration: '2h 15m', date: new Date('2026-10-02'), stops: 0, seatClasses: [{className:'Economy',price:3900,seatsAvailable:150,totalSeats:180}], basePrice: 3900, aircraft: 'Airbus A320' },
    { flightNumber: 'UK-415', airline: 'Vistara', airlineCode: 'UK', from: 'Mumbai', fromCode: 'BOM', to: 'Kolkata', toCode: 'CCU', departureTime: '11:30', arrivalTime: '14:00', duration: '2h 30m', date: new Date('2026-10-02'), stops: 0, seatClasses: [{className:'Economy',price:5800,seatsAvailable:90,totalSeats:130},{className:'Business',price:18000,seatsAvailable:10,totalSeats:14}], basePrice: 5800, aircraft: 'Airbus A321' },
    { flightNumber: 'SG-201', airline: 'SpiceJet', airlineCode: 'SG', from: 'Mumbai', fromCode: 'BOM', to: 'Goa', toCode: 'GOI', departureTime: '13:00', arrivalTime: '14:20', duration: '1h 20m', date: new Date('2026-10-03'), stops: 0, seatClasses: [{className:'Economy',price:2800,seatsAvailable:170,totalSeats:190}], basePrice: 2800, aircraft: 'Boeing 737' },
    { flightNumber: '6E-503', airline: 'IndiGo', airlineCode: '6E', from: 'Bangalore', fromCode: 'BLR', to: 'Hyderabad', toCode: 'HYD', departureTime: '15:45', arrivalTime: '16:55', duration: '1h 10m', date: new Date('2026-10-03'), stops: 0, seatClasses: [{className:'Economy',price:2500,seatsAvailable:180,totalSeats:200}], basePrice: 2500, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-620', airline: 'Air India', airlineCode: 'AI', from: 'Delhi', fromCode: 'DEL', to: 'Varanasi', toCode: 'VNS', departureTime: '06:00', arrivalTime: '07:20', duration: '1h 20m', date: new Date('2026-10-04'), stops: 0, seatClasses: [{className:'Economy',price:4200,seatsAvailable:90,totalSeats:120},{className:'Business',price:12000,seatsAvailable:8,totalSeats:10}], basePrice: 4200, aircraft: 'Boeing 737' },
    { flightNumber: 'UK-509', airline: 'Vistara', airlineCode: 'UK', from: 'Mumbai', fromCode: 'BOM', to: 'Bangalore', toCode: 'BLR', departureTime: '18:00', arrivalTime: '19:30', duration: '1h 30m', date: new Date('2026-10-04'), stops: 0, seatClasses: [{className:'Economy',price:3200,seatsAvailable:110,totalSeats:140},{className:'Business',price:11000,seatsAvailable:14,totalSeats:16}], basePrice: 3200, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-330', airline: 'Air India', airlineCode: 'AI', from: 'Delhi', fromCode: 'DEL', to: 'Udaipur', toCode: 'UDR', departureTime: '07:00', arrivalTime: '08:30', duration: '1h 30m', date: new Date('2026-10-05'), stops: 0, seatClasses: [{className:'Economy',price:5200,seatsAvailable:80,totalSeats:100},{className:'Business',price:16000,seatsAvailable:8,totalSeats:10}], basePrice: 5200, aircraft: 'ATR 72' },
    { flightNumber: 'AI-712', airline: 'Air India', airlineCode: 'AI', from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi', toCode: 'DEL', departureTime: '20:00', arrivalTime: '22:20', duration: '2h 20m', date: new Date('2026-10-05'), stops: 0, seatClasses: [{className:'Economy',price:4600,seatsAvailable:100,totalSeats:150},{className:'Business',price:15000,seatsAvailable:16,totalSeats:20},{className:'First Class',price:30000,seatsAvailable:6,totalSeats:8}], basePrice: 4600, aircraft: 'Boeing 787' },
    { flightNumber: '6E-101', airline: 'IndiGo', airlineCode: '6E', from: 'Mumbai', fromCode: 'BOM', to: 'Chennai', toCode: 'MAA', departureTime: '06:00', arrivalTime: '08:10', duration: '2h 10m', date: new Date('2026-10-06'), stops: 0, seatClasses: [{className:'Economy',price:3800,seatsAvailable:160,totalSeats:180}], basePrice: 3800, aircraft: 'Airbus A320' },
    { flightNumber: 'UK-201', airline: 'Vistara', airlineCode: 'UK', from: 'Delhi', fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', departureTime: '07:00', arrivalTime: '09:30', duration: '2h 30m', date: new Date('2026-10-06'), stops: 0, seatClasses: [{className:'Economy',price:4800,seatsAvailable:120,totalSeats:150},{className:'Business',price:15000,seatsAvailable:16,totalSeats:20}], basePrice: 4800, aircraft: 'Airbus A321' },
    { flightNumber: 'SG-301', airline: 'SpiceJet', airlineCode: 'SG', from: 'Kolkata', fromCode: 'CCU', to: 'Delhi', toCode: 'DEL', departureTime: '08:30', arrivalTime: '11:00', duration: '2h 30m', date: new Date('2026-10-06'), stops: 0, seatClasses: [{className:'Economy',price:4200,seatsAvailable:150,totalSeats:180}], basePrice: 4200, aircraft: 'Boeing 737' },
    { flightNumber: 'AI-401', airline: 'Air India', airlineCode: 'AI', from: 'Chennai', fromCode: 'MAA', to: 'Delhi', toCode: 'DEL', departureTime: '09:00', arrivalTime: '11:30', duration: '2h 30m', date: new Date('2026-10-07'), stops: 0, seatClasses: [{className:'Economy',price:5000,seatsAvailable:100,totalSeats:150},{className:'Business',price:16000,seatsAvailable:16,totalSeats:20}], basePrice: 5000, aircraft: 'Boeing 787' },
    { flightNumber: '6E-201', airline: 'IndiGo', airlineCode: '6E', from: 'Pune', fromCode: 'PNQ', to: 'Delhi', toCode: 'DEL', departureTime: '10:00', arrivalTime: '12:15', duration: '2h 15m', date: new Date('2026-10-07'), stops: 0, seatClasses: [{className:'Economy',price:4500,seatsAvailable:130,totalSeats:160}], basePrice: 4500, aircraft: 'Airbus A320' },
    { flightNumber: 'UK-601', airline: 'Vistara', airlineCode: 'UK', from: 'Hyderabad', fromCode: 'HYD', to: 'Mumbai', toCode: 'BOM', departureTime: '11:00', arrivalTime: '12:30', duration: '1h 30m', date: new Date('2026-10-07'), stops: 0, seatClasses: [{className:'Economy',price:3500,seatsAvailable:120,totalSeats:150},{className:'Business',price:11000,seatsAvailable:12,totalSeats:16}], basePrice: 3500, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-501', airline: 'Air India', airlineCode: 'AI', from: 'Delhi', fromCode: 'DEL', to: 'Kolkata', toCode: 'CCU', departureTime: '12:00', arrivalTime: '14:10', duration: '2h 10m', date: new Date('2026-10-08'), stops: 0, seatClasses: [{className:'Economy',price:4800,seatsAvailable:100,totalSeats:140},{className:'Business',price:14000,seatsAvailable:14,totalSeats:18}], basePrice: 4800, aircraft: 'Boeing 737' },
    { flightNumber: 'SG-501', airline: 'SpiceJet', airlineCode: 'SG', from: 'Mumbai', fromCode: 'BOM', to: 'Hyderabad', toCode: 'HYD', departureTime: '13:30', arrivalTime: '15:00', duration: '1h 30m', date: new Date('2026-10-08'), stops: 0, seatClasses: [{className:'Economy',price:2800,seatsAvailable:160,totalSeats:180}], basePrice: 2800, aircraft: 'Boeing 737' },
    { flightNumber: '6E-301', airline: 'IndiGo', airlineCode: '6E', from: 'Bangalore', fromCode: 'BLR', to: 'Chennai', toCode: 'MAA', departureTime: '14:00', arrivalTime: '15:10', duration: '1h 10m', date: new Date('2026-10-08'), stops: 0, seatClasses: [{className:'Economy',price:2200,seatsAvailable:180,totalSeats:200}], basePrice: 2200, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-701', airline: 'Air India', airlineCode: 'AI', from: 'Goa', fromCode: 'GOI', to: 'Mumbai', toCode: 'BOM', departureTime: '15:00', arrivalTime: '16:20', duration: '1h 20m', date: new Date('2026-10-09'), stops: 0, seatClasses: [{className:'Economy',price:3200,seatsAvailable:90,totalSeats:120},{className:'Business',price:10000,seatsAvailable:10,totalSeats:12}], basePrice: 3200, aircraft: 'ATR 72' },
    { flightNumber: 'UK-701', airline: 'Vistara', airlineCode: 'UK', from: 'Kolkata', fromCode: 'CCU', to: 'Mumbai', toCode: 'BOM', departureTime: '16:00', arrivalTime: '18:30', duration: '2h 30m', date: new Date('2026-10-09'), stops: 0, seatClasses: [{className:'Economy',price:5500,seatsAvailable:100,totalSeats:130},{className:'Business',price:17000,seatsAvailable:14,totalSeats:18}], basePrice: 5500, aircraft: 'Airbus A321' },
    { flightNumber: 'SG-601', airline: 'SpiceJet', airlineCode: 'SG', from: 'Jaipur', fromCode: 'JAI', to: 'Mumbai', toCode: 'BOM', departureTime: '17:00', arrivalTime: '18:45', duration: '1h 45m', date: new Date('2026-10-09'), stops: 0, seatClasses: [{className:'Economy',price:4000,seatsAvailable:130,totalSeats:160}], basePrice: 4000, aircraft: 'Boeing 737' },
    { flightNumber: '6E-401', airline: 'IndiGo', airlineCode: '6E', from: 'Delhi', fromCode: 'DEL', to: 'Pune', toCode: 'PNQ', departureTime: '18:00', arrivalTime: '20:15', duration: '2h 15m', date: new Date('2026-10-10'), stops: 0, seatClasses: [{className:'Economy',price:4200,seatsAvailable:140,totalSeats:170}], basePrice: 4200, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-601', airline: 'Air India', airlineCode: 'AI', from: 'Mumbai', fromCode: 'BOM', to: 'Agra', toCode: 'AGR', departureTime: '06:30', arrivalTime: '08:00', duration: '1h 30m', date: new Date('2026-10-10'), stops: 0, seatClasses: [{className:'Economy',price:5500,seatsAvailable:80,totalSeats:100},{className:'Business',price:17000,seatsAvailable:8,totalSeats:10}], basePrice: 5500, aircraft: 'ATR 72' },
    { flightNumber: 'UK-801', airline: 'Vistara', airlineCode: 'UK', from: 'Hyderabad', fromCode: 'HYD', to: 'Bangalore', toCode: 'BLR', departureTime: '07:30', arrivalTime: '08:40', duration: '1h 10m', date: new Date('2026-10-11'), stops: 0, seatClasses: [{className:'Economy',price:2500,seatsAvailable:120,totalSeats:150},{className:'Business',price:8500,seatsAvailable:12,totalSeats:16}], basePrice: 2500, aircraft: 'Airbus A320' },
    { flightNumber: 'SG-701', airline: 'SpiceJet', airlineCode: 'SG', from: 'Chennai', fromCode: 'MAA', to: 'Kolkata', toCode: 'CCU', departureTime: '09:00', arrivalTime: '11:15', duration: '2h 15m', date: new Date('2026-10-11'), stops: 0, seatClasses: [{className:'Economy',price:4500,seatsAvailable:140,totalSeats:170}], basePrice: 4500, aircraft: 'Boeing 737' },
    { flightNumber: '6E-801', airline: 'IndiGo', airlineCode: '6E', from: 'Mumbai', fromCode: 'BOM', to: 'Varanasi', toCode: 'VNS', departureTime: '10:00', arrivalTime: '12:00', duration: '2h 00m', date: new Date('2026-10-12'), stops: 0, seatClasses: [{className:'Economy',price:4800,seatsAvailable:110,totalSeats:140}], basePrice: 4800, aircraft: 'Airbus A320' },
    { flightNumber: 'AI-901', airline: 'Air India', airlineCode: 'AI', from: 'Bangalore', fromCode: 'BLR', to: 'Kolkata', toCode: 'CCU', departureTime: '11:00', arrivalTime: '13:30', duration: '2h 30m', date: new Date('2026-10-12'), stops: 0, seatClasses: [{className:'Economy',price:5200,seatsAvailable:90,totalSeats:120},{className:'Business',price:16000,seatsAvailable:10,totalSeats:14}], basePrice: 5200, aircraft: 'Boeing 787' },
    { flightNumber: 'UK-901', airline: 'Vistara', airlineCode: 'UK', from: 'Delhi', fromCode: 'DEL', to: 'Chennai', toCode: 'MAA', departureTime: '12:00', arrivalTime: '14:30', duration: '2h 30m', date: new Date('2026-10-13'), stops: 0, seatClasses: [{className:'Economy',price:5000,seatsAvailable:100,totalSeats:130},{className:'Business',price:15500,seatsAvailable:14,totalSeats:18}], basePrice: 5000, aircraft: 'Airbus A321' },
    { flightNumber: 'SG-801', airline: 'SpiceJet', airlineCode: 'SG', from: 'Pune', fromCode: 'PNQ', to: 'Goa', toCode: 'GOI', departureTime: '14:00', arrivalTime: '15:05', duration: '1h 05m', date: new Date('2026-10-13'), stops: 0, seatClasses: [{className:'Economy',price:2200,seatsAvailable:150,totalSeats:180}], basePrice: 2200, aircraft: 'Boeing 737' },
  ];

  await Hotel.insertMany(hotels);
  await Flight.insertMany(flights);
  console.log(`✅ Seeded → ${hotels.length} hotels | ${flights.length} flights`);
};

// ─── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await autoInit();
    startScheduler();
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

module.exports = app;