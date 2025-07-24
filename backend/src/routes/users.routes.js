const express = require('express');
const { getProfile, updateProfile } = require('../controllers/users.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with balance
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authorized
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'List of users endpoint'
    }
  });
});

/**
 * Admin only route
 */
router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Admin only endpoint'
    }
  });
});

module.exports = router; 