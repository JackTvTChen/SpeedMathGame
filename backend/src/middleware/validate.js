const ErrorResponse = require('../utils/errorResponse');

/**
 * Validation middleware
 * 
 * Validates request data against provided schema
 * @param {Object} schema - Validation rules for request fields
 * @returns {Function} Express middleware function for validation
 */
const validate = (schema) => (req, res, next) => {
  const validationErrors = {};
  
  // Check each field against validation rules
  Object.keys(schema).forEach(field => {
    const value = req.body[field];
    const rules = schema[field];
    
    // Required check
    if (rules.required && !value) {
      validationErrors[field] = `${field} is required`;
      return;
    }
    
    // Skip other validations if field is not provided and not required
    if (!value && !rules.required) {
      return;
    }
    
    // Minimum length check
    if (rules.minLength && value.length < rules.minLength) {
      validationErrors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    
    // Maximum length check
    if (rules.maxLength && value.length > rules.maxLength) {
      validationErrors[field] = `${field} cannot be more than ${rules.maxLength} characters`;
    }
    
    // Regex pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      validationErrors[field] = rules.message || `${field} format is invalid`;
    }
    
    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const isValid = rules.validate(value);
      if (!isValid) {
        validationErrors[field] = rules.message || `${field} is invalid`;
      }
    }
  });
  
  // If there are validation errors, return 422 response
  if (Object.keys(validationErrors).length > 0) {
    const messages = Object.values(validationErrors).join(', ');
    return next(new ErrorResponse(messages, 422));
  }
  
  next();
};

module.exports = validate; 