const Coupon = require('./coupon.model');
const logger = require('../../utils/logger');

const getAllOffers = async (req, res) => {
  try {
    // Only fetch active offers for the public endpoint
    const offers = await Coupon.findAll(true); 

    let usedCouponIds = [];
    if (req.user) {
      const knex = require('../../db/connection').knex;
      const usages = await knex('user_coupons')
        .where({ user_id: req.user.id, is_used: true });
      usedCouponIds = usages.map(u => u.coupon_id);
    }

    const filteredOffers = offers.filter(o => {
      if (o.is_one_time && usedCouponIds.includes(o.id)) {
        return false;
      }
      return true;
    });

    // Map DB columns to API field names for the frontend
    const mappedOffers = filteredOffers.map(o => ({
      id: o.id,
      title: o.title,
      code: o.code,
      description: o.description,
      discount_type: (o.type || 'PERCENTAGE').toUpperCase(),
      discount_value: o.value,
      min_purchase: o.min_order_amount,
      expiry_date: o.expiry_date,
      is_active: o.is_active,
      is_one_time: !!o.is_one_time,
      created_at: o.created_at
    }));
    res.json({ success: true, data: mappedOffers });
  } catch (error) {
    logger.error('Error in getAllOffers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOfferById = async (req, res) => {
  try {
    const o = await Coupon.findById(req.params.id);
    if (!o) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    const mappedOffer = {
      id: o.id,
      title: o.title,
      code: o.code,
      description: o.description,
      discount_type: (o.type || 'PERCENTAGE').toUpperCase(),
      discount_value: o.value,
      min_purchase: o.min_order_amount,
      expiry_date: o.expiry_date,
      is_active: o.is_active,
      is_one_time: !!o.is_one_time
    };
    res.json({ success: true, data: mappedOffer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createOffer = async (req, res) => {
  try {
    const { title, code, description, discount_type, discount_value, min_purchase, expiry_date, is_active, is_one_time } = req.body;
    
    const data = {
      title,
      code,
      description,
      type: discount_type.toLowerCase(),
      value: discount_value,
      min_order_amount: min_purchase,
      expiry_date,
      is_active,
      is_one_time: is_one_time || false
    };

    const id = await Coupon.create(data);
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    logger.error('Error in createOffer:', error);
    res.status(500).json({ success: false, message: 'Failed to create offer' });
  }
};

const updateOffer = async (req, res) => {
  try {
    const { title, code, description, discount_type, discount_value, min_purchase, expiry_date, is_active, is_one_time } = req.body;
    
    const data = {
      title,
      code,
      description,
      type: discount_type.toLowerCase(),
      value: discount_value,
      min_order_amount: min_purchase,
      expiry_date,
      is_active,
      is_one_time: is_one_time !== undefined ? is_one_time : undefined
    };

    await Coupon.update(req.params.id, data);
    res.json({ success: true, message: 'Offer updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update offer' });
  }
};

const deleteOffer = async (req, res) => {
  try {
    await Coupon.delete(req.params.id);
    res.json({ success: true, message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete offer' });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await Coupon.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findByCode(code.toUpperCase());

    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
    }

    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (cartTotal < coupon.min_order_amount) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.min_order_amount} required` });
    }

    // Check for one-time usage if user is logged in
    if (coupon.is_one_time && req.user) {
      const knex = require('../../db/connection').knex;
      const usage = await knex('user_coupons')
        .where({ user_id: req.user.id, coupon_id: coupon.id, is_used: true })
        .first();
      
      if (usage) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }

    res.json({ 
      success: true, 
      data: { 
        id: coupon.id,
        code: coupon.code,
        discount_type: (coupon.type || 'PERCENTAGE').toUpperCase(),
        discount_value: coupon.value,
        min_purchase: coupon.min_order_amount,
        is_one_time: !!coupon.is_one_time
      } 
    });

  } catch (error) {
    logger.error('Validation failed:', error);
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  getStats,
  validateCoupon
};
