const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const appConfig = require('./config/app');
const { checkConnection } = require('./db/connection');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const logger = require('./utils/logger');
const v1Routes = require('./routes/v1');
const { globalLimiter, publicApiLimiter } = require('./middlewares/rate-limit.middleware');
const path = require('path');
const adminWebRoutes = require('./app/admin');
const fileUpload = require('express-fileupload');

// Create Express app
const app = express();

// View engine setup for admin panel
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static assets (for admin panel CSS/JS, uploads, etc.)
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global rate limiting (safety net — all routes)
app.use(globalLimiter);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "*.amazonaws.com", "https://*"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({
  createParentPath: true
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Admin web panel routes (EJS views)
app.use('/admin', adminWebRoutes);

// API routes (public API limiter applied before routing)
app.use('/api/v1', publicApiLimiter, v1Routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${appConfig.appName}`,
    version: '1.0.0',
    documentation: `${appConfig.appUrl}/api/v1`
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;

