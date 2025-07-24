const ErrorResponse = require('../utils/errorResponse');

/**
 * Error response middleware for 404 not found.
 * This middleware function should be placed at the very bottom of the middleware stack.
 */
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Error handler middleware
 * 
 * Provides consistent error responses with appropriate status codes
 * - 400: Bad Request
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 404: Not Found
 * - 409: Conflict (duplicate resources)
 * - 422: Unprocessable Entity (validation errors)
 * - 500: Server Error
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 422);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let field = 'field';
    if (err.keyPattern) {
      field = Object.keys(err.keyPattern)[0];
    }
    const message = `Duplicate ${field} entered`;
    error = new ErrorResponse(message, 409);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token. Please log in again', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired. Please log in again', 401);
  }

  // Set status code
  const statusCode = error.statusCode || 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack })
    }
  });
};

module.exports = {
  notFound,
  errorHandler,
}; 