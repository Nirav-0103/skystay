const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPost, getPosts, toggleLike, addComment, deletePost } = require('../controllers/postController');

router.post('/', protect, createPost);
router.get('/', getPosts);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
