const cron = require('node-cron');
const Report = require('../models/Report');
const User = require('../models/User');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

class ReportGeneratorJob {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.ensureReportsDir();
  }

  async ensureReportsDir() {
    const fs = require('fs').promises;
    try {
      await fs.access(this.reportsDir);
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true });
    }
  }

  // Schedule report generation
  scheduleReports() {
    // Daily reports at 1 AM
    cron.schedule('0 1 * * *', () => {
      console.log('Generating daily reports...');
      this.generateDailyReports();
    });

    // Weekly reports on Monday at 2 AM
    cron.schedule('0 2 * * 1', () => {
      console.log('Generating weekly reports...');
      this.generateWeeklyReports();
    });

    // Monthly reports on 1st of month at 3 AM
    cron.schedule('0 3 1 * *', () => {
      console.log('Generating monthly reports...');
      this.generateMonthlyReports();
    });

    // Quarterly reports on 1st of Jan, Apr, Jul, Oct at 4 AM
    cron.schedule('0 4 1 1,4,7,10 *', () => {
      console.log('Generating quarterly reports...');
      this.generateQuarterlyReports();
    });

    // Yearly reports on Jan 1 at 5 AM
    cron.schedule('0 5 1 1 *', () => {
      console.log('Generating yearly reports...');
      this.generateYearlyReports();
    });

    // Check for scheduled reports every hour
    cron.schedule('0 * * * *', () => {
      this.processScheduledReports();
    });

    console.log('Report generation jobs scheduled');
  }

  // Generate daily reports
  async generateDailyReports() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate sales report
      const salesReport = await reportService.generateSalesReport(
        yesterday,
        today,
        'pdf'
      );

      // Generate inventory report (full inventory, not date-based)
      const inventoryReport = await reportService.generateInventoryReport('pdf');

      // Save reports
      await this.saveReport({
        title: `Daily Sales Report - ${yesterday.toLocaleDateString()}`,
        type: 'sales',
        format: 'pdf',
        dateRange: { start: yesterday, end: today },
        data: salesReport,
        summary: salesReport.summary,
        fileUrl: salesReport.url
      });

      await this.saveReport({
        title: `Daily Inventory Report - ${today.toLocaleDateString()}`,
        type: 'inventory',
        format: 'pdf',
        data: inventoryReport,
        summary: inventoryReport.summary,
        fileUrl: inventoryReport.url
      });

      // Send to admins
      await this.sendReportsToAdmins([salesReport, inventoryReport], 'daily');

      console.log('Daily reports generated successfully');
    } catch (error) {
      console.error('Generate daily reports failed:', error);
      await this.notifyReportFailure('daily', error);
    }
  }

  // Generate weekly reports
  async generateWeeklyReports() {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate reports
      const [salesReport, financialReport, customerReport] = await Promise.all([
        reportService.generateSalesReport(lastWeek, today, 'pdf'),
        reportService.generateFinancialReport(lastWeek, today, 'pdf'),
        reportService.generateCustomerReport(lastWeek, today, 'pdf')
      ]);

      // Save reports
      await this.saveReport({
        title: `Weekly Sales Report - ${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`,
        type: 'sales',
        format: 'pdf',
        dateRange: { start: lastWeek, end: today },
        data: salesReport,
        summary: salesReport.summary,
        fileUrl: salesReport.url
      });

      await this.saveReport({
        title: `Weekly Financial Report - ${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`,
        type: 'financial',
        format: 'pdf',
        dateRange: { start: lastWeek, end: today },
        data: financialReport,
        summary: financialReport.summary,
        fileUrl: financialReport.url
      });

      await this.saveReport({
        title: `Weekly Customer Report - ${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`,
        type: 'customer',
        format: 'pdf',
        dateRange: { start: lastWeek, end: today },
        data: customerReport,
        summary: customerReport.summary,
        fileUrl: customerReport.url
      });

      // Send to admins
      await this.sendReportsToAdmins([salesReport, financialReport, customerReport], 'weekly');

      console.log('Weekly reports generated successfully');
    } catch (error) {
      console.error('Generate weekly reports failed:', error);
      await this.notifyReportFailure('weekly', error);
    }
  }

  // Generate monthly reports
  async generateMonthlyReports() {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate all report types
      const reports = await Promise.all([
        reportService.generateSalesReport(lastMonth, today, 'pdf'),
        reportService.generateFinancialReport(lastMonth, today, 'pdf'),
        reportService.generateInventoryReport('pdf'),
        reportService.generateCustomerReport(lastMonth, today, 'pdf'),
        reportService.generateDeliveryReport(lastMonth, today, 'pdf')
      ]);

      // Save reports
      const reportTypes = ['sales', 'financial', 'inventory', 'customer', 'delivery'];
      
      for (let i = 0; i < reports.length; i++) {
        await this.saveReport({
          title: `Monthly ${reportTypes[i]} Report - ${lastMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`,
          type: reportTypes[i],
          format: 'pdf',
          dateRange: reportTypes[i] !== 'inventory' ? { start: lastMonth, end: today } : undefined,
          data: reports[i],
          summary: reports[i].summary,
          fileUrl: reports[i].url
        });
      }

      // Send to admins
      await this.sendReportsToAdmins(reports, 'monthly');

      console.log('Monthly reports generated successfully');
    } catch (error) {
      console.error('Generate monthly reports failed:', error);
      await this.notifyReportFailure('monthly', error);
    }
  }

  // Generate quarterly reports
  async generateQuarterlyReports() {
    try {
      const lastQuarter = new Date();
      lastQuarter.setMonth(lastQuarter.getMonth() - 3);
      lastQuarter.setDate(1);
      lastQuarter.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate comprehensive reports
      const reports = await Promise.all([
        reportService.generateSalesReport(lastQuarter, today, 'pdf'),
        reportService.generateFinancialReport(lastQuarter, today, 'pdf'),
        reportService.generateCustomerReport(lastQuarter, today, 'pdf'),
        reportService.generateDeliveryReport(lastQuarter, today, 'pdf')
      ]);

      // Save reports with quarterly titles
      const quarter = Math.floor((today.getMonth() / 3)) + 1;
      const year = today.getFullYear();
      
      const reportTypes = ['sales', 'financial', 'customer', 'delivery'];
      
      for (let i = 0; i < reports.length; i++) {
        await this.saveReport({
          title: `Q${quarter} ${year} ${reportTypes[i]} Report`,
          type: reportTypes[i],
          format: 'pdf',
          dateRange: { start: lastQuarter, end: today },
          data: reports[i],
          summary: reports[i].summary,
          fileUrl: reports[i].url
        });
      }

      // Send to admins
      await this.sendReportsToAdmins(reports, 'quarterly');

      console.log('Quarterly reports generated successfully');
    } catch (error) {
      console.error('Generate quarterly reports failed:', error);
      await this.notifyReportFailure('quarterly', error);
    }
  }

  // Generate yearly reports
  async generateYearlyReports() {
    try {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear.setMonth(0, 1);
      lastYear.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate annual reports
      const reports = await Promise.all([
        reportService.generateSalesReport(lastYear, today, 'pdf'),
        reportService.generateFinancialReport(lastYear, today, 'pdf'),
        reportService.generateCustomerReport(lastYear, today, 'pdf'),
        reportService.generateDeliveryReport(lastYear, today, 'pdf')
      ]);

      // Save reports with yearly titles
      const year = lastYear.getFullYear();
      const reportTypes = ['sales', 'financial', 'customer', 'delivery'];
      
      for (let i = 0; i < reports.length; i++) {
        await this.saveReport({
          title: `${year} Annual ${reportTypes[i]} Report`,
          type: reportTypes[i],
          format: 'pdf',
          dateRange: { start: lastYear, end: today },
          data: reports[i],
          summary: reports[i].summary,
          fileUrl: reports[i].url
        });
      }

      // Send to admins
      await this.sendReportsToAdmins(reports, 'yearly');

      console.log('Yearly reports generated successfully');
    } catch (error) {
      console.error('Generate yearly reports failed:', error);
      await this.notifyReportFailure('yearly', error);
    }
  }

  // Process scheduled reports
  async processScheduledReports() {
    try {
      const now = new Date();
      
      // Find reports scheduled to run now
      const scheduledReports = await Report.find({
        isScheduled: true,
        'schedule.nextRun': { $lte: now }
      });

      for (const report of scheduledReports) {
        await this.generateScheduledReport(report);
      }
    } catch (error) {
      console.error('Process scheduled reports failed:', error);
    }
  }

  // Generate scheduled report
  async generateScheduledReport(scheduledReport) {
    try {
      const { type, format, schedule } = scheduledReport;
      
      // Calculate date range based on frequency
      const endDate = new Date();
      let startDate = new Date();

      switch (schedule.frequency) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Generate report
      let reportData;
      switch (type) {
        case 'sales':
          reportData = await reportService.generateSalesReport(startDate, endDate, format);
          break;
        case 'financial':
          reportData = await reportService.generateFinancialReport(startDate, endDate, format);
          break;
        case 'inventory':
          reportData = await reportService.generateInventoryReport(format);
          break;
        case 'customer':
          reportData = await reportService.generateCustomerReport(startDate, endDate, format);
          break;
        case 'delivery':
          reportData = await reportService.generateDeliveryReport(startDate, endDate, format);
          break;
      }

      // Save generated report
      const newReport = await this.saveReport({
        title: `${schedule.frequency} ${type} Report - ${startDate.toLocaleDateString()}`,
        type,
        format,
        dateRange: { start: startDate, end: endDate },
        data: reportData,
        summary: reportData.summary,
        fileUrl: reportData.url,
        generatedBy: scheduledReport.generatedBy
      });

      // Send to recipients
      if (schedule.recipients && schedule.recipients.length > 0) {
        await this.sendReportToRecipients(newReport, schedule.recipients);
      }

      // Update next run time
      scheduledReport.schedule.nextRun = this.calculateNextRun(schedule.frequency);
      await scheduledReport.save();

      console.log(`Scheduled report generated: ${newReport.title}`);
    } catch (error) {
      console.error('Generate scheduled report failed:', error);
      await this.notifyReportFailure('scheduled', error, scheduledReport);
    }
  }

  // Save report to database
  async saveReport(reportData) {
    try {
      const report = new Report(reportData);
      await report.save();
      return report;
    } catch (error) {
      console.error('Save report failed:', error);
      throw error;
    }
  }

  // Send reports to admins
  async sendReportsToAdmins(reports, period) {
    try {
      const admins = await User.find({ role: 'admin' });

      for (const admin of admins) {
        // Send notification
        await notificationService.createNotification({
          userId: admin._id,
          title: `${period.charAt(0).toUpperCase() + period.slice(1)} Reports Ready`,
          message: `${reports.length} reports have been generated for ${period} period.`,
          type: 'report',
          priority: 'medium',
          data: {
            period,
            reportCount: reports.length,
            reports: reports.map(r => ({ title: r.title, url: r.url }))
          }
        });

        // Send email with reports
        if (admin.email) {
          await emailService.sendReportNotification(admin, reports, period);
        }
      }
    } catch (error) {
      console.error('Send reports to admins failed:', error);
    }
  }

  // Send report to specific recipients
  async sendReportToRecipients(report, recipients) {
    try {
      for (const recipient of recipients) {
        // Find user by email
        const user = await User.findOne({ email: recipient });

        if (user) {
          await notificationService.createNotification({
            userId: user._id,
            title: 'Report Generated',
            message: `Report "${report.title}" is ready for download.`,
            type: 'report',
            priority: 'medium',
            data: {
              reportId: report._id,
              reportTitle: report.title,
              reportUrl: report.fileUrl
            }
          });
        }

        // Send email
        await emailService.sendReportEmail(recipient, report);
      }
    } catch (error) {
      console.error('Send report to recipients failed:', error);
    }
  }

  // Calculate next run time
  calculateNextRun(frequency) {
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

  // Notify report failure
  async notifyReportFailure(period, error, scheduledReport = null) {
    try {
      const admins = await User.find({ role: 'admin' });

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: '⚠️ Report Generation Failed',
          message: `${period.charAt(0).toUpperCase() + period.slice(1)} report generation failed: ${error.message}`,
          type: 'system',
          priority: 'high',
          data: {
            period,
            error: error.message,
            scheduledReport: scheduledReport?._id,
            timestamp: new Date()
          }
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify report failure:', notifyError);
    }
  }

  // Get report generation stats
  async getReportStats() {
    try {
      const stats = await Report.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            scheduled: {
              $sum: { $cond: ['$isScheduled', 1, 0] }
            }
          }
        }
      ]);

      const recentReports = await Report.find()
        .sort('-generatedAt')
        .limit(10)
        .populate('generatedBy', 'name email');

      const scheduledReports = await Report.find({
        isScheduled: true
      }).sort('schedule.nextRun');

      return {
        byType: stats,
        recent: recentReports,
        scheduled: scheduledReports,
        totalReports: await Report.countDocuments()
      };
    } catch (error) {
      console.error('Get report stats failed:', error);
      throw error;
    }
  }

  // Manual report generation
  async generateManualReport(type, startDate, endDate, format = 'pdf') {
    try {
      let reportData;

      switch (type) {
        case 'sales':
          reportData = await reportService.generateSalesReport(startDate, endDate, format);
          break;
        case 'financial':
          reportData = await reportService.generateFinancialReport(startDate, endDate, format);
          break;
        case 'inventory':
          reportData = await reportService.generateInventoryReport(format);
          break;
        case 'customer':
          reportData = await reportService.generateCustomerReport(startDate, endDate, format);
          break;
        case 'delivery':
          reportData = await reportService.generateDeliveryReport(startDate, endDate, format);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const report = await this.saveReport({
        title: `Manual ${type} Report - ${new Date().toLocaleDateString()}`,
        type,
        format,
        dateRange: type !== 'inventory' ? { start: startDate, end: endDate } : undefined,
        data: reportData,
        summary: reportData.summary,
        fileUrl: reportData.url
      });

      return report;
    } catch (error) {
      console.error('Generate manual report failed:', error);
      throw error;
    }
  }
}

module.exports = new ReportGeneratorJob();