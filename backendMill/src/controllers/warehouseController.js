const WarehouseItem = require('../models/Warehouse');
const Notification = require('../models/Notification');
const { WarehouseTransaction } = require('../models/WarehouseTransaction');
const { Product } = require('../models/Product');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../services/fileService');
const { Parser } = require('json2csv');

// Get all warehouse items
exports.getAllItems = async (req, res) => {
  try {
    const items = await WarehouseItem.find().sort('name');
    
    res.json({
      success: true,
      items
    });
    
  } catch (error) {
    console.error('Get warehouse items error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch warehouse items' 
    });
  }
};

// Add new item
exports.addItem = async (req, res) => {
  try {
    const itemData = req.body;
    
    const existingItem = await WarehouseItem.findOne({ name: itemData.name });
    
    if (existingItem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item already exists' 
      });
    }
    
    const item = new WarehouseItem({
      ...itemData,
      transactions: [{
        type: 'in',
        quantity: itemData.quantity,
        newQuantity: itemData.quantity,
        reason: 'Initial stock',
        performedBy: req.user.id
      }]
    });
    
    await item.save();
    
    res.status(201).json({
      success: true,
      item
    });
    
  } catch (error) {
    console.error('Add warehouse item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add item' 
    });
  }
};

// Update item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason, reference } = req.body;
    
    const item = await WarehouseItem.findById(id);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }
    
    const previousQuantity = item.quantity;
    let newQuantity;
    
    if (type === 'in') {
      newQuantity = item.quantity + quantity;
    } else if (type === 'out') {
      newQuantity = Math.max(0, item.quantity - quantity);
    } else {
      newQuantity = quantity; // adjustment
    }
    
    item.quantity = newQuantity;
    item.transactions.push({
      type,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      reference,
      performedBy: req.user.id,
      date: new Date()
    });
    
    await item.save();
    
    // Check if low stock and notify
    if (item.isLowStock()) {
      const notification = new Notification({
        title: 'Low Stock Alert',
        message: `${item.name} is low in stock (${item.quantity} ${item.unit} remaining)`,
        type: 'inventory',
        priority: 'high',
        data: { itemId: item._id }
      });
      await notification.save();
      
      // Emit to admin/operators
      req.app.get('io').emit('low-stock-alert', {
        itemId: item._id,
        itemName: item.name,
        quantity: item.quantity,
        alertLevel: item.alertLevel
      });
    }
    
    res.json({
      success: true,
      item
    });
    
  } catch (error) {
    console.error('Update warehouse quantity error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update quantity' 
    });
  }
};

// Process order inventory deduction
exports.deductOrderInventory = async (order) => {
  try {
    const deductions = [];
    
    for (const item of order.items) {
      const warehouseItem = await WarehouseItem.findOne({ 
        name: item.name 
      });
      
      if (!warehouseItem) {
        throw new Error(`Warehouse item not found: ${item.name}`);
      }
      
      if (warehouseItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
      
      warehouseItem.quantity -= item.quantity;
      warehouseItem.transactions.push({
        type: 'out',
        quantity: item.quantity,
        previousQuantity: warehouseItem.quantity + item.quantity,
        newQuantity: warehouseItem.quantity,
        reason: 'Order fulfillment',
        reference: `Order #${order.orderNumber}`,
        date: new Date()
      });
      
      await warehouseItem.save();
      deductions.push(warehouseItem);
      
      // Check for low stock after deduction
      if (warehouseItem.isLowStock()) {
        const notification = new Notification({
          title: 'Low Stock Alert',
          message: `${warehouseItem.name} is low in stock after order #${order.orderNumber}`,
          type: 'inventory',
          priority: 'high',
          data: { itemId: warehouseItem._id, orderId: order._id }
        });
        await notification.save();
      }
    }
    
    return deductions;
    
  } catch (error) {
    console.error('Deduct inventory error:', error);
    throw error;
  }
};

 
 


/**
 * Get all warehouse items with filtering and pagination
 */
exports.getItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minQuantity,
      maxQuantity,
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minQuantity || maxQuantity) {
      query.quantity = {};
      if (minQuantity) query.quantity.$gte = parseFloat(minQuantity);
      if (maxQuantity) query.quantity.$lte = parseFloat(maxQuantity);
    }

    if (lowStock === 'true') {
      query.$expr = { $lt: ['$quantity', '$alertLevel'] };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const items = await Warehouse.find(query)
      .populate('productId', 'name price image')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Warehouse.countDocuments(query);

    // Calculate summary statistics
    const stats = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice || 0), 0),
      lowStockCount: items.filter(item => item.quantity < item.alertLevel).length
    };

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    logger.error('Get warehouse items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse items',
      error: error.message
    });
  }
};

