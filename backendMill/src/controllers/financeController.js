const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const ReportService = require('../services/reportService');

// Get financial summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Get orders
    const orders = await Order.find({
      ...query,
      status: 'completed'
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
    const totalOrders = orders.length;

    // Get expenses
    const expenses = await Expense.find(query);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenseCount = expenses.length;

    // Get payments
    const payments = await Payment.find({
      ...query,
      status: 'completed'
    });

    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = payments.length;

    // Calculate profit
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          count: totalOrders,
          average: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        expenses: {
          total: totalExpenses,
          count: totalExpenseCount,
          average: totalExpenseCount > 0 ? totalExpenses / totalExpenseCount : 0
        },
        payments: {
          total: totalPayments,
          count: totalTransactions,
          average: totalTransactions > 0 ? totalPayments / totalTransactions : 0
        },
        profit: {
          net: netProfit,
          margin: profitMargin
        }
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial summary'
    });
  }
};

// Get income vs expenses
exports.getIncomeExpense = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    // Group data
    const groupedData = {};
    const dates = getDateRange(start, end, groupBy);

    dates.forEach(date => {
      groupedData[date] = {
        date,
        income: 0,
        expenses: 0,
        profit: 0
      };
    });

    // Add orders to groups
    orders.forEach(order => {
      const key = getGroupKey(order.createdAt, groupBy);
      if (groupedData[key]) {
        groupedData[key].income += order.totals.total;
      }
    });

    // Add expenses to groups
    expenses.forEach(expense => {
      const key = getGroupKey(expense.date, groupBy);
      if (groupedData[key]) {
        groupedData[key].expenses += expense.amount;
      }
    });

    // Calculate profit
    Object.values(groupedData).forEach(item => {
      item.profit = item.income - item.expenses;
    });

    res.json({
      success: true,
      data: Object.values(groupedData)
    });
  } catch (error) {
    console.error('Get income expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get income vs expenses'
    });
  }
};

// Get profit/loss report
exports.getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).populate('items.product');

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    // Calculate revenue by category
    const revenueByCategory = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product?.category || 'Other';
        if (!revenueByCategory[category]) {
          revenueByCategory[category] = 0;
        }
        revenueByCategory[category] += item.quantity * item.pricePerKg;
      });
    });

    // Calculate expenses by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += expense.amount;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // Add tax calculations if needed

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalRevenue,
          totalExpenses,
          grossProfit,
          netProfit,
          profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
        },
        revenueByCategory,
        expensesByCategory,
        orders: orders.length,
        expenses: expenses.length
      }
    });
  } catch (error) {
    console.error('Get profit loss error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit/loss report'
    });
  }
};

// Get expenses list
exports.getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, category } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort('-date')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses'
    });
  }
};

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const expense = new Expense(expenseData);
    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense'
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only allow updates if not approved
    if (expense.approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved expense'
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only allow deletion if not approved
    if (expense.approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved expense'
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

// Get expense categories
exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await Expense.distinct('category');
    
    // Get totals for each category
    const categoryTotals = await Promise.all(
      categories.map(async (category) => {
        const total = await Expense.aggregate([
          { $match: { category } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        return {
          category,
          total: total[0]?.total || 0
        };
      })
    );

    res.json({
      success: true,
      data: categoryTotals
    });
  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense categories'
    });
  }
};

// Get monthly report
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const report = await ReportService.generateFinancialReport(startDate, endDate);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report'
    });
  }
};

// Get yearly report
exports.getYearlyReport = async (req, res) => {
  try {
    const { year } = req.params;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const report = await ReportService.generateFinancialReport(startDate, endDate);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get yearly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate yearly report'
    });
  }
};

// Get tax report
exports.getTaxReport = async (req, res) => {
  try {
    const { year } = req.params;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
      taxDeductible: true
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
    const totalDeductible = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const taxableIncome = totalRevenue - totalDeductible;
    const taxRate = 0.15; // 15% tax rate
    const taxLiability = taxableIncome * taxRate;

    res.json({
      success: true,
      data: {
        year,
        totalRevenue,
        totalDeductibleExpenses: totalDeductible,
        taxableIncome,
        taxRate: taxRate * 100 + '%',
        taxLiability,
        orders: orders.length,
        deductibleExpenses: expenses.length
      }
    });
  } catch (error) {
    console.error('Get tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tax report'
    });
  }
};

// Export financial data
exports.exportFinancialData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const report = await ReportService.generateFinancialReport(start, end, format);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Export financial data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial data'
    });
  }
};

// Helper functions
function getDateRange(start, end, groupBy) {
  const dates = [];
  const current = new Date(start);
  
  while (current <= end) {
    let key;
    if (groupBy === 'month') {
      key = current.toISOString().slice(0, 7); // YYYY-MM
      current.setMonth(current.getMonth() + 1);
    } else if (groupBy === 'year') {
      key = current.getFullYear().toString();
      current.setFullYear(current.getFullYear() + 1);
    } else {
      key = current.toISOString().split('T')[0]; // YYYY-MM-DD
      current.setDate(current.getDate() + 1);
    }
    dates.push(key);
  }
  
  return dates;
}

function getGroupKey(date, groupBy) {
  const d = new Date(date);
  if (groupBy === 'month') {
    return d.toISOString().slice(0, 7);
  } else if (groupBy === 'year') {
    return d.getFullYear().toString();
  } else {
    return d.toISOString().split('T')[0];
  }
}

 
   