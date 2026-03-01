const WarehouseItem = require('../models/WarehouseItem');
const Notification = require('../models/Notification');

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