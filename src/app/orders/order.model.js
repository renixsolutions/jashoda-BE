const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class OrderModel {
  static async create(orderData) {
    const sanitized = sanitizeObject(orderData);
    const [order] = await knex('orders').insert(sanitized).returning('*');
    return order;
  }

  static async createOrderItem(item) {
    const [row] = await knex('order_items').insert(item).returning('*');
    return row;
  }

  static async findById(id) {
    return knex('orders').where({ id }).first();
  }

  static async findByOrderNumber(orderNumber) {
    return knex('orders').where({ order_number: orderNumber }).first();
  }

  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    const baseQuery = knex('orders').where({ user_id: userId });
    if (status) baseQuery.where({ status });

    const [{ count }] = await baseQuery.clone().count('* as count');
    const orders = await baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit)
      }
    };
  }

  static async getOrderItems(orderId) {
    return knex('order_items').where({ order_id: orderId }).orderBy('id', 'asc');
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 20, status, search, userId, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
    const baseQuery = knex('orders')
      .leftJoin('users', 'orders.user_id', 'users.id');

    if (status) baseQuery.where('orders.status', status);
    if (userId) baseQuery.where('orders.user_id', userId);
    if (search) {
      baseQuery.where((builder) => {
        builder.where('orders.order_number', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await baseQuery.clone().count('* as count');
    const orders = await baseQuery
      .clone()
      .select(
        'orders.*',
        'users.name as user_name',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email',
        'users.phone as user_phone'
      )
      .orderBy(`orders.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);
    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit)
      }
    };
  }

  static async update(id, data) {
    const sanitized = sanitizeObject(data);
    sanitized.updated_at = knex.fn.now();
    const [order] = await knex('orders').where({ id }).update(sanitized).returning('*');
    return order || null;
  }
}

module.exports = OrderModel;
