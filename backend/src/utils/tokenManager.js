/**
 * Token Manager
 * Utility for JWT token generation, verification, and cookie management
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object to generate token for
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      role: user.role
    },
    config.security.jwtSecret,
    { expiresIn: config.security.jwtExpiresIn }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.security.jwtSecret);
};

/**
 * Set token cookie
 * @param {Object} res - Response object
 * @param {String} token - JWT token
 * @returns {Object} Cookie options
 */
const setCookie = (res, token) => {
  // Default to 24 hours if not specified
  const expiresIn = config.security.jwtCookieExpire 
    ? parseInt(config.security.jwtCookieExpire, 10) 
    : 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  const cookieOptions = {
    expires: new Date(Date.now() + expiresIn),
    httpOnly: true,
    secure: config.env === 'production'
  };

  res.cookie('token', token, cookieOptions);
  return cookieOptions;
};

/**
 * Clear token cookie
 * @param {Object} res - Response object
 */
const clearCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true
  });
};

/**
 * Get token from request
 * @param {Object} req - Request object
 * @returns {String|null} JWT token or null
 */
const getTokenFromRequest = (req) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token || null;
};

module.exports = {
  generateToken,
  verifyToken,
  setCookie,
  clearCookie,
  getTokenFromRequest
}; 