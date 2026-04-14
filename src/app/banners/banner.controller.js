const Banner = require('./banner.model');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

class BannerController {
    static async getAll(req, res) {
        try {
            const { activeOnly, type } = req.query;
            const banners = await Banner.findAll(activeOnly === 'true' || activeOnly === true, type);
            return sendSuccess(res, 200, 'Banners retrieved successfully', banners);
        } catch (error) {
            logger.error('Error fetching banners:', error);
            return sendError(res, 500, 'Failed to fetch banners');
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const banner = await Banner.findById(id);
            if (!banner) {
                return sendError(res, 404, 'Banner not found');
            }
            return sendSuccess(res, 200, 'Banner retrieved successfully', banner);
        } catch (error) {
            logger.error('Error fetching banner:', error);
            return sendError(res, 500, 'Failed to fetch banner');
        }
    }

    static async create(req, res) {
        try {
            const { 
                title, subtitle, brand_text, description, image_url, secondary_image_url, cta_text,
                category_id, subcategory_id, gender_id, occasion_id,
                bg_color, accent_color, is_active, order_index, banner_type 
            } = req.body;

            if (!image_url) {
                return sendError(res, 400, 'Image URL is required');
            }

            const newBanner = await Banner.create({
                title, subtitle, brand_text, description, image_url, secondary_image_url, cta_text,
                category_id, subcategory_id, gender_id, occasion_id,
                bg_color, accent_color,
                banner_type: banner_type || 'PROMO_CAROUSEL',
                is_active: is_active !== undefined ? is_active : true,
                order_index: order_index || 0
            });

            return sendSuccess(res, 201, 'Banner created successfully', newBanner);
        } catch (error) {
            logger.error('Error creating banner:', error);
            return sendError(res, 500, 'Failed to create banner');
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            const banner = await Banner.findById(id);
            if (!banner) {
                return sendError(res, 404, 'Banner not found');
            }

            // Remove id from data if exists
            delete data.id;

            const updated = await Banner.update(id, {
                ...data,
                updated_at: new Date()
            });

            return sendSuccess(res, 200, 'Banner updated successfully', updated);
        } catch (error) {
            logger.error('Error updating banner:', error);
            return sendError(res, 500, 'Failed to update banner');
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const banner = await Banner.findById(id);

            if (!banner) {
                return sendError(res, 404, 'Banner not found');
            }

            await Banner.delete(id);
            return sendSuccess(res, 200, 'Banner deleted successfully');
        } catch (error) {
            logger.error('Error deleting banner:', error);
            return sendError(res, 500, 'Failed to delete banner');
        }
    }
}

module.exports = BannerController;
