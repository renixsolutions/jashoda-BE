const HomeVideo = require('./home-video.model');
const db = require('../../db/knex');

const HomeVideoController = {
  // Public API
  getActive: async (req, res) => {
    try {
      // Find the first active video, assuming there's only one active
      const data = await HomeVideo.findAll(true);
      if (!data || data.length === 0) {
        return res.status(200).json({ success: true, data: null });
      }
      res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await HomeVideo.findAll(activeOnly);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const item = await HomeVideo.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = { ...req.body };

      if (req.files && req.files.video) {
        const file = req.files.video;
        const uploadPath = `/uploads/videos/${Date.now()}-${file.name.replace(/\\s+/g, '-')}`;
        await file.mv(`./${uploadPath}`);
        data.video_url = uploadPath;
      }

      if (!data.video_url) {
        return res.status(400).json({ success: false, message: 'Video URL is required' });
      }

      data.is_active = data.is_active === 'true' || data.is_active === true;
      if (data.is_active) {
          await db('home_videos').update({ is_active: false });
      }

      // Format bottom_text to handle newlines
      if (data.bottom_text) {
          data.bottom_text = data.bottom_text;
      }

      const item = await HomeVideo.create(data);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = { ...req.body };
      const id = req.params.id;

      const existing = await HomeVideo.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

      if (req.files && req.files.video) {
        const file = req.files.video;
        const uploadPath = `/uploads/videos/${Date.now()}-${file.name.replace(/\\s+/g, '-')}`;
        await file.mv(`./${uploadPath}`);
        data.video_url = uploadPath;
      }

      data.is_active = data.is_active === 'true' || data.is_active === true;

      if (data.is_active) {
        await db('home_videos').whereNot('id', id).update({ is_active: false });
      }

      const item = await HomeVideo.update(id, data);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const item = await HomeVideo.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });

      await HomeVideo.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = HomeVideoController;
