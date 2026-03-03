const express = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('../../app/products/product.routes');
const userRoutes = require('../../app/users/user.routes');
const adminProductRoutes = require('../../app/products/product.admin.routes');
const categoryRoutes = require('../../app/categories/category.routes');
const adminCategoryRoutes = require('../../app/categories/category.admin.routes');
const genderRoutes = require('../../app/genders/gender.routes');
const adminGenderRoutes = require('../../app/genders/gender.admin.routes');
const occasionRoutes = require('../../app/occasions/occasion.routes');
const adminOccasionRoutes = require('../../app/occasions/occasion.admin.routes');
const adminUploadRoutes = require('../../app/admin/admin.upload.routes');
const cartRoutes = require('../../app/cart/cart.routes');
const orderRoutes = require('../../app/orders/order.routes');
const orderAdminRoutes = require('../../app/orders/order.admin.routes');
const favoriteRoutes = require('../../app/favorites/favorite.routes');
const promoRoutes = require('../../app/promos/promo.routes');
const adminPromoRoutes = require('../../app/promos/promo.admin.routes');
const router = express.Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Public website APIs
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/genders', genderRoutes);
router.use('/occasions', occasionRoutes);
router.use('/promos', promoRoutes);

// Customer APIs (authenticated)
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/favorites', favoriteRoutes);

// Admin APIs (protected with auth middleware inside route files)
router.use('/admin/products', adminProductRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/admin/genders', adminGenderRoutes);
router.use('/admin/occasions', adminOccasionRoutes);
router.use('/admin/uploads', adminUploadRoutes);
router.use('/admin/orders', orderAdminRoutes);
router.use('/admin/promos', adminPromoRoutes);

module.exports = router;

