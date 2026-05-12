const RingSizeModel = require('./ring-size.model');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class RingSizeController {
  static async list(req, res) {
    try {
      const { page, limit, isActive, search, sortBy, sortOrder } = req.query;
      const result = await RingSizeModel.findAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        isActive,
        search,
        sortBy,
        sortOrder
      });
      return sendSuccess(res, 200, 'Ring sizes fetched successfully', result.data, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List ring sizes error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getAllActive(req, res) {
    try {
      const result = await RingSizeModel.getAllActive();
      return sendSuccess(res, 200, 'Active ring sizes fetched successfully', result);
    } catch (error) {
      logger.error('Get active ring sizes error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async create(req, res) {
    try {
      const result = await RingSizeModel.create(req.body);
      return sendSuccess(res, 201, 'Ring size created successfully', result);
    } catch (error) {
      logger.error('Create ring size error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  static async update(req, res) {
    try {
      const result = await RingSizeModel.update(req.params.id, req.body);
      if (!result) return sendError(res, 404, messages.NOT_FOUND);
      return sendSuccess(res, 200, 'Ring size updated successfully', result);
    } catch (error) {
      logger.error('Update ring size error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  static async remove(req, res) {
    try {
      await RingSizeModel.delete(req.params.id);
      return sendSuccess(res, 200, 'Ring size deleted successfully');
    } catch (error) {
      logger.error('Delete ring size error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }
}

module.exports = RingSizeController;