/**
 * Get single warehouse item by ID
 */
exports.getItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Warehouse.findById(id)
      .populate('productId', 'name price image description')
      .populate('supplierId', 'name email phone')
      .populate('createdBy', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    // Get transaction history for this item
    const transactions = await WarehouseTransaction.find({ itemId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        item,
        transactions,
        stats: {
          totalIn: transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0),
          totalOut: transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0),
          currentStock: item.quantity,
          stockValue: item.quantity * item.purchasePrice
        }
      }
    });
  } catch (error) {
    logger.error('Get warehouse item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse item',
      error: error.message
    });
  }
};

/**
 * Create new warehouse item
 */
exports.createItem = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      description,
      quantity,
      unit,
      purchasePrice,
      sellingPrice,
      alertLevel,
      location,
      supplierId,
      productId,
      expiryDate,
      batchNumber,
      notes
    } = req.body;

    // Check if SKU already exists
    if (sku) {
      const existingItem = await Warehouse.findOne({ sku });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this SKU already exists'
        });
      }
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const item = await Warehouse.create({
      name,
      sku,
      category,
      description,
      quantity: parseFloat(quantity),
      unit,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      alertLevel: parseFloat(alertLevel),
      location,
      supplierId,
      productId,
      expiryDate,
      batchNumber,
      notes,
      image: imageUrl,
      createdBy: req.user.id
    });

    // Create initial transaction record
    if (quantity > 0) {
      await WarehouseTransaction.create({
        itemId: item._id,
        type: 'in',
        quantity: parseFloat(quantity),
        previousQuantity: 0,
        newQuantity: parseFloat(quantity),
        reference: 'initial_stock',
        createdBy: req.user.id,
        notes: 'Initial stock entry'
      });
    }

    logger.info(`Warehouse item created: ${name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Warehouse item created successfully',
      data: item
    });
  } catch (error) {
    logger.error('Create warehouse item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating warehouse item',
      error: error.message
    });
  }
};

/**
 * Update warehouse item
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Warehouse.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku !== item.sku) {
      const existingItem = await Warehouse.findOne({ sku: updates.sku });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this SKU already exists'
        });
      }
    }

    // Handle image upload
    if (req.file) {
      updates.image = await uploadToCloudinary(req.file);
    }

    // Track quantity changes for transaction record
    const quantityChanged = updates.quantity && updates.quantity !== item.quantity;
    const oldQuantity = item.quantity;
    const newQuantity = updates.quantity || item.quantity;

    // Update item
    const updatedItem = await Warehouse.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Create transaction record if quantity changed
    if (quantityChanged) {
      const transactionType = newQuantity > oldQuantity ? 'in' : 'out';
      await WarehouseTransaction.create({
        itemId: item._id,
        type: transactionType,
        quantity: Math.abs(newQuantity - oldQuantity),
        previousQuantity: oldQuantity,
        newQuantity,
        reference: 'manual_adjustment',
        createdBy: req.user.id,
        notes: updates.transactionNotes || 'Manual quantity adjustment'
      });
    }

    logger.info(`Warehouse item updated: ${item.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Warehouse item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    logger.error('Update warehouse item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating warehouse item',
      error: error.message
    });
  }
};

/**
 * Delete warehouse item
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Warehouse.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    // Check if item has any associated orders
    const Order = require('../models/Order');
    const hasOrders = await Order.exists({ 'items.productId': item.productId });
    
    if (hasOrders) {
      // Soft delete - just mark as inactive instead of deleting
      item.isActive = false;
      item.deletedAt = Date.now();
      item.deletedBy = req.user.id;
      await item.save();

      logger.info(`Warehouse item deactivated: ${item.name} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Warehouse item deactivated successfully'
      });
    }

    // Hard delete if no associations
    await item.deleteOne();

    // Also delete associated transactions
    await WarehouseTransaction.deleteMany({ itemId: id });

    logger.info(`Warehouse item deleted: ${item.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Warehouse item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete warehouse item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting warehouse item',
      error: error.message
    });
  }
};

/**
 * Get low stock items
 */
