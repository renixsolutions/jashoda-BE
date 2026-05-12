const knex = require('../../db/knex');

class CartModel {
  static async findOrCreateByUserId(userId) {
    let cart = await knex('carts').where({ user_id: userId }).first();
    if (!cart) {
      const [created] = await knex('carts').insert({ user_id: userId }).returning('*');
      cart = created;
    }
    return cart;
  }

  static async getItemsByCartId(cartId) {
    return knex('cart_items')
      .where({ cart_id: cartId })
      .orderBy('id', 'asc');
  }

  static async findItemByCartAndProduct(cartId, productId, sizeId = null) {
    const query = knex('cart_items').where({ cart_id: cartId, product_id: productId });
    if (sizeId) {
      query.where({ size_id: sizeId });
    } else {
      query.whereNull('size_id');
    }
    return query.first();
  }

  static async addItem(cartId, productId, quantity, price, sizeId = null) {
    const existing = await this.findItemByCartAndProduct(cartId, productId, sizeId);
    if (existing) {
      const [updated] = await knex('cart_items')
        .where({ id: existing.id })
        .update({
          quantity: existing.quantity + quantity,
          updated_at: knex.fn.now()
        })
        .returning('*');
      return updated;
    }
    const [inserted] = await knex('cart_items')
      .insert({ cart_id: cartId, product_id: productId, quantity, price, size_id: sizeId })
      .returning('*');
    return inserted;
  }

  static async updateItemQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      await knex('cart_items').where({ id: cartItemId }).del();
      return null;
    }
    const [updated] = await knex('cart_items')
      .where({ id: cartItemId })
      .update({ quantity, updated_at: knex.fn.now() })
      .returning('*');
    return updated;
  }

  static async removeItem(cartItemId) {
    return knex('cart_items').where({ id: cartItemId }).del();
  }

  static async getCartItemById(cartItemId) {
    return knex('cart_items').where({ id: cartItemId }).first();
  }

  static async clearCart(cartId) {
    return knex('cart_items').where({ cart_id: cartId }).del();
  }
}

module.exports = CartModel;
