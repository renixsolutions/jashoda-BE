const GenderService = require('./gender.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class GenderController {
  static async list(req, res) {
    try {
      const { status } = req.query;
      const genders = await GenderService.getAll({ status: status || 'active' });
      return sendSuccess(res, 200, 'Genders fetched successfully', genders);
    } catch (error) {
      logger.error('List genders error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async create(req, res) {
    try {
      const gender = await GenderService.create(req.body);
      return sendSuccess(res, 201, 'Gender created successfully', gender);
    } catch (error) {
      logger.error('Create gender error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  static async remove(req, res) {
    try {
      await GenderService.delete(req.params.id);
      return sendSuccess(res, 200, 'Gender deleted successfully');
    } catch (error) {
      logger.error('Delete gender error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }
}

module.exports = GenderController;