/**
 * Get low stock items
 */
exports.getLowStockItems = async (req, res) => {
  try {
    const { threshold } = req.query;

    // Build query for items below alert level
    const query = {
      $expr: { $lt: ['$quantity', '$alertLevel'] },
      isActive: true
    };

    // Optional custom threshold
    if (threshold) {
      query.quantity = { $lt: parseFloat(threshold) };
    }

    const items = await Warehouse.find(query)
      .populate('productId', 'name price')
      .sort({ quantity: 1 });

    // Group by severity
    const critical = items.filter(item => item.quantity === 0);
    const veryLow = items.filter(item => item.quantity > 0 && item.quantity < item.alertLevel * 0.3);
    const low = items.filter(item => item.quantity >= item.alertLevel * 0.3 && item.quantity < item.alertLevel);

    res.status(200).json({
      success: true,
      data: {
        items,
        counts: {
          total: items.length,
          critical: critical.length,
          veryLow: veryLow.length,
          low: low.length
        },
        critical,
        veryLow,
        low
      }
    });
  } catch (error) {
    logger.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
};

/**
 * Get total inventory value
 */
exports.getInventoryValue = async (req, res) => {
  try {
    const items = await Warehouse.find({ isActive: true });

    const valuation = {
      byCost: {
        total: 0,
        byCategory: {}
      },
      byPrice: {
        total: 0,
        byCategory: {}
      },
      byQuantity: {
        total: 0,
        byCategory: {}
      }
    };

    items.forEach(item => {
      const cost = item.quantity * item.purchasePrice;
      const price = item.quantity * item.sellingPrice;
      
      // Total by cost
      valuation.byCost.total += cost;
      
      // Total by selling price
      valuation.byPrice.total += price;
      
      // Total quantity
      valuation.byQuantity.total += item.quantity;

      // By category
      const category = item.category || 'Uncategorized';
      
      if (!valuation.byCost.byCategory[category]) {
        valuation.byCost.byCategory[category] = 0;
        valuation.byPrice.byCategory[category] = 0;
        valuation.byQuantity.byCategory[category] = 0;
      }
      
      valuation.byCost.byCategory[category] += cost;
      valuation.byPrice.byCategory[category] += price;
      valuation.byQuantity.byCategory[category] += item.quantity;
    });

    // Calculate potential profit
    valuation.potentialProfit = valuation.byPrice.total - valuation.byCost.total;
    valuation.profitMargin = valuation.byCost.total > 0 
      ? (valuation.potentialProfit / valuation.byCost.total) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: valuation
    });
  } catch (error) {
    logger.error('Get inventory value error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating inventory value',
      error: error.message
    });
  }
};

/**
 * Get inventory grouped by category
 */
exports.getInventoryByCategory = async (req, res) => {
  try {
    const items = await Warehouse.find({ isActive: true });

    const categories = {};

    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = {
          category,
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          uniqueProducts: new Set(),
          items: []
        };
      }

      categories[category].totalItems += 1;
      categories[category].totalQuantity += item.quantity;
      categories[category].totalValue += item.quantity * item.purchasePrice;
      if (item.productId) {
        categories[category].uniqueProducts.add(item.productId.toString());
      }
      categories[category].items.push({
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        value: item.quantity * item.purchasePrice
      });
    });

    // Convert Sets to counts
    Object.values(categories).forEach(cat => {
      cat.uniqueProducts = cat.uniqueProducts.size;
    });

    res.status(200).json({
      success: true,
      data: Object.values(categories)
    });
  } catch (error) {
    logger.error('Get inventory by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory by category',
      error: error.message
    });
  }
};

/**
 * Get transaction history
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      itemId,
      type,
      startDate,
      endDate,
      userId
    } = req.query;

    const query = {};

    if (itemId) query.itemId = itemId;
    if (type) query.type = type;
    if (userId) query.createdBy = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WarehouseTransaction.find(query)
      .populate('itemId', 'name sku')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WarehouseTransaction.countDocuments(query);

    // Calculate summary statistics
    const summary = await WarehouseTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIn: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] } },
          totalAdjustments: { $sum: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$quantity', 0] } },
          uniqueItems: { $addToSet: '$itemId' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      summary: summary[0] || { totalIn: 0, totalOut: 0, totalAdjustments: 0, uniqueItems: [] },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message
    });
  }
};

/**
 * Bulk update items (add stock, adjust prices, etc.)
 */
