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
    const product = await knex('products')
      .leftJoin('categories', knex.raw('products.category::text'), knex.raw('categories.id::text'))
      .where('products.id', id)
      .select('products.*', 'categories.name as category_name')
      .first();

    if (product) {
      product.occasions = await this.getOccasions(product.id);
      product.collections = await this.getCollections(product.id);
    }
    return product;
  }

  static async findBySlug(slug) {
    const product = await knex('products')
      .leftJoin('categories', knex.raw('products.category::text'), knex.raw('categories.id::text'))
      .where('products.slug', slug)
      .select('products.*', 'categories.name as category_name')
      .first();

    if (product) {
      product.occasions = await this.getOccasions(product.id);
      product.collections = await this.getCollections(product.id);
    }
    return product;
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      occasion,
      gender,
      collection,
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
        }).catch(() => { }); 
      } catch (e) {
        console.error("Search pre-fetch error:", e);
      }
    }

    let query = knex('products');

    // Filters
    if (status) query = query.where('products.status', status);

    if (category) {
      query = query.where('products.category', category);
    }
    if (subcategory) {
      query = query.where('products.subcategory', subcategory);
    }

    // Occasion filter (can be slug or ID)
    if (occasion) {
      const occasionIds = Array.isArray(occasion) ? occasion : [occasion];
      const numericIds = occasionIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
      const slugs = occasionIds.filter(id => isNaN(parseInt(id, 10)));
      
      query = query.whereIn('products.id', function() {
        this.select('product_id').from('product_occasions')
          .join('occasions', 'product_occasions.occasion_id', 'occasions.id')
          .where(function() {
            if (numericIds.length > 0) this.whereIn('occasions.id', numericIds);
            if (slugs.length > 0) this.orWhereIn('occasions.slug', slugs);
          });
      });
    }

    // Gender filter (can be slug or ID)
    if (gender) {
      if (!isNaN(parseInt(gender, 10))) {
        const genderId = parseInt(gender, 10);
        query = query.where(function() {
          this.where('products.gender', genderId.toString())

          // Also try to find by name just in case
          this.orWhereIn('products.gender', function() {
            this.select('name').from('genders').where('id', genderId);
          });
        });
      } else {
        query = query.where(function() {
          this.where('products.gender', 'ilike', gender)
            .orWhereIn('products.gender', function() {
              this.select('name').from('genders').where('slug', gender);
            })
            .orWhereIn('products.gender', function() {
              this.select(knex.raw('id::text')).from('genders').where('slug', gender);
            });
        });
      }
    }

    // Collection filter (can be slug or ID)
    if (collection) {
      const collectionIds = Array.isArray(collection) ? collection : [collection];
      const numericIds = collectionIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
      const slugs = collectionIds.filter(id => isNaN(parseInt(id, 10)));

      query = query.whereIn('products.id', function() {
        this.select('product_id').from('product_collections')
          .join('collections', 'product_collections.collection_id', 'collections.id')
          .where(function() {
            if (numericIds.length > 0) this.whereIn('collections.id', numericIds);
            if (slugs.length > 0) this.orWhereIn('collections.slug', slugs);
          });
      });
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
          builder.orWhereIn('products.id', function() {
            this.select('product_id').from('product_occasions').whereIn('occasion_id', occIds);
          });
        }
        if (genIds.length > 0) {
          builder.orWhereIn('products.gender', genIds);
        }
      });
    }

    // Get total count
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total, 10);

    // Final query with joins and pagination
    const products = await query
      .leftJoin('categories', knex.raw('products.category::text'), knex.raw('categories.id::text'))
      .leftJoin(
        knex.raw(
          "(SELECT product_id, ROUND(AVG(rating)::numeric, 2) AS average_rating, COUNT(*)::int AS review_count FROM product_reviews WHERE status = 'approved' GROUP BY product_id) pr"
        ),
        'products.id',
        'pr.product_id'
      )
      .select('products.*', 'categories.name as category_name', 'pr.average_rating', 'pr.review_count')
      .orderBy(`products.${sortField}`, order)
      .limit(limit)
      .offset(offset);

    return {
      products,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
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
    const whereClause = { 'product_reviews.product_id': productId, 'product_reviews.status': 'approved' };
    const [reviews, countResult] = await Promise.all([
      knex('product_reviews')
        .leftJoin('users', 'product_reviews.user_id', 'users.id')
        .where(whereClause)
        .select('product_reviews.*', 'users.name as user_name')
        .orderBy('product_reviews.created_at', 'desc')
        .limit(limit)
        .offset(offset),
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

  static async getAllReviews(options = {}) {
    const { page = 1, limit = 20, status, productId } = options;
    const offset = (page - 1) * limit;
    const query = knex('product_reviews')
      .leftJoin('products', 'product_reviews.product_id', 'products.id')
      .leftJoin('users', 'product_reviews.user_id', 'users.id');

    if (status) query.where('product_reviews.status', status);
    if (productId) query.where('product_reviews.product_id', productId);

    const [{ count }] = await query.clone().count('* as count');
    const reviews = await query
      .clone()
      .select(
        'product_reviews.*',
        'products.name as product_name',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('product_reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const reviewIds = reviews.map((r) => r.review_id);
    const mediaItems = reviewIds.length > 0 ? await this.getReviewImagesByReviewIds(reviewIds) : [];
    const mediaByReviewId = {};
    for (const item of mediaItems) {
      if (!mediaByReviewId[item.review_id]) mediaByReviewId[item.review_id] = [];
      mediaByReviewId[item.review_id].push(item);
    }
    const reviewsWithMedia = reviews.map((r) => ({
      ...r,
      media: mediaByReviewId[r.review_id] || []
    }));

    return {
      reviews: reviewsWithMedia,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit)
      }
    };
  }

  static async updateReview(reviewId, data) {
    const sanitized = sanitizeObject(data);
    sanitized.updated_at = knex.fn.now();
    const [review] = await knex('product_reviews')
      .where({ review_id: reviewId })
      .update(sanitized)
      .returning('*');
    return review;
  }

  static async deleteReview(reviewId) {
    return knex('product_reviews').where({ review_id: reviewId }).del();
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

  static async setReviewImages(reviewId, media) {
    if (!Array.isArray(media) || media.length === 0) return [];
    const rows = media.slice(0, 5).map((item, index) => ({
      review_id: reviewId,
      url: typeof item === 'string' ? item : item.url || item,
      type: (typeof item === 'object' && item.type) ? item.type : 'image',
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

  static async getOccasions(productId) {
    return knex('product_occasions')
      .join('occasions', 'product_occasions.occasion_id', 'occasions.id')
      .where('product_occasions.product_id', productId)
      .select('occasions.*');
  }

  static async setOccasions(productId, occasionIds) {
    if (!Array.isArray(occasionIds)) return [];
    
    await knex('product_occasions').where({ product_id: productId }).del();
    
    if (occasionIds.length === 0) return [];
    
    const rows = occasionIds.map(occId => ({
      product_id: productId,
      occasion_id: parseInt(occId, 10)
    }));
    
    return knex('product_occasions').insert(rows).returning('*');
  }

  static async getCollections(productId) {
    return knex('product_collections')
      .join('collections', 'product_collections.collection_id', 'collections.id')
      .where('product_collections.product_id', productId)
      .select('collections.*');
  }

  static async setCollections(productId, collectionIds) {
    if (!Array.isArray(collectionIds)) return [];
    
    await knex('product_collections').where({ product_id: productId }).del();
    
    if (collectionIds.length === 0) return [];
    
    const rows = collectionIds.map(collId => ({
      product_id: productId,
      collection_id: parseInt(collId, 10)
    }));
    
    return knex('product_collections').insert(rows).returning('*');
  }
}

module.exports = ProductModel;
