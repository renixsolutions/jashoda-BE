const OccasionService = require('./occasion.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class OccasionController {
  static async list(req, res) {
    try {
      const { page, limit, status, search, sortBy, sortOrder } = req.query;
      const result = await OccasionService.getAll({
        page,
        limit,
        status: status || 'active',
        search,
        sortBy,
        sortOrder
      });
      return sendSuccess(res, 200, 'Occasions fetched successfully', result.occasions, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List occasions error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getAllActive(req, res) {
    try {
      const occasions = await OccasionService.getAllActive();
      return sendSuccess(res, 200, 'Occasions fetched successfully', occasions);
    } catch (error) {
      logger.error('Get occasions error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getById(req, res) {
    try {
      const occasion = await OccasionService.getById(req.params.id);
      return sendSuccess(res, 200, 'Occasion fetched successfully', occasion);
    } catch (error) {
      logger.error('Get occasion error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async create(req, res) {
    try {
      const occasion = await OccasionService.create(req.body);
      return sendSuccess(res, 201, 'Occasion created successfully', occasion);
    } catch (error) {
      logger.error('Create occasion error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  static async update(req, res) {
    try {
      const occasion = await OccasionService.update(req.params.id, req.body);
      return sendSuccess(res, 200, 'Occasion updated successfully', occasion);
    } catch (error) {
      logger.error('Update occasion error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  static async remove(req, res) {
    try {
      await OccasionService.delete(req.params.id);
      return sendSuccess(res, 200, 'Occasion deleted successfully');
    } catch (error) {
      logger.error('Delete occasion error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }
}

module.exports = OccasionController;
