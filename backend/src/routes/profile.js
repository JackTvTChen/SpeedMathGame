const express = require('express');
const router = express.Router();
const { getProfile, updateScore } = require('../controllers/mathGameController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get user profile
router.get('/', getProfile);

// Update user score
router.post('/score/update', updateScore);

module.exports = router; 