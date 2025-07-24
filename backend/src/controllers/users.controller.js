const { User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Get user profile with balance
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  // req.user is set by auth middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(
      new ErrorResponse('User not found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Don't allow password updates through this route
  if (req.body.passwordHash || req.body.password) {
    return next(
      new ErrorResponse('This route is not for password updates', 400)
    );
  }

  // Don't allow score updates through this route
  if (req.body.score) {
    return next(
      new ErrorResponse('Score cannot be updated through this route', 400)
    );
  }

  // Only allow updating specific fields
  const fieldsToUpdate = {
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(
      new ErrorResponse('User not found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
}); 