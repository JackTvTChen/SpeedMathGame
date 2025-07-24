const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');
const connectDB = require('./config/database');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Apply middleware
// Security headers
const helmetOptions = config.security.enableHelmetDefaults ? undefined : { 
  // Custom helmet options can be added here
  contentSecurityPolicy: false
};
app.use(helmet(helmetOptions));

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies to be sent with requests
}));

// HTTP request logger
app.use(morgan(config.logging.level));

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json({ limit: config.server.bodyLimit }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// Use routes
app.use(config.api.prefix, routes);

// Apply error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const serverPort = config.server.port;
const server = app.listen(serverPort, () => {
  const serverAddress = `http://localhost:${serverPort}${config.api.prefix}`;
  
  logger.info(
    `⚡️ Server running in ${config.env.toUpperCase()} mode on port ${serverPort}`
  );
  logger.info(`API available at: ${serverAddress}`);
  logger.info(`Health check: ${serverAddress}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; 