exports.bulkUpdateItems = async (req, res) => {
  try {
    const { updates, operation } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const item = await Warehouse.findById(update.id);
        
        if (!item) {
          results.failed.push({
            id: update.id,
            reason: 'Item not found'
          });
          continue;
        }

        let oldQuantity = item.quantity;
        let newQuantity = item.quantity;

        // Apply operation
        switch (operation) {
          case 'addStock':
            newQuantity = item.quantity + (update.quantity || 0);
            item.quantity = newQuantity;
            break;
          
          case 'removeStock':
            newQuantity = Math.max(0, item.quantity - (update.quantity || 0));
            item.quantity = newQuantity;
            break;
          
          case 'updatePrice':
            if (update.purchasePrice) item.purchasePrice = update.purchasePrice;
            if (update.sellingPrice) item.sellingPrice = update.sellingPrice;
            break;
          
          case 'updateAlertLevel':
            if (update.alertLevel) item.alertLevel = update.alertLevel;
            break;
          
          case 'updateLocation':
            if (update.location) item.location = update.location;
            break;
          
          default:
            // Direct field updates
            Object.keys(update).forEach(key => {
              if (key !== 'id' && item.schema.paths[key]) {
                item[key] = update[key];
              }
            });
        }

        item.updatedBy = req.user.id;
        await item.save();

        // Create transaction record for stock changes
        if (operation === 'addStock' || operation === 'removeStock') {
          await WarehouseTransaction.create({
            itemId: item._id,
            type: operation === 'addStock' ? 'in' : 'out',
            quantity: Math.abs(newQuantity - oldQuantity),
            previousQuantity: oldQuantity,
            newQuantity,
            reference: 'bulk_update',
            createdBy: req.user.id,
            notes: update.notes || `Bulk ${operation} operation`
          });
        }

        results.successful.push({
          id: item._id,
          name: item.name,
          updates: update
        });

      } catch (error) {
        results.failed.push({
          id: update.id,
          reason: error.message
        });
      }
    }

    logger.info(`Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`);

    res.status(200).json({
      success: true,
      message: `Updated ${results.successful.length} items, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: error.message
    });
  }
};

/**
 * Import inventory from CSV/Excel
 */
exports.importInventory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const record of records) {
      try {
        // Check if item exists by SKU or name
        const existingItem = await Warehouse.findOne({
          $or: [
            { sku: record.sku },
            { name: record.name }
          ]
        });

        const itemData = {
          name: record.name,
          sku: record.sku,
          category: record.category,
          description: record.description,
          quantity: parseFloat(record.quantity) || 0,
          unit: record.unit || 'kg',
          purchasePrice: parseFloat(record.purchasePrice) || 0,
          sellingPrice: parseFloat(record.sellingPrice) || 0,
          alertLevel: parseFloat(record.alertLevel) || 10,
          location: record.location,
          batchNumber: record.batchNumber,
          expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
          notes: record.notes,
          createdBy: req.user.id
        };

        if (existingItem) {
          // Update existing item
          await Warehouse.findByIdAndUpdate(existingItem._id, {
            ...itemData,
            updatedBy: req.user.id
          });
          results.updated++;
        } else {
          // Create new item
          await Warehouse.create(itemData);
          results.created++;
        }
      } catch (error) {
        results.skipped++;
        results.errors.push({
          record: record.name || record.sku,
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    await fs.unlink(filePath);

    logger.info(`Inventory import completed: ${results.created} created, ${results.updated} updated`);

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      data: results
    });
  } catch (error) {
    logger.error('Import inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing inventory',
      error: error.message
    });
  }
};

/**
 * Export inventory to CSV
 */
exports.exportInventory = async (req, res) => {
  try {
    const { format = 'csv', category, fields } = req.query;

    // Build query
    const query = { isActive: true };
    if (category) query.category = category;

    const items = await Warehouse.find(query)
      .populate('productId', 'name')
      .lean();

    // Define fields to export
    const exportFields = fields ? fields.split(',') : [
      'name',
      'sku',
      'category',
      'quantity',
      'unit',
      'purchasePrice',
      'sellingPrice',
      'alertLevel',
      'location',
      'batchNumber',
      'expiryDate',
      'createdAt'
    ];

    // Prepare data
    const data = items.map(item => {
      const row = {};
      exportFields.forEach(field => {
        if (field === 'productName') {
          row[field] = item.productId?.name || '';
        } else if (field === 'totalValue') {
          row[field] = item.quantity * item.purchasePrice;
        } else {
          row[field] = item[field] || '';
        }
      });
      return row;
    });

    if (format === 'csv') {
      // Generate CSV
      const json2csvParser = new Parser({ fields: exportFields });
      const csv = json2csvParser.parse(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-export-${Date.now()}.csv`);
      
      return res.status(200).send(csv);
    } else if (format === 'json') {
      return res.status(200).json({
        success: true,
        data,
        count: data.length
      });
    }

    res.status(400).json({
      success: false,
      message: 'Unsupported export format'
    });
  } catch (error) {
    logger.error('Export inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting inventory',
      error: error.message
    });
  }
};

