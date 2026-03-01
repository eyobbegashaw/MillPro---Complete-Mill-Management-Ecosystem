const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { validatePagination } = require('../middleware/validation');
const {
  generateReport,
  getReports,
  getReport,
  deleteReport,
  downloadReport,
  scheduleReport,
  getScheduledReports,
  cancelScheduledReport,
  getReportTemplates,
  saveReportTemplate,
  generateSalesReport,
  generateInventoryReport,
  generateFinancialReport,
  generateCustomerReport,
  generateOperatorReport,
  generateDeliveryReport
} = require('../controllers/reportController');

// All report routes require admin authentication
router.use(protect);
router.use(isAdmin);

// Report generation
router.post('/generate', generateReport);
router.post('/sales', generateSalesReport);
router.post('/inventory', generateInventoryReport);
router.post('/financial', generateFinancialReport);
router.post('/customer', generateCustomerReport);
router.post('/operator', generateOperatorReport);
router.post('/delivery', generateDeliveryReport);

// Report management
router.get('/', validatePagination, getReports);
router.get('/:id', getReport);
router.delete('/:id', deleteReport);
router.get('/:id/download', downloadReport);

// Scheduled reports
router.get('/scheduled/all', getScheduledReports);
router.post('/schedule', scheduleReport);
router.delete('/schedule/:id', cancelScheduledReport);

// Templates
router.get('/templates/all', getReportTemplates);
router.post('/templates', saveReportTemplate);

module.exports = router;