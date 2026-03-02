const app = require('./src/index');
const appConfig = require('./src/config/app');
const logger = require('./src/utils/logger');
const { checkConnection } = require('./src/db/connection');

// Start server
const startServer = async () => {
  try {
    // Check database connection
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed. Server will start but database operations may fail.');
    }

    // Start listening
    const server = app.listen(appConfig.port, () => {
      logger.info(`🚀 ${appConfig.appName} is running on port ${appConfig.port}`);
      logger.info(`📍 Environment: ${appConfig.env}`);
      logger.info(`🌐 Server URL: http://localhost:${appConfig.port}`);
      logger.info(`📚 API Base URL: http://localhost:${appConfig.port}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

