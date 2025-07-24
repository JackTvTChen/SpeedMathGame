/**
 * Async handler middleware
 * Wraps async controller functions to avoid try/catch repetition
 * @param {Function} fn - Async controller function to wrap
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 