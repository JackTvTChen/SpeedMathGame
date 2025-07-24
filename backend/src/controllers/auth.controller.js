const { User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const tokenManager = require('../utils/tokenManager');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if username or email already exists
  const userExists = await User.findOne({ 
    $or: [{ username }, { email }] 
  });

  if (userExists) {
    // Check which field caused the conflict
    if (userExists.username === username) {
      return next(
        new ErrorResponse('Username is already taken', 409)
      );
    } else {
      return next(
        new ErrorResponse('Email is already registered', 409)
      );
    }
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password, // Will be hashed by the pre-save hook
    score: 1000, // Default starting score
  });

  // Generate JWT token
  const token = tokenManager.generateToken(user);

  // Set token cookie
  tokenManager.setCookie(res, token);

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    data: user
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return next(new ErrorResponse('Please provide username and password', 422));
  }

  // Check if user exists
  const user = await User.findOne({ username }).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login time
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Generate JWT token
  const token = tokenManager.generateToken(user);

  // Set token cookie
  tokenManager.setCookie(res, token);

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    data: user
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  // User is already available in req.user from the auth middleware
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Clear the token cookie
  tokenManager.clearCookie(res);

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  // Get existing token
  const oldToken = tokenManager.getTokenFromRequest(req);
  
  if (!oldToken) {
    return next(new ErrorResponse('Authentication required', 401));
  }
  
  try {
    // Verify current token
    const decoded = tokenManager.verifyToken(oldToken);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 401));
    }
    
    // Generate fresh token
    const token = tokenManager.generateToken(user);
    
    // Set token cookie
    tokenManager.setCookie(res, token);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    // If token verification fails, clear the cookie and return error
    tokenManager.clearCookie(res);
    return next(new ErrorResponse('Invalid or expired token', 401));
  }
}); 