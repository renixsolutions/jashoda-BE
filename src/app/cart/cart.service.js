const CartModel = require('./cart.model');
const ProductModel = require('../products/product.model');
const { toFullUrl } = require('../../utils/helpers');
const config = require('../../config/app');

class CartService {
  static async getOrCreateCart(userId) {
    return CartModel.findOrCreateByUserId(userId);
  }

  static async getCartWithItems(userId) {
    const cart = await CartModel.findOrCreateByUserId(userId);
    const items = await CartModel.getItemsByCartId(cart.id);
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const products = await Promise.all(
      productIds.map((id) => ProductModel.findById(id))
    );
    const productMap = Object.fromEntries(products.filter(Boolean).map((p) => [p.id, p]));

    const itemsWithProduct = items
      .map((item) => {
        const product = productMap[item.product_id];
        if (!product) return null;
        const effectivePrice = product.discount_price && parseFloat(product.discount_price) > 0
          ? parseFloat(product.discount_price)
          : parseFloat(product.price);
        const subtotal = effectivePrice * item.quantity;
        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku || null,
            price: parseFloat(product.price),
            discount_price: product.discount_price ? parseFloat(product.discount_price) : null,
            image_url: product.image_url ? toFullUrl(product.image_url, config.appUrl) : product.image_url,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status
          }
        };
      })
      .filter(Boolean);

    const subtotal = itemsWithProduct.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      cart_id: cart.id,
      items: itemsWithProduct,
      item_count: itemsWithProduct.length,
      subtotal: Math.round(subtotal * 100) / 100
    };
  }

  static async addToCart(userId, productId, quantity = 1) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.status !== 'active') throw new Error('Product is not available');
    const stock = product.stock_quantity != null ? parseInt(product.stock_quantity, 10) : 0;
    if (product.stock_status === 'out_of_stock' || stock < quantity) {
      throw new Error('Insufficient stock or product is out of stock');
    }

    const effectivePrice = product.discount_price && parseFloat(product.discount_price) > 0
      ? parseFloat(product.discount_price)
      : parseFloat(product.price);

    const cart = await CartModel.findOrCreateByUserId(userId);
    const item = await CartModel.addItem(cart.id, productId, quantity, effectivePrice);
    return this.getCartWithItems(userId);
  }

  static async updateItem(userId, cartItemId, quantity) {
    const item = await CartModel.getCartItemById(cartItemId);
    if (!item) throw new Error('Cart item not found');

    const cart = await CartModel.findOrCreateByUserId(userId);
    const cartItems = await CartModel.getItemsByCartId(cart.id);
    if (!cartItems.some((i) => i.id === parseInt(cartItemId, 10))) {
      throw new Error('Cart item not found');
    }

    const product = await ProductModel.findById(item.product_id);
    const stock = product?.stock_quantity != null ? parseInt(product.stock_quantity, 10) : 0;
    if (quantity > stock) throw new Error('Insufficient stock');

    await CartModel.updateItemQuantity(cartItemId, quantity);
    return this.getCartWithItems(userId);
  }

  static async removeItem(userId, cartItemId) {
    const item = await CartModel.getCartItemById(cartItemId);
    if (!item) throw new Error('Cart item not found');

    const cart = await CartModel.findOrCreateByUserId(userId);
    const cartItems = await CartModel.getItemsByCartId(cart.id);
    if (!cartItems.some((i) => i.id === parseInt(cartItemId, 10))) {
      throw new Error('Cart item not found');
    }

    await CartModel.removeItem(cartItemId);
    return this.getCartWithItems(userId);
  }

  static async clearCart(userId) {
    const cart = await CartModel.findOrCreateByUserId(userId);
    await CartModel.clearCart(cart.id);
    return this.getCartWithItems(userId);
  }
}

module.exports = CartService;
