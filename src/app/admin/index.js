const express = require('express');
const appConfig = require('../../config/app');

const router = express.Router();

// Simple in-browser admin panel shell, authentication handled via JWT in localStorage on client side.

// Login page
router.get('/login', (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login | ' + appConfig.appName,
    apiBaseUrl: '/api/v1'
  });
});

// Dashboard page (client JS will check token and fetch data)
router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard | ' + appConfig.appName,
    apiBaseUrl: '/api/v1'
  });
});

// Products management page
router.get('/products', (req, res) => {
  res.render('admin/products/index', {
    title: 'Products | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Orders management page
router.get('/orders', (req, res) => {
  res.render('admin/orders/index', {
    title: 'Orders | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Users management page
router.get('/users', (req, res) => {
  res.render('admin/users/index', {
    title: 'Users | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Categories management page
router.get('/categories', (req, res) => {
  res.render('admin/categories/index', {
    title: 'Categories | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Genders management page
router.get('/genders', (req, res) => {
  res.render('admin/genders/index', {
    title: 'Genders | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Occasions management page
router.get('/occasions', (req, res) => {
  res.render('admin/occasions/index', {
    title: 'Occasions | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Promo Videos management page
router.get('/promos', (req, res) => {
  res.render('admin/promos/index', {
    title: 'Promo Videos | Admin',
    apiBaseUrl: '/api/v1'
  });
});

// Stories Videos management page
router.get('/stories', (req, res) => {
  res.render('admin/stories/index', {
    title: 'Style Stories | Admin',
    apiBaseUrl: '/api/v1'
  });
});

module.exports = router;


