const Story = require('./story.model');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

class StoryController {
    static async getAll(req, res) {
        try {
            const { activeOnly } = req.query;
            const stories = await Story.findAll(activeOnly === 'true' || activeOnly === true);
            return sendSuccess(res, 200, 'Stories retrieved successfully', stories);
        } catch (error) {
            logger.error('Error fetching stories:', error);
            return sendError(res, 500, 'Failed to fetch stories');
        }
    }

    static async create(req, res) {
        try {
            const { title, subtitle, video_url, link_url, is_active, order_index } = req.body;

            if (!video_url) {
                return sendError(res, 400, 'Video URL is required');
            }

            const newStory = await Story.create({
                title,
                subtitle,
                video_url,
                link_url,
                is_active: is_active !== undefined ? is_active : true,
                order_index: order_index || 0
            });

            return sendSuccess(res, 201, 'Story video created successfully', newStory);
        } catch (error) {
            logger.error('Error creating story video:', error);
            return sendError(res, 500, 'Failed to create story video');
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, subtitle, video_url, link_url, is_active, order_index } = req.body;

            const story = await Story.findById(id);
            if (!story) {
                return sendError(res, 404, 'Story video not found');
            }

            const updated = await Story.update(id, {
                title,
                subtitle,
                video_url,
                link_url,
                is_active,
                order_index,
                updated_at: new Date()
            });

            return sendSuccess(res, 200, 'Story video updated successfully', updated);
        } catch (error) {
            logger.error('Error updating story video:', error);
            return sendError(res, 500, 'Failed to update story video');
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const story = await Story.findById(id);

            if (!story) {
                return sendError(res, 404, 'Story video not found');
            }

            await Story.delete(id);
            return sendSuccess(res, 200, 'Story video deleted successfully');
        } catch (error) {
            logger.error('Error deleting story video:', error);
            return sendError(res, 500, 'Failed to delete story video');
        }
    }
}

module.exports = StoryController;
