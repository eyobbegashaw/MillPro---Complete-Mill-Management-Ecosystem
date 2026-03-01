const Report = require('../models/Report');
const reportService = require('../services/reportService');
const User = require('../models/User');

// Generate custom report
exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'pdf', filters } = req.body;

    let reportData;

    switch (type) {
      case 'sales':
        reportData = await reportService.generateSalesReport(
          new Date(startDate),
          new Date(endDate),
          format
        );
        break;
      case 'inventory':
        reportData = await reportService.generateInventoryReport(format);
        break;
      case 'financial':
        reportData = await reportService.generateFinancialReport(
          new Date(startDate),
          new Date(endDate),
          format
        );
        break;
      case 'customer':
        reportData = await reportService.generateCustomerReport(
          new Date(startDate),
          new Date(endDate),
          format
        );
        break;
      case 'delivery':
        reportData = await reportService.generateDeliveryReport(
          new Date(startDate),
          new Date(endDate),
          format
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Save report to database
    const report = new Report({
      title: reportData.title || `${type} Report`,
      type,
      format,
      dateRange: { start: startDate, end: endDate },
      filters,
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

// Generate sales report
exports.generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;

    const reportData = await reportService.generateSalesReport(
      new Date(startDate),
      new Date(endDate),
      format
    );

    const report = new Report({
      title: `Sales Report ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      type: 'sales',
      format,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report'
    });
  }
};

// Generate inventory report
exports.generateInventoryReport = async (req, res) => {
  try {
    const { format = 'pdf' } = req.body;

    const reportData = await reportService.generateInventoryReport(format);

    const report = new Report({
      title: 'Inventory Report',
      type: 'inventory',
      format,
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report'
    });
  }
};

// Generate financial report
exports.generateFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;

    const reportData = await reportService.generateFinancialReport(
      new Date(startDate),
      new Date(endDate),
      format
    );

    const report = new Report({
      title: `Financial Report ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      type: 'financial',
      format,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report'
    });
  }
};

// Generate customer report
exports.generateCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;

    const reportData = await reportService.generateCustomerReport(
      new Date(startDate),
      new Date(endDate),
      format
    );

    const report = new Report({
      title: `Customer Report ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      type: 'customer',
      format,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate customer report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer report'
    });
  }
};

// Generate operator report
exports.generateOperatorReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;

    // Get operator performance data
    const operators = await User.find({ role: 'operator' })
      .populate({
        path: 'operatorData',
        populate: {
          path: 'assignedOrders completedOrders'
        }
      });

    const reportData = {
      title: 'Operator Performance Report',
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      operators: operators.map(op => ({
        name: op.name,
        email: op.email,
        phone: op.phone,
        status: op.operatorData?.currentStatus,
        ordersProcessed: op.operatorData?.performance?.ordersProcessed || 0,
        avgProcessingTime: op.operatorData?.performance?.avgProcessingTime,
        rating: op.operatorData?.performance?.customerRating,
        completedToday: op.operatorData?.performance?.completedToday
      }))
    };

    const report = new Report({
      title: `Operator Report ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      type: 'operator',
      format,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      generatedBy: req.user.id
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate operator report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate operator report'
    });
  }
};

// Generate delivery report
exports.generateDeliveryReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;

    const reportData = await reportService.generateDeliveryReport(
      new Date(startDate),
      new Date(endDate),
      format
    );

    const report = new Report({
      title: `Delivery Report ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      type: 'delivery',
      format,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      summary: reportData.summary,
      generatedBy: req.user.id,
      fileUrl: reportData.url
    });

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate delivery report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate delivery report'
    });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort('-generatedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports'
    });
  }
};

// Get single report
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report'
    });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report'
    });
  }
};

// Download report
exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report || !report.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // In production, you would stream the file
    res.json({
      success: true,
      url: report.fileUrl
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report'
    });
  }
};

// Schedule report
exports.scheduleReport = async (req, res) => {
  try {
    const { type, frequency, recipients, format = 'pdf' } = req.body;

    const report = new Report({
      title: `${type} Report (Scheduled)`,
      type,
      format,
      isScheduled: true,
      schedule: {
        frequency,
        recipients,
        nextRun: calculateNextRun(frequency)
      },
      generatedBy: req.user.id
    });

    await report.save();

    res.json({
      success: true,
      message: 'Report scheduled successfully',
      data: report
    });
  } catch (error) {
    console.error('Schedule report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule report'
    });
  }
};

// Get scheduled reports
exports.getScheduledReports = async (req, res) => {
  try {
    const reports = await Report.find({ isScheduled: true })
      .populate('generatedBy', 'name email')
      .sort('schedule.nextRun');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled reports'
    });
  }
};

// Cancel scheduled report
exports.cancelScheduledReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report || !report.isScheduled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    report.isScheduled = false;
    await report.save();

    res.json({
      success: true,
      message: 'Scheduled report cancelled'
    });
  } catch (error) {
    console.error('Cancel scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled report'
    });
  }
};

// Get report templates
exports.getReportTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'sales-daily',
        name: 'Daily Sales Report',
        type: 'sales',
        description: 'Summary of daily sales, top products, and revenue'
      },
      {
        id: 'sales-monthly',
        name: 'Monthly Sales Report',
        type: 'sales',
        description: 'Comprehensive monthly sales analysis with trends'
      },
      {
        id: 'inventory-status',
        name: 'Inventory Status Report',
        type: 'inventory',
        description: 'Current inventory levels and low stock alerts'
      },
      {
        id: 'financial-monthly',
        name: 'Monthly Financial Report',
        type: 'financial',
        description: 'Income, expenses, and profit analysis'
      },
      {
        id: 'customer-analysis',
        name: 'Customer Analysis Report',
        type: 'customer',
        description: 'Customer behavior, spending patterns, and retention'
      },
      {
        id: 'operator-performance',
        name: 'Operator Performance Report',
        type: 'operator',
        description: 'Operator productivity and efficiency metrics'
      },
      {
        id: 'delivery-performance',
        name: 'Delivery Performance Report',
        type: 'delivery',
        description: 'Delivery times, success rates, and driver performance'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report templates'
    });
  }
};

// Save report template
exports.saveReportTemplate = async (req, res) => {
  try {
    const { name, type, config } = req.body;

    // You might want to save templates to a separate collection
    // For now, just return success

    res.json({
      success: true,
      message: 'Template saved successfully'
    });
  } catch (error) {
    console.error('Save report template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save template'
    });
  }
};

// Helper function to calculate next run date
function calculateNextRun(frequency) {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() + (7 - now.getDay()));
      now.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      now.setMonth(0, 1);
      now.setHours(0, 0, 0, 0);
      break;
  }
  
  return now;
}