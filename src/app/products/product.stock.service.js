const knex = require('../../db/knex');
const ProductModel = require('./product.model');

/**
 * Decrement product stock by quantity. If stock reaches 0, set stock_status to 'out_of_stock'.
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<{ stock_quantity: number, stock_status: string }>}
 */
async function decrementStock(productId, quantity) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  const current = parseInt(product.stock_quantity, 10) || 0;
  const newQty = Math.max(0, current - quantity);
  const stockStatus = newQty <= 0 ? 'out_of_stock' : (newQty <= (product.low_stock_threshold || 5) ? 'low_stock' : 'in_stock');

  await knex('products')
    .where({ id: productId })
    .update({
      stock_quantity: newQty,
      stock_status: stockStatus,
      updated_at: knex.fn.now()
    });

  return { stock_quantity: newQty, stock_status: stockStatus };
}

module.exports = { decrementStock };
