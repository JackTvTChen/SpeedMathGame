const User = require('../models/User');
const logger = require('../utils/logger');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          score: user.score,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error fetching profile',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

const updateScore = async (req, res) => {
  try {
    const { delta } = req.body;
    const userId = req.user.id;

    // Validate delta
    if (typeof delta !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Delta must be a number'
        }
      });
    }

    // Find user and update score atomically
    const user = await User.findOneAndUpdate(
      { _id: userId, score: { $gte: -delta } }, // Only update if new score won't be negative
      { $inc: { score: delta } },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Insufficient score or user not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          score: user.score,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Score update error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error updating score',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

module.exports = {
  getProfile,
  updateScore
}; 