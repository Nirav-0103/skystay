const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// memoryStorage — no local file, upload buffer directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP images are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large! Maximum limit is 5MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Upload buffer to Cloudinary via upload_stream (works with v1 + v2)
const uploadToCloudinary = (buffer, folder = 'skystay/hotels') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      console.error('❌ Cloudinary configuration missing!');
      return reject(new Error('Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET to your .env file.'));
    }
    
    console.log(`📡 Sending to Cloudinary (folder: ${folder})...`);
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary SDK Error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary Upload Result:', result.secure_url);
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

// POST /api/upload/hotel-image (ADMIN ONLY)
router.post('/hotel-image', protect, adminOnly, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const result = await uploadToCloudinary(req.file.buffer, 'skystay/hotels');
    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload/post-image (ANY LOGGED IN USER)
router.post('/post-image', protect, (req, res, next) => {
  console.log('📸 Upload request received from user:', req.user._id);
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer Error:', err.message);
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      console.warn('⚠️ No file in request');
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    console.log('☁️ Uploading to Cloudinary...', req.file.originalname);
    const result = await uploadToCloudinary(req.file.buffer, 'skystay/posts');
    console.log('✅ Cloudinary Upload Success:', result.secure_url);

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('❌ Upload Controller Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload/avatar (ANY LOGGED IN USER)
router.post('/avatar', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const result = await uploadToCloudinary(req.file.buffer, 'skystay/avatars');
    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/upload/hotel-image/:publicId
router.delete('/hotel-image/:publicId', protect, adminOnly, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;