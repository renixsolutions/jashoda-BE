const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class ProductModel {
  static async create(productData) {
    const sanitized = sanitizeObject(productData);
    const [product] = await knex('products')
      .insert(sanitized)
      .returning('*');
    return product;
  }

  static async findById(id) {
    return knex('products').where({ id }).first();
  }

  static async findBySlug(slug) {
    return knex('products').where({ slug }).first();
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      occasion,
      gender,
      status = 'active',
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      metalType,
      stoneType,
      inStock
    } = options;

    const offset = (page - 1) * limit;
    const allowedSort = { price: 'price', created_at: 'created_at', name: 'name' };
    const sortField = allowedSort[sortBy] || 'created_at';
    const order = (sortOrder && String(sortOrder).toLowerCase() === 'asc') ? 'asc' : 'desc';

    let catIds = [];
    let occIds = [];
    let genIds = [];

    if (search) {
      try {
        const matchingCategories = await knex('categories').where('name', 'ilike', `%${search}%`).select('id');
        catIds = matchingCategories.map(c => c.id.toString());

        const matchingOccasions = await knex('occasions').where('name', 'ilike', `%${search}%`).select('id');
        occIds = matchingOccasions.map(o => o.id);

        await knex.raw('select 1 from genders limit 1').then(async () => {
          const matchingGenders = await knex('genders').where('name', 'ilike', `%${search}%`).select('id');
          genIds = matchingGenders.map(g => g.id.toString());
        }).catch(() => { }); // Catch if genders table doesn't exist
      } catch (e) {
        console.error("Search pre-fetch error:", e);
      }
    }

    let query = knex('products')
      .leftJoin(
        knex.raw(
          "(SELECT product_id, ROUND(AVG(rating)::numeric, 2) AS average_rating, COUNT(*)::int AS review_count FROM product_reviews WHERE status = 'approved' GROUP BY product_id) pr"
        ),
        'products.id',
        'pr.product_id'
      )
      .select('products.*', 'pr.average_rating', 'pr.review_count');

    // Status filter (only active products for website)
    if (status) query = query.where('products.status', status);

    // Category filter - can be name or ID
    if (category) {
      query = query.where('products.category', category);
    }
    if (subcategory) {
      query = query.where('products.subcategory', subcategory);
    }
    if (occasion != null && occasion !== '') {
      const occasionId = typeof occasion === 'number' ? occasion : parseInt(occasion, 10);
      if (!isNaN(occasionId)) {
        query = query.where('products.occasion_id', occasionId);
      }
    }
    if (gender) {
      query = query.where('products.gender', gender);
    }
    if (minPrice) {
      query = query.where('products.price', '>=', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.where('products.price', '<=', parseFloat(maxPrice));
    }
    if (metalType) {
      query = query.where('products.metal_type', metalType);
    }
    if (stoneType) {
      query = query.where('products.stone_type', stoneType);
    }
    if (inStock === true || inStock === 'true') {
      query = query.where('products.stock_status', 'in_stock').where('products.stock_quantity', '>', 0);
    }
    if (search) {
      query = query.where((builder) => {
        builder
          .where('products.name', 'ilike', `%${search}%`)
          .orWhere('products.description', 'ilike', `%${search}%`)
          .orWhere('products.sku', 'ilike', `%${search}%`)
          .orWhere('products.short_description', 'ilike', `%${search}%`);

        if (catIds.length > 0) {
          builder.orWhereIn('products.category', catIds).orWhereIn('products.subcategory', catIds);
        }
        if (occIds.length > 0) {
          builder.orWhereIn('products.occasion_id', occIds);
        }
        if (genIds.length > 0) {
          builder.orWhereIn('products.gender', genIds);
        }
      });
    }

    const countQuery = knex('products');
    if (status) countQuery.where('status', status);
    if (category) countQuery.where('category', category);
    if (subcategory) countQuery.where('subcategory', subcategory);
    if (occasion != null && occasion !== '') {
      const occasionId = typeof occasion === 'number' ? occasion : parseInt(occasion, 10);
      if (!isNaN(occasionId)) countQuery.where('occasion_id', occasionId);
    }
    if (gender) countQuery.where('gender', gender);
    if (minPrice) countQuery.where('price', '>=', parseFloat(minPrice));
    if (maxPrice) countQuery.where('price', '<=', parseFloat(maxPrice));
    if (metalType) countQuery.where('metal_type', metalType);
    if (stoneType) countQuery.where('stone_type', stoneType);
    if (inStock === true || inStock === 'true') {
      countQuery.where('stock_status', 'in_stock').where('stock_quantity', '>', 0);
    }
    if (search) {
      countQuery.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`)
          .orWhere('sku', 'ilike', `%${search}%`)
          .orWhere('short_description', 'ilike', `%${search}%`);

        if (catIds.length > 0) {
          builder.orWhereIn('category', catIds).orWhereIn('subcategory', catIds);
        }
        if (occIds.length > 0) {
          builder.orWhereIn('occasion_id', occIds);
        }
        if (genIds.length > 0) {
          builder.orWhereIn('gender', genIds);
        }
      });
    }
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    const products = await query
      .orderBy(`products.${sortField} `, order)
      .limit(limit)
      .offset(offset);

    // Normalize: average_rating as number, review_count as integer (products.* may have string from join)
    const normalized = products.map((p) => ({
      ...p,
      average_rating: p.average_rating != null ? parseFloat(p.average_rating) : null,
      review_count: p.review_count != null ? parseInt(p.review_count, 10) : 0
    }));

    return {
      products: normalized,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAverageRatingAndCount(productId) {
    const row = await knex('product_reviews')
      .where({ product_id: productId, status: 'approved' })
      .select(
        knex.raw('ROUND(AVG(rating)::numeric, 2) as average_rating'),
        knex.raw('COUNT(*)::int as review_count')
      )
      .first();
    return {
      average_rating: row && row.average_rating != null ? parseFloat(row.average_rating) : null,
      review_count: row && row.review_count != null ? parseInt(row.review_count, 10) : 0
    };
  }

  static async getReviewsForProduct(productId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    const whereClause = { product_id: productId, status: 'approved' };
    const [reviews, countResult] = await Promise.all([
      knex('product_reviews').where(whereClause).select('*').orderBy('created_at', 'desc').limit(limit).offset(offset),
      knex('product_reviews').where(whereClause).count('* as count').first()
    ]);
    const total = parseInt(countResult?.count || 0, 10);
    const ratingAgg = await this.getAverageRatingAndCount(productId);

    const reviewIds = reviews.map((r) => r.review_id);
    const reviewImages = reviewIds.length > 0 ? await this.getReviewImagesByReviewIds(reviewIds) : [];
    const imagesByReviewId = {};
    for (const img of reviewImages) {
      if (!imagesByReviewId[img.review_id]) imagesByReviewId[img.review_id] = [];
      imagesByReviewId[img.review_id].push(img);
    }
    const reviewsWithImages = reviews.map((r) => ({
      ...r,
      images: imagesByReviewId[r.review_id] || []
    }));

    return {
      reviews: reviewsWithImages,
      average_rating: ratingAgg.average_rating,
      review_count: ratingAgg.review_count,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async hasUserPurchasedProduct(userId, productId) {
    const row = await knex('order_items as oi')
      .join('orders as o', 'o.id', 'oi.order_id')
      .where({
        'o.user_id': userId,
        'oi.product_id': productId,
        'o.status': 'delivered'
      })
      .select(knex.raw('1'))
      .first();
    return !!row;
  }

  static async hasUserReviewedProduct(userId, productId) {
    const row = await knex('product_reviews')
      .where({ user_id: userId, product_id: productId })
      .select('review_id')
      .first();
    return !!row;
  }

  static async createReview(data) {
    const [review] = await knex('product_reviews')
      .insert({
        product_id: data.product_id,
        user_id: data.user_id,
        rating: data.rating,
        review_title: data.review_title || null,
        review_description: data.review_description || null,
        is_verified_purchase: data.is_verified_purchase !== false,
        status: 'pending'
      })
      .returning('*');
    return review;
  }

  static async setReviewImages(reviewId, urls) {
    if (!Array.isArray(urls) || urls.length === 0) return [];
    const rows = urls.slice(0, 3).map((url, index) => ({
      review_id: reviewId,
      url: typeof url === 'string' ? url : url.url || url,
      sort_order: index
    }));
    const inserted = await knex('product_review_images').insert(rows).returning('*');
    return inserted;
  }

  static async getReviewImagesByReviewIds(reviewIds) {
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) return [];
    const images = await knex('product_review_images')
      .whereIn('review_id', reviewIds)
      .orderBy('review_id')
      .orderBy('sort_order')
      .orderBy('id')
      .select('*');
    return images;
  }

  static async getImages(productId) {
    return knex('product_images')
      .where({ product_id: productId })
      .orderBy('sort_order', 'asc')
      .orderBy('id', 'asc');
  }

  static async setImages(productId, images) {
    if (!Array.isArray(images) || images.length === 0) return [];

    const rows = images.map((url, index) => ({
      product_id: productId,
      url,
      is_primary: index === 0,
      sort_order: index
    }));

    const inserted = await knex('product_images')
      .insert(rows)
      .returning('*');

    return inserted;
  }

  static async replaceImages(productId, images) {
    await knex('product_images').where({ product_id: productId }).del();
    return this.setImages(productId, images);
  }

  static async update(id, productData) {
    const sanitized = sanitizeObject(productData);
    sanitized.updated_at = knex.fn.now();
    const [product] = await knex('products')
      .where({ id })
      .update(sanitized)
      .returning('*');
    return product || null;
  }

  static async delete(id) {
    return knex('products').where({ id }).del();
  }
}

module.exports = ProductModel;