/**
 * Get inventory statistics
 */
exports.getInventoryStats = async (req, res) => {
  try {
    const items = await Warehouse.find({ isActive: true });

    const stats = {
      total: {
        items: items.length,
        quantity: 0,
        value: 0,
        potentialRevenue: 0
      },
      byCategory: {},
      movement: {
        last7Days: { in: 0, out: 0 },
        last30Days: { in: 0, out: 0 }
      },
      alerts: {
        lowStock: 0,
        outOfStock: 0,
        expiringSoon: 0
      },
      topItems: [],
      bottomItems: []
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    items.forEach(item => {
      // Totals
      stats.total.quantity += item.quantity;
      stats.total.value += item.quantity * item.purchasePrice;
      stats.total.potentialRevenue += item.quantity * item.sellingPrice;

      // By category
      const category = item.category || 'Uncategorized';
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = {
          items: 0,
          quantity: 0,
          value: 0
        };
      }
      stats.byCategory[category].items += 1;
      stats.byCategory[category].quantity += item.quantity;
      stats.byCategory[category].value += item.quantity * item.purchasePrice;

      // Alerts
      if (item.quantity === 0) {
        stats.alerts.outOfStock++;
      } else if (item.quantity < item.alertLevel) {
        stats.alerts.lowStock++;
      }

      if (item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        stats.alerts.expiringSoon++;
      }
    });

    // Get recent transactions
    const transactions = await WarehouseTransaction.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    transactions.forEach(t => {
      if (t.createdAt >= sevenDaysAgo) {
        if (t.type === 'in') stats.movement.last7Days.in += t.quantity;
        else if (t.type === 'out') stats.movement.last7Days.out += t.quantity;
      }
      
      if (t.type === 'in') stats.movement.last30Days.in += t.quantity;
      else if (t.type === 'out') stats.movement.last30Days.out += t.quantity;
    });

    // Top and bottom items by value
    const itemsByValue = items
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        value: item.quantity * item.purchasePrice
      }))
      .sort((a, b) => b.value - a.value);

    stats.topItems = itemsByValue.slice(0, 10);
    stats.bottomItems = itemsByValue.slice(-10).reverse();

    // Calculate turnover rate
    const averageInventory = stats.total.quantity / items.length;
    stats.turnoverRate = averageInventory > 0 
      ? stats.movement.last30Days.out / averageInventory 
      : 0;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics',
      error: error.message
    });
  }
};

/**
 * Set alert level for an item
 */
