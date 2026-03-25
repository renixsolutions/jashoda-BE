const PromoVideo = require('./promo.model');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

class PromoController {
    static async getAll(req, res) {
        try {
            const { activeOnly } = req.query;
            const videos = await PromoVideo.findAll(activeOnly === 'true' || activeOnly === true);
            return sendSuccess(res, 200, 'Promo videos retrieved successfully', videos);
        } catch (error) {
            logger.error('Error fetching promo videos:', error);
            return sendError(res, 500, 'Failed to fetch promo videos');
        }
    }

    static async create(req, res) {
        try {
            const { title, subtitle, video_url, link_url, is_active, order_index } = req.body;

            if (!video_url) {
                return sendError(res, 400, 'Video URL is required');
            }

            const newPromo = await PromoVideo.create({
                title,
                subtitle,
                video_url,
                link_url,
                is_active: is_active !== undefined ? is_active : true,
                order_index: order_index || 0
            });

            return sendSuccess(res, 201, 'Promo video created successfully', newPromo);
        } catch (error) {
            logger.error('Error creating promo video:', error);
            return sendError(res, 500, 'Failed to create promo video');
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, subtitle, video_url, link_url, is_active, order_index } = req.body;

            const promo = await PromoVideo.findById(id);
            if (!promo) {
                return sendError(res, 404, 'Promo video not found');
            }

            const updated = await PromoVideo.update(id, {
                title,
                subtitle,
                video_url,
                link_url,
                is_active,
                order_index,
                updated_at: new Date()
            });

            return sendSuccess(res, 200, 'Promo video updated successfully', updated);
        } catch (error) {
            logger.error('Error updating promo video:', error);
            return sendError(res, 500, 'Failed to update promo video');
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const promo = await PromoVideo.findById(id);

            if (!promo) {
                return sendError(res, 404, 'Promo video not found');
            }

            await PromoVideo.delete(id);
            return sendSuccess(res, 200, 'Promo video deleted successfully');
        } catch (error) {
            logger.error('Error deleting promo video:', error);
            return sendError(res, 500, 'Failed to delete promo video');
        }
    }
}

module.exports = PromoController;
