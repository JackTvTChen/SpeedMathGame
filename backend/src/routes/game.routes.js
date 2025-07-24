const express = require('express');
const router = express.Router();
const { getQuestions, updateScore } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

/**
 * Public routes (no authentication required)
 */

// GET /api/game/questions - Generate public questions 
// This endpoint is intentionally public to allow guest play
router.get('/questions', getQuestions);

/**
 * Protected routes (authentication required)
 */

// POST /api/game/score - Update user score (protected)
// This endpoint requires authentication to save scores
router.post('/score', protect, updateScore);

module.exports = router; 