const express = require('express');
const {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  uploadLimiter,
  adminApiLimiter,
} = require('../../middlewares/rate-limit.middleware');
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
const storyRoutes = require('../../app/stories/story.routes');
const adminStoryRoutes = require('../../app/stories/story.admin.routes');
const bannerRoutes = require('../../app/banners/banner.routes');
const adminBannerRoutes = require('../../app/banners/banner.admin.routes');
const marqueeRoutes = require('../../app/marquee/marquee.routes');
const adminMarqueeRoutes = require('../../app/marquee/marquee.admin.routes');
const testimonialRoutes = require('../../app/testimonials/testimonial.routes');
const adminTestimonialRoutes = require('../../app/testimonials/testimonial.admin.routes');
const homeAdRoutes = require('../../app/home-ads/home-ad.routes');
const adminHomeAdRoutes = require('../../app/home-ads/home-ad.admin.routes');
const collectionRoutes = require('../../app/collections/collection.routes');
const adminCollectionRoutes = require('../../app/collections/collection.admin.routes');
const homeVideoRoutes = require('../../app/home-videos/home-video.routes');
const adminHomeVideoRoutes = require('../../app/home-videos/home-video.admin.routes');
const ringSizeRoutes = require('../../app/ring-sizes/ring-size.routes');
const couponRoutes = require('../../app/coupons/coupon.routes');
const adminCouponRoutes = require('../../app/coupons/coupon.admin.routes');
const adminAuthRoutes = require('../../app/admin/admin.auth.routes');


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
router.use('/stories', storyRoutes);
router.use('/banners', bannerRoutes);
router.use('/marquee', marqueeRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/home-ads', homeAdRoutes);
router.use('/collections', collectionRoutes);
router.use('/home-videos', homeVideoRoutes);
router.use('/ring-sizes', ringSizeRoutes);
router.use('/offers', couponRoutes);


// Customer APIs (authenticated)
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/favorites', favoriteRoutes);

// Admin APIs (protected with auth middleware inside route files)
router.use('/admin/uploads', uploadLimiter, adminUploadRoutes);
router.use('/admin/products', adminApiLimiter, adminProductRoutes);
router.use('/admin/categories', adminApiLimiter, adminCategoryRoutes);
router.use('/admin/genders', adminApiLimiter, adminGenderRoutes);
router.use('/admin/occasions', adminApiLimiter, adminOccasionRoutes);
router.use('/admin/orders', adminApiLimiter, orderAdminRoutes);
router.use('/admin/promos', adminApiLimiter, adminPromoRoutes);
router.use('/admin/stories', adminApiLimiter, adminStoryRoutes);
router.use('/admin/banners', adminApiLimiter, adminBannerRoutes);
router.use('/admin/marquee', adminApiLimiter, adminMarqueeRoutes);
router.use('/admin/testimonials', adminApiLimiter, adminTestimonialRoutes);
router.use('/admin/home-ads', adminApiLimiter, adminHomeAdRoutes);
router.use('/admin/collections', adminApiLimiter, adminCollectionRoutes);
router.use('/admin/home-videos', adminApiLimiter, adminHomeVideoRoutes);
router.use('/admin/ring-sizes', adminApiLimiter, ringSizeRoutes);
router.use('/admin/offers', adminApiLimiter, adminCouponRoutes);
router.use('/admin/auth', adminAuthRoutes);


module.exports = router;
