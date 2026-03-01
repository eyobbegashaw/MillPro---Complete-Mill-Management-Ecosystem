const Product = require('../models/Product');
const User = require('../models/User');
const fileService = require('../services/fileService');
const notificationService = require('../services/notificationService');
const { PRODUCT_CATEGORIES, QUALITY_GRADES, HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const Helper = require('../utils/helper');
const ValidationUtils = require('../utils/validation');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      minPrice, 
      maxPrice,
      quality,
      featured,
      inStock,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      if (category === 'all') {
        // No filter
      } else if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by quality
    if (quality) {
      query.quality = quality;
    }

    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }

    // Filter by stock
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Only show posted products to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.posted = true;
    }

    // Build sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Product.countDocuments(query);

    // Get categories with counts for filters
    const categories = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: products,
      filters: {
        categories: categories.map(c => ({
          name: c._id,
          count: c.count
        })),
        priceRange: await Product.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              min: { $min: '$price' },
              max: { $max: '$price' }
            }
          }
        ]).then(r => r[0] || { min: 0, max: 0 }),
        qualities: QUALITY_GRADES
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('ratings.user', 'name profilePicture');

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Only show posted products to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      if (!product.posted) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
        });
      }
    }

    // Get related products (same category)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      posted: true
    }).limit(4);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: product,
      related: relatedProducts
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Validate required fields
    const validationErrors = [];
    if (!productData.name) validationErrors.push('Name is required');
    if (!productData.category) validationErrors.push('Category is required');
    if (!productData.price) validationErrors.push('Price is required');
    if (productData.price <= 0) validationErrors.push('Price must be greater than 0');

    if (validationErrors.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if product with same name exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${productData.name}$`, 'i') }
    });

    if (existingProduct) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageData = await fileService.saveImage(file, 'products', {
          resize: { width: 800, height: 800 },
          quality: 80,
          createThumbnail: true
        });
        images.push(imageData.filePath);
      }
    }

    // Create product
    const product = new Product({
      ...productData,
      images,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();

    // Notify relevant users about new product
    if (product.posted) {
      const customers = await User.find({ 
        role: 'customer',
        'preferences.notifications.productUpdates': true 
      }).select('_id');

      await notificationService.createBulkNotifications(
        customers.map(customer => ({
          userId: customer._id,
          title: 'New Product Available',
          message: `Check out our new product: ${product.name}`,
          type: 'promotion',
          data: { productId: product._id, productName: product.name }
        }))
      );
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_ADDED,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Check if name is being changed and if new name already exists
    if (updates.name && updates.name.toLowerCase() !== product.name.toLowerCase()) {
      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${updates.name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingProduct) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const imageData = await fileService.saveImage(file, 'products', {
          resize: { width: 800, height: 800 },
          quality: 80,
          createThumbnail: true
        });
        newImages.push(imageData.filePath);
      }

      // Append or replace images based on request
      if (updates.imageAction === 'replace') {
        // Delete old images
        for (const image of product.images) {
          await fileService.deleteFile(image);
        }
        updates.images = newImages;
      } else {
        updates.images = [...product.images, ...newImages];
      }
    }

    // Handle image deletions
    if (updates.removeImages && Array.isArray(updates.removeImages)) {
      for (const imageUrl of updates.removeImages) {
        await fileService.deleteFile(imageUrl);
      }
      updates.images = product.images.filter(img => !updates.removeImages.includes(img));
    }

    updates.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Check if product has any pending orders
    const Order = require('../models/Order');
    const hasPendingOrders = await Order.exists({
      'items.product': id,
      status: { $in: ['pending', 'processing'] }
    });

    if (hasPendingOrders) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete product with pending orders'
      });
    }

    // Delete product images
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await fileService.deleteFile(image);
      }
    }

    await product.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_DELETED
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Toggle product post status
exports.togglePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    product.posted = !product.posted;
    product.updatedAt = new Date();
    await product.save();

    // Notify customers if product is posted
    if (product.posted) {
      const customers = await User.find({ 
        role: 'customer',
        'preferences.notifications.productUpdates': true,
        'favorites.product': product._id
      }).select('_id');

      await notificationService.createBulkNotifications(
        customers.map(customer => ({
          userId: customer._id,
          title: 'Product Now Available',
          message: `${product.name} is now available for order!`,
          type: 'promotion',
          data: { productId: product._id, productName: product.name }
        }))
      );
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Product ${product.posted ? 'posted' : 'unposted'} successfully`,
      data: { posted: product.posted }
    });
  } catch (error) {
    console.error('Toggle post error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Toggle featured status
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    product.featured = !product.featured;
    product.updatedAt = new Date();
    await product.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully`,
      data: { featured: product.featured }
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { posted: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          products: { $push: '$$ROOT' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          image: { $arrayElemAt: ['$products.images', 0] },
          minPrice: 1,
          maxPrice: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q, 'i');

    const products = await Product.find({
      $and: [
        { posted: true },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { tags: { $in: [searchRegex] } },
            { origin: searchRegex },
            { quality: searchRegex }
          ]
        }
      ]
    })
      .sort({ 
        featured: -1,
        averageRating: -1,
        createdAt: -1 
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments({
      $and: [
        { posted: true },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { tags: { $in: [searchRegex] } },
            { origin: searchRegex },
            { quality: searchRegex }
          ]
        }
      ]
    });

    // Get search suggestions
    const suggestions = await Product.aggregate([
      { $match: { posted: true, name: searchRegex } },
      { $sample: { size: 5 } },
      { $project: { name: 1, category: 1, _id: 1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: products,
      suggestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Add rating/review
exports.addRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Check if user has purchased this product
    const Order = require('../models/Order');
    const hasPurchased = await Order.exists({
      customer: req.user.id,
      'items.product': id,
      status: 'delivered'
    });

    if (!hasPurchased) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    await product.addRating(req.user.id, rating, review);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: product.averageRating,
        totalReviews: product.totalReviews
      }
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Get product stats (admin only)
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                averagePrice: { $avg: '$price' },
                totalStock: { $sum: '$stock' },
                totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
                lowStock: {
                  $sum: { $cond: [{ $lt: ['$stock', '$alertLevel'] }, 1, 0] }
                },
                outOfStock: {
                  $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                }
              }
            },
            { $sort: { count: -1 } }
          ],
          byQuality: [
            {
              $group: {
                _id: '$quality',
                count: { $sum: 1 },
                averagePrice: { $avg: '$price' }
              }
            }
          ],
          overview: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$stock' },
                totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
                averageRating: { $avg: '$averageRating' },
                postedCount: { $sum: { $cond: ['$posted', 1, 0] } },
                featuredCount: { $sum: { $cond: ['$featured', 1, 0] } },
                lowStockCount: {
                  $sum: { $cond: [{ $lt: ['$stock', '$alertLevel'] }, 1, 0] }
                },
                outOfStockCount: {
                  $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                }
              }
            }
          ],
          recentActivity: [
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                name: 1,
                price: 1,
                stock: 1,
                updatedAt: 1
              }
            }
          ]
        }
      }
    ]);

    // Get top selling products
    const Order = require('../models/Order');
    const topSelling = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.pricePerKg'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          totalSold: 1,
          revenue: 1,
          orderCount: 1
        }
      }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...stats[0],
        topSelling
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Bulk update products (admin only)
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const operations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { 
          $set: {
            ...update.data,
            updatedAt: new Date()
          }
        }
      }
    }));

    const result = await Product.bulkWrite(operations);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Import products (admin only)
exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Products array is required'
      });
    }

    // Validate each product
    const validProducts = [];
    const errors = [];

    for (const [index, product] of products.entries()) {
      const validationErrors = [];

      if (!product.name) validationErrors.push('Name is required');
      if (!product.category) validationErrors.push('Category is required');
      if (!product.price) validationErrors.push('Price is required');
      if (product.price <= 0) validationErrors.push('Price must be greater than 0');

      if (validationErrors.length > 0) {
        errors.push({
          index,
          product: product.name || 'Unknown',
          errors: validationErrors
        });
      } else {
        validProducts.push({
          ...product,
          createdBy: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (validProducts.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No valid products to import',
        errors
      });
    }

    const createdProducts = await Product.insertMany(validProducts);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Imported ${createdProducts.length} products`,
      data: {
        imported: createdProducts.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Export products (admin only)
exports.exportProducts = async (req, res) => {
  try {
    const { format = 'json', category, inStock } = req.query;

    const query = {};
    if (category) query.category = category;
    if (inStock === 'true') query.stock = { $gt: 0 };

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .lean();

    const exportData = products.map(p => ({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      millingFee: p.millingFee,
      minQuantity: p.minQuantity,
      quality: p.quality,
      origin: p.origin,
      description: p.description,
      posted: p.posted,
      featured: p.featured,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    if (format === 'csv') {
      const csv = Helper.toCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      return res.send(csv);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export products error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Get low stock alerts (admin only)
exports.getLowStockAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lt: ['$stock', '$alertLevel'] }
    }).select('name category stock alertLevel images');

    const outOfStockProducts = await Product.find({
      stock: 0
    }).select('name category stock images');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        totalLowStock: lowStockProducts.length,
        totalOutOfStock: outOfStockProducts.length
      }
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id)
      .select('ratings averageRating totalReviews');

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Paginate reviews
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    const reviews = product.ratings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    // Populate user details
    await Product.populate(reviews, {
      path: 'user',
      select: 'name profilePicture'
    });

    // Calculate rating distribution
    const distribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    product.ratings.forEach(r => {
      distribution[r.rating]++;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        reviews,
        summary: {
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          distribution
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: product.totalReviews,
        pages: Math.ceil(product.totalReviews / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};

// Clone product (admin only)
exports.cloneProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ValidationUtils.objectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const sourceProduct = await Product.findById(id);

    if (!sourceProduct) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    // Create clone with modified name
    const cloneData = sourceProduct.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.averageRating;
    delete cloneData.totalReviews;
    delete cloneData.ratings;

    cloneData.name = `${sourceProduct.name} (Copy)`;
    cloneData.posted = false;
    cloneData.featured = false;
    cloneData.createdBy = req.user.id;

    const clonedProduct = new Product(cloneData);
    await clonedProduct.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Product cloned successfully',
      data: clonedProduct
    });
  } catch (error) {
    console.error('Clone product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    });
  }
};