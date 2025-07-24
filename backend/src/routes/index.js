const express = require('express');
const swaggerRoutes = require('./swagger.routes');
const healthRoutes = require('./health');
const authRoutes = require('./auth.routes.js');
const userRoutes = require('./users.routes');
const profileRoutes = require('./profile');
const gameRoutes = require('./game.routes');

const router = express.Router();

// Mount documentation routes
router.use('/docs', swaggerRoutes);

// Health check route
router.use('/health', healthRoutes);

// Mount auth routes
router.use('/auth', authRoutes);

// Mount user routes
router.use('/users', userRoutes);

// Mount profile routes
router.use('/profile', profileRoutes);

// Mount game routes
router.use('/game', gameRoutes);

// Add more routes here

module.exports = router; 