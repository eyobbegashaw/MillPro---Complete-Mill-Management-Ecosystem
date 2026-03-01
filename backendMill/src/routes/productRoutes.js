const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isAny } = require('../middleware/roleCheck');
const { validateProduct, validateIdParam, validatePagination } = require('../middleware/validation');
const { uploadProductImage, uploadProductImages } = require('../middleware/upload');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  togglePost,
  toggleFeatured,
  getCategories,
  searchProducts,
  addRating,
  getProductStats,
  bulkUpdateProducts,
  importProducts,
  exportProducts
} = require('../controllers/productController');

// Public routes (no auth required for viewing products)
router.get('/', validatePagination, getProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/stats', getProductStats);
router.get('/:id', validateIdParam, getProduct);

// Protected routes
router.use(protect);

// Customer routes
router.post('/:id/rate', isAny, validateIdParam, addRating);

// Admin only routes
router.post('/', isAdmin, validateProduct, uploadProductImage, createProduct);
router.put('/:id', isAdmin, validateIdParam, validateProduct, uploadProductImage, updateProduct);
router.delete('/:id', isAdmin, validateIdParam, deleteProduct);
router.put('/:id/toggle-post', isAdmin, validateIdParam, togglePost);
router.put('/:id/toggle-featured', isAdmin, validateIdParam, toggleFeatured);
router.post('/bulk-update', isAdmin, bulkUpdateProducts);
router.post('/import', isAdmin, importProducts);
router.get('/export/all', isAdmin, exportProducts);
router.post('/upload-images', isAdmin, uploadProductImages, (req, res) => {
  res.json({
    success: true,
    files: req.files
  });
});

module.exports = router;