exports.setAlertLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { alertLevel, notificationThreshold, notificationEmail } = req.body;

    if (!alertLevel || alertLevel < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid alert level is required'
      });
    }

    const item = await Warehouse.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    // Update alert settings
    item.alertLevel = alertLevel;
    
    if (notificationThreshold !== undefined) {
      item.notificationThreshold = notificationThreshold;
    }
    
    if (notificationEmail !== undefined) {
      item.notificationEmail = notificationEmail;
    }

    // Add to alert settings history
    if (!item.alertHistory) {
      item.alertHistory = [];
    }
    
    item.alertHistory.push({
      alertLevel,
      setBy: req.user.id,
      setAt: new Date(),
      previousLevel: item.alertLevel
    });

    await item.save();

    // Check if current stock is below new alert level
    const isLowStock = item.quantity < alertLevel;

    logger.info(`Alert level set for ${item.name}: ${alertLevel} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Alert level updated successfully',
      data: {
        itemId: item._id,
        name: item.name,
        alertLevel: item.alertLevel,
        currentStock: item.quantity,
        isLowStock,
        notificationThreshold: item.notificationThreshold,
        notificationEmail: item.notificationEmail
      }
    });
  } catch (error) {
    logger.error('Set alert level error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting alert level',
      error: error.message
    });
  }
};

/**
 * Add stock to item
 */
exports.addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, reference } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const item = await Warehouse.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    const oldQuantity = item.quantity;
    item.quantity += parseFloat(quantity);
    item.updatedBy = req.user.id;
    await item.save();

    // Create transaction record
    const transaction = await WarehouseTransaction.create({
      itemId: item._id,
      type: 'in',
      quantity: parseFloat(quantity),
      previousQuantity: oldQuantity,
      newQuantity: item.quantity,
      reference: reference || 'stock_addition',
      createdBy: req.user.id,
      notes
    });

    logger.info(`Stock added to ${item.name}: +${quantity} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: {
        item,
        transaction,
        newQuantity: item.quantity,
        previousQuantity: oldQuantity
      }
    });
  } catch (error) {
    logger.error('Add stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding stock',
      error: error.message
    });
  }
};

/**
 * Remove stock from item
 */
exports.removeStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, reference } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const item = await Warehouse.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse item not found'
      });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    const oldQuantity = item.quantity;
    item.quantity -= parseFloat(quantity);
    item.updatedBy = req.user.id;
    await item.save();

    // Create transaction record
    const transaction = await WarehouseTransaction.create({
      itemId: item._id,
      type: 'out',
      quantity: parseFloat(quantity),
      previousQuantity: oldQuantity,
      newQuantity: item.quantity,
      reference: reference || 'stock_removal',
      createdBy: req.user.id,
      notes
    });

    logger.info(`Stock removed from ${item.name}: -${quantity} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Stock removed successfully',
      data: {
        item,
        transaction,
        newQuantity: item.quantity,
        previousQuantity: oldQuantity
      }
    });
  } catch (error) {
    logger.error('Remove stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing stock',
      error: error.message
    });
  }
};

/**
 * Transfer stock between locations
 */
exports.transferStock = async (req, res) => {
  try {
    const { fromItemId, toItemId, quantity, notes } = req.body;

    if (!fromItemId || !toItemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'From item, to item, and quantity are required'
      });
    }

    // Get source and destination items
    const sourceItem = await Warehouse.findById(fromItemId);
    const destItem = await Warehouse.findById(toItemId);

    if (!sourceItem || !destItem) {
      return res.status(404).json({
        success: false,
        message: 'One or both items not found'
      });
    }

    if (sourceItem.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock in source location'
      });
    }

    // Perform transfer
    sourceItem.quantity -= parseFloat(quantity);
    destItem.quantity += parseFloat(quantity);

    sourceItem.updatedBy = req.user.id;
    destItem.updatedBy = req.user.id;

    await sourceItem.save();
    await destItem.save();

    // Create transaction records
    const outTransaction = await WarehouseTransaction.create({
      itemId: sourceItem._id,
      type: 'out',
      quantity: parseFloat(quantity),
      previousQuantity: sourceItem.quantity + parseFloat(quantity),
      newQuantity: sourceItem.quantity,
      reference: 'stock_transfer_out',
      createdBy: req.user.id,
      notes: `Transferred to ${destItem.name} - ${notes || ''}`
    });

    const inTransaction = await WarehouseTransaction.create({
      itemId: destItem._id,
      type: 'in',
      quantity: parseFloat(quantity),
      previousQuantity: destItem.quantity - parseFloat(quantity),
      newQuantity: destItem.quantity,
      reference: 'stock_transfer_in',
      createdBy: req.user.id,
      notes: `Received from ${sourceItem.name} - ${notes || ''}`
    });

    logger.info(`Stock transferred from ${sourceItem.name} to ${destItem.name}: ${quantity} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Stock transferred successfully',
      data: {
        source: {
          item: sourceItem,
          transaction: outTransaction
        },
        destination: {
          item: destItem,
          transaction: inTransaction
        },
        quantity
      }
    });
  } catch (error) {
    logger.error('Transfer stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring stock',
      error: error.message
    });
  }
};