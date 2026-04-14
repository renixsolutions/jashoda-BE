const Marquee = require('./marquee.model');

exports.getMarquee = async (req, res) => {
    try {
        const messages = await Marquee.getMessages();
        const settings = await Marquee.getSettings();
        res.status(200).json({
            success: true,
            data: { messages, settings }
        });
    } catch (error) {
        console.error('Error fetching marquee:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Admin methods
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Marquee.getAllMessages();
        const settings = await Marquee.getSettings();
        res.status(200).json({
            success: true,
            data: { messages, settings }
        });
    } catch (error) {
        console.error('Error fetching all marquee messages:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.createMessage = async (req, res) => {
    try {
        const { text, display_order, is_active } = req.body;
        await Marquee.createMessage({ text, display_order, is_active });
        res.status(201).json({ success: true, message: 'Message created' });
    } catch (error) {
        console.error('Error creating marquee message:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, display_order, is_active } = req.body;
        await Marquee.updateMessage(id, { text, display_order, is_active });
        res.status(200).json({ success: true, message: 'Message updated' });
    } catch (error) {
        console.error('Error updating marquee message:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await Marquee.deleteMessage(id);
        res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting marquee message:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { speed, bg_color, text_color, is_active } = req.body;
        await Marquee.updateSettings({ speed, bg_color, text_color, is_active });
        res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
        console.error('Error updating marquee settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
