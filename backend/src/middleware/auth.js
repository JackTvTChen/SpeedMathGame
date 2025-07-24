const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const { User: UserModel } = require('../models');
const tokenManager = require('../utils/tokenManager');

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token from Authorization header or cookies
 * Sets req.user if token is valid
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route'
        }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.security.jwtSecret);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not found'
          }
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route'
        }
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

/**
 * Authorize by role - Role-based access control middleware
 * @param  {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User information not found, authorization failed'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `User role ${req.user.role} is not authorized to access this route`
        }
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
}; 