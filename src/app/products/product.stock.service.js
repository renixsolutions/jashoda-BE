const knex = require('../../db/knex');
const ProductModel = require('./product.model');

/**
 * Decrement product stock by quantity. If stock reaches 0, set stock_status to 'out_of_stock'.
 * Handles both overall stock and variant-specific stock in JSON.
 * @param {number} productId
 * @param {number} quantity
 * @param {number|null} sizeId
 * @returns {Promise<{ stock_quantity: number, stock_status: string }>}
 */
async function decrementStock(productId, quantity, sizeId = null) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  console.log(`Decrementing stock for product ${productId}, qty: ${quantity}, sizeId: ${sizeId}`);
  console.log('Product variants before:', product.variants);

  const updateData = {
    updated_at: knex.fn.now()
  };

  // Update overall stock
  const currentTotal = parseInt(product.stock_quantity, 10) || 0;
  const newTotal = Math.max(0, currentTotal - quantity);
  updateData.stock_quantity = newTotal;
  updateData.stock_status = newTotal <= 0 ? 'out_of_stock' : (newTotal <= (product.low_stock_threshold || 5) ? 'low_stock' : 'in_stock');

  // Update variant stock if sizeId is provided
  if (sizeId && product.variants) {
    let variants = product.variants;
    if (typeof variants === 'string') {
      try {
        variants = JSON.parse(variants);
      } catch (e) {
        console.error('Failed to parse variants string:', variants);
        variants = [];
      }
    }
    
    if (Array.isArray(variants)) {
      const updatedVariants = variants.map(v => {
        if (v.size_id == sizeId) {
          const oldQty = parseInt(v.quantity, 10) || 0;
          const newQty = Math.max(0, oldQty - quantity);
          console.log(`Updating size ${v.size}: ${oldQty} -> ${newQty}`);
          return { ...v, quantity: newQty };
        }
        return v;
      });
      updateData.variants = JSON.stringify(updatedVariants);
      console.log('Product variants after:', updateData.variants);
    }
  }

  await knex('products')
    .where({ id: productId })
    .update(updateData);

  return { stock_quantity: newTotal, stock_status: updateData.stock_status };
}

/**
 * Increment product stock by quantity.
 * Handles both overall stock and variant-specific stock in JSON.
 * @param {number} productId
 * @param {number} quantity
 * @param {number|null} sizeId
 * @returns {Promise<{ stock_quantity: number, stock_status: string }>}
 */
async function incrementStock(productId, quantity, sizeId = null) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  console.log(`Incrementing stock for product ${productId}, qty: ${quantity}, sizeId: ${sizeId}`);

  const updateData = {
    updated_at: knex.fn.now()
  };

  // Update overall stock
  const currentTotal = parseInt(product.stock_quantity, 10) || 0;
  const newTotal = currentTotal + quantity;
  updateData.stock_quantity = newTotal;
  updateData.stock_status = newTotal <= 0 ? 'out_of_stock' : (newTotal <= (product.low_stock_threshold || 5) ? 'low_stock' : 'in_stock');

  // Update variant stock if sizeId is provided
  if (sizeId && product.variants) {
    let variants = product.variants;
    if (typeof variants === 'string') {
      try {
        variants = JSON.parse(variants);
      } catch (e) {
        variants = [];
      }
    }

    if (Array.isArray(variants)) {
      const updatedVariants = variants.map(v => {
        if (v.size_id == sizeId) {
          const oldQty = parseInt(v.quantity, 10) || 0;
          return { ...v, quantity: oldQty + quantity };
        }
        return v;
      });
      updateData.variants = JSON.stringify(updatedVariants);
    }
  }

  await knex('products')
    .where({ id: productId })
    .update(updateData);

  return { stock_quantity: newTotal, stock_status: updateData.stock_status };
}

module.exports = { decrementStock, incrementStock };
