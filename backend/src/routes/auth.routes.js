const express = require('express');
const { register, login, getMe, logout, refreshToken } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 30
  },
  email: {
    required: true,
    pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    message: 'Please provide a valid email'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters'
  }
};

const loginSchema = {
  username: {
    required: true
  },
  password: {
    required: true
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Private
 */
router.get('/logout', protect, logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (with valid token)
 */
router.post('/refresh', refreshToken);

module.exports = router; 