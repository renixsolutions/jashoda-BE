const knex = require('./knex');
const logger = require('../utils/logger');

const checkConnection = async () => {
  try {
    await knex.raw('SELECT 1');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

module.exports = {
  checkConnection,
  knex
};

