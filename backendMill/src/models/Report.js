const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['sales', 'inventory', 'financial', 'customer', 'operator', 'delivery', 'custom'],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  dateRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  summary: {
    totalRecords: Number,
    totalAmount: Number,
    averageValue: Number,
    metadata: mongoose.Schema.Types.Mixed
  },
  charts: [{
    type: {
      type: String,
      enum: ['line', 'bar', 'pie', 'doughnut']
    },
    title: String,
    labels: [String],
    datasets: [{
      label: String,
      data: [Number],
      backgroundColor: [String]
    }]
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: String,
  fileSize: Number,
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextRun: Date,
    recipients: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate report number
reportSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Report').countDocuments();
    this.reportNumber = `RPT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Static method to generate sales report
reportSchema.statics.generateSalesReport = async function(startDate, endDate, generatedBy) {
  const Order = mongoose.model('Order');
  
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'completed'
  }).populate('customer items.product');
  
  const totalSales = orders.reduce((sum, order) => sum + order.totals.total, 0);
  const totalOrders = orders.length;
  
  // Group by date
  const dailySales = {};
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!dailySales[date]) {
      dailySales[date] = { count: 0, total: 0 };
    }
    dailySales[date].count++;
    dailySales[date].total += order.totals.total;
  });
  
  // Group by product
  const productSales = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const productName = item.name;
      if (!productSales[productName]) {
        productSales[productName] = { quantity: 0, revenue: 0 };
      }
      productSales[productName].quantity += item.quantity;
      productSales[productName].revenue += item.quantity * item.pricePerKg;
    });
  });
  
  const report = new this({
    title: `Sales Report ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    type: 'sales',
    dateRange: { start: startDate, end: endDate },
    data: { orders, dailySales, productSales },
    summary: {
      totalRecords: totalOrders,
      totalAmount: totalSales,
      averageValue: totalOrders > 0 ? totalSales / totalOrders : 0
    },
    generatedBy
  });
  
  return report.save();
};

// Static method to generate financial report
reportSchema.statics.generateFinancialReport = async function(startDate, endDate, generatedBy) {
  const Order = mongoose.model('Order');
  const Expense = mongoose.model('Expense');
  
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'completed'
  });
  
  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const report = new this({
    title: `Financial Report ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    type: 'financial',
    dateRange: { start: startDate, end: endDate },
    data: { orders, expenses },
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    },
    generatedBy
  });
  
  return report.save();
};

module.exports = mongoose.model('Report', reportSchema);