const HomeAdCard = require('./home-ad.model');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

class HomeAdController {
    static async getAll(req, res) {
        try {
            const { activeOnly } = req.query;
            const cards = await HomeAdCard.findAll(activeOnly === 'true' || activeOnly === true);
            return sendSuccess(res, 200, 'Home ad cards retrieved successfully', cards);
        } catch (error) {
            logger.error('Error fetching home ad cards:', error);
            return sendError(res, 500, 'Failed to fetch home ad cards');
        }
    }

    static async create(req, res) {
        try {
            const { 
                title, 
                subtitle, 
                video_url, 
                link_url, 
                link_text, 
                category_id, 
                gender_id, 
                occasion_id, 
                is_active, 
                order_index 
            } = req.body;

            if (!video_url) {
                return sendError(res, 400, 'Video URL is required');
            }

            const newCard = await HomeAdCard.create({
                title,
                subtitle,
                video_url,
                link_url,
                link_text,
                category_id,
                gender_id,
                occasion_id,
                is_active: is_active !== undefined ? is_active : true,
                order_index: order_index || 0
            });

            return sendSuccess(res, 201, 'Home ad card created successfully', newCard);
        } catch (error) {
            logger.error('Error creating home ad card:', error);
            return sendError(res, 500, 'Failed to create home ad card');
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { 
                title, 
                subtitle, 
                video_url, 
                link_url, 
                link_text, 
                category_id, 
                gender_id, 
                occasion_id, 
                is_active, 
                order_index 
            } = req.body;

            const card = await HomeAdCard.findById(id);
            if (!card) {
                return sendError(res, 404, 'Home ad card not found');
            }

            const updated = await HomeAdCard.update(id, {
                title,
                subtitle,
                video_url,
                link_url,
                link_text,
                category_id,
                gender_id,
                occasion_id,
                is_active,
                order_index,
                updated_at: new Date()
            });

            return sendSuccess(res, 200, 'Home ad card updated successfully', updated);
        } catch (error) {
            logger.error('Error updating home ad card:', error);
            return sendError(res, 500, 'Failed to update home ad card');
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const card = await HomeAdCard.findById(id);

            if (!card) {
                return sendError(res, 404, 'Home ad card not found');
            }

            await HomeAdCard.delete(id);
            return sendSuccess(res, 200, 'Home ad card deleted successfully');
        } catch (error) {
            logger.error('Error deleting home ad card:', error);
            return sendError(res, 500, 'Failed to delete home ad card');
        }
    }
}

module.exports = HomeAdController;
