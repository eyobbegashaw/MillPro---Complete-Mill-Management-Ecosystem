const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Delivery = require('../models/Delivery');

class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate Sales Report
  async generateSalesReport(startDate, endDate, format = 'pdf') {
    try {
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      })
        .populate('customer', 'name email phone')
        .populate('items.product', 'name category')
        .sort('-createdAt');

      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totals.total, 0),
        averageOrderValue: 0,
        totalItems: orders.reduce((sum, order) => 
          sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )
      };

      summary.averageOrderValue = summary.totalOrders > 0 
        ? summary.totalRevenue / summary.totalOrders 
        : 0;

      // Daily breakdown
      const dailyBreakdown = {};
      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = {
            count: 0,
            revenue: 0,
            items: 0
          };
        }
        dailyBreakdown[date].count++;
        dailyBreakdown[date].revenue += order.totals.total;
        dailyBreakdown[date].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
      });

      // Product breakdown
      const productBreakdown = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const productName = item.name;
          if (!productBreakdown[productName]) {
            productBreakdown[productName] = {
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          productBreakdown[productName].quantity += item.quantity;
          productBreakdown[productName].revenue += item.quantity * item.pricePerKg;
          productBreakdown[productName].orders++;
        });
      });

      const reportData = {
        title: 'Sales Report',
        period: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date(),
        summary,
        dailyBreakdown,
        productBreakdown,
        orders
      };

      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'sales');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'sales');
      } else if (format === 'csv') {
        return await this.generateCSVReport(reportData, 'sales');
      } else {
        return reportData;
      }
    } catch (error) {
      console.error('Generate sales report error:', error);
      throw error;
    }
  }

  // Generate Inventory Report
  async generateInventoryReport(format = 'pdf') {
    try {
      const products = await Product.find().sort('name');
      
      const summary = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, product) => sum + (product.price * product.stock), 0),
        lowStockCount: products.filter(p => p.stock <= p.alertLevel).length,
        outOfStockCount: products.filter(p => p.stock === 0).length
      };

      const categoryBreakdown = {};
      products.forEach(product => {
        if (!categoryBreakdown[product.category]) {
          categoryBreakdown[product.category] = {
            count: 0,
            value: 0,
            items: []
          };
        }
        categoryBreakdown[product.category].count++;
        categoryBreakdown[product.category].value += product.price * product.stock;
        categoryBreakdown[product.category].items.push({
          name: product.name,
          stock: product.stock,
          price: product.price,
          value: product.price * product.stock
        });
      });

      const lowStockItems = products
        .filter(p => p.stock <= p.alertLevel)
        .map(p => ({
          name: p.name,
          stock: p.stock,
          alertLevel: p.alertLevel,
          category: p.category
        }));

      const reportData = {
        title: 'Inventory Report',
        generatedAt: new Date(),
        summary,
        categoryBreakdown,
        lowStockItems,
        products
      };

      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'inventory');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'inventory');
      } else if (format === 'csv') {
        return await this.generateCSVReport(reportData, 'inventory');
      } else {
        return reportData;
      }
    } catch (error) {
      console.error('Generate inventory report error:', error);
      throw error;
    }
  }

  // Generate Financial Report
  async generateFinancialReport(startDate, endDate, format = 'pdf') {
    try {
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      });

      const expenses = await Expense.find({
        date: { $gte: startDate, $lte: endDate }
      });

      const revenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
      const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const profit = revenue - expenseTotal;

      // Daily breakdown
      const dailyBreakdown = {};
      const dates = this.getDateRange(startDate, endDate);
      
      dates.forEach(date => {
        dailyBreakdown[date] = {
          revenue: 0,
          expenses: 0,
          profit: 0
        };
      });

      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (dailyBreakdown[date]) {
          dailyBreakdown[date].revenue += order.totals.total;
          dailyBreakdown[date].profit = 
            dailyBreakdown[date].revenue - dailyBreakdown[date].expenses;
        }
      });

      expenses.forEach(expense => {
        const date = expense.date.toISOString().split('T')[0];
        if (dailyBreakdown[date]) {
          dailyBreakdown[date].expenses += expense.amount;
          dailyBreakdown[date].profit = 
            dailyBreakdown[date].revenue - dailyBreakdown[date].expenses;
        }
      });

      // Expense by category
      const expenseByCategory = {};
      expenses.forEach(expense => {
        if (!expenseByCategory[expense.category]) {
          expenseByCategory[expense.category] = {
            count: 0,
            total: 0
          };
        }
        expenseByCategory[expense.category].count++;
        expenseByCategory[expense.category].total += expense.amount;
      });

      const reportData = {
        title: 'Financial Report',
        period: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date(),
        summary: {
          totalRevenue: revenue,
          totalExpenses: expenseTotal,
          netProfit: profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
        },
        dailyBreakdown,
        expenseByCategory,
        orders: orders.length,
        expenses: expenses.length
      };

      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'financial');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'financial');
      } else if (format === 'csv') {
        return await this.generateCSVReport(reportData, 'financial');
      } else {
        return reportData;
      }
    } catch (error) {
      console.error('Generate financial report error:', error);
      throw error;
    }
  }

  // Generate Customer Report
  async generateCustomerReport(startDate, endDate, format = 'pdf') {
    try {
      const customers = await User.find({ role: 'customer' })
        .populate({
          path: 'orders',
          match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        });

      const customerData = customers.map(customer => {
        const customerOrders = customer.orders || [];
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
        
        return {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          registeredAt: customer.createdAt,
          ordersCount: customerOrders.length,
          totalSpent,
          averageOrderValue: customerOrders.length > 0 ? totalSpent / customerOrders.length : 0
        };
      }).sort((a, b) => b.totalSpent - a.totalSpent);

      const summary = {
        totalCustomers: customers.length,
        activeCustomers: customerData.filter(c => c.ordersCount > 0).length,
        totalRevenue: customerData.reduce((sum, c) => sum + c.totalSpent, 0),
        averageSpentPerCustomer: customerData.length > 0 
          ? customerData.reduce((sum, c) => sum + c.totalSpent, 0) / customerData.length 
          : 0
      };

      const reportData = {
        title: 'Customer Report',
        period: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date(),
        summary,
        customers: customerData
      };

      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'customer');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'customer');
      } else if (format === 'csv') {
        return await this.generateCSVReport(reportData, 'customer');
      } else {
        return reportData;
      }
    } catch (error) {
      console.error('Generate customer report error:', error);
      throw error;
    }
  }

  // Generate Delivery Report
  async generateDeliveryReport(startDate, endDate, format = 'pdf') {
    try {
      const deliveries = await Delivery.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
        .populate('driver', 'name')
        .populate({
          path: 'order',
          select: 'orderNumber customer items totals'
        });

      const summary = {
        totalDeliveries: deliveries.length,
        completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
        failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
        averageDeliveryTime: 0,
        totalDistance: deliveries.reduce((sum, d) => sum + (d.distance || 0), 0)
      };

      // Calculate average delivery time
      const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
      if (completedDeliveries.length > 0) {
        const totalTime = completedDeliveries.reduce((sum, d) => {
          if (d.actualDeliveryTime && d.actualPickupTime) {
            return sum + (new Date(d.actualDeliveryTime) - new Date(d.actualPickupTime));
          }
          return sum;
        }, 0);
        summary.averageDeliveryTime = totalTime / completedDeliveries.length / (1000 * 60); // in minutes
      }

      // Driver performance
      const driverPerformance = {};
      deliveries.forEach(delivery => {
        if (delivery.driver) {
          const driverId = delivery.driver._id.toString();
          if (!driverPerformance[driverId]) {
            driverPerformance[driverId] = {
              name: delivery.driver.name,
              totalDeliveries: 0,
              completedDeliveries: 0,
              totalDistance: 0
            };
          }
          driverPerformance[driverId].totalDeliveries++;
          if (delivery.status === 'delivered') {
            driverPerformance[driverId].completedDeliveries++;
          }
          driverPerformance[driverId].totalDistance += delivery.distance || 0;
        }
      });

      const reportData = {
        title: 'Delivery Report',
        period: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date(),
        summary,
        driverPerformance: Object.values(driverPerformance),
        deliveries
      };

      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'delivery');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'delivery');
      } else if (format === 'csv') {
        return await this.generateCSVReport(reportData, 'delivery');
      } else {
        return reportData;
      }
    } catch (error) {
      console.error('Generate delivery report error:', error);
      throw error;
    }
  }

  // Generate PDF Report
  async generatePDFReport(data, type) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `${type}-report-${Date.now()}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text(data.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${data.generatedAt.toLocaleString()}`, { align: 'center' });
        
        if (data.period) {
          doc.fontSize(10).text(
            `Period: ${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`,
            { align: 'center' }
          );
        }
        
        doc.moveDown();
        doc.strokeColor('#4CAF50').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Summary section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);

        if (data.summary) {
          Object.entries(data.summary).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const formattedValue = typeof value === 'number' 
              ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : value;
            doc.fontSize(11).text(`${formattedKey}: ${formattedValue}`);
          });
        }

        doc.moveDown();
        doc.strokeColor('#ddd').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Details based on report type
        if (type === 'sales' && data.productBreakdown) {
          doc.fontSize(16).text('Product Performance', { underline: true });
          doc.moveDown(0.5);
          
          Object.entries(data.productBreakdown).forEach(([product, stats]) => {
            doc.fontSize(12).text(product);
            doc.fontSize(10).text(`  Quantity Sold: ${stats.quantity} kg`);
            doc.fontSize(10).text(`  Revenue: ${stats.revenue.toFixed(2)} Birr`);
            doc.fontSize(10).text(`  Number of Orders: ${stats.orders}`);
            doc.moveDown(0.3);
          });
        }

        if (type === 'inventory' && data.lowStockItems) {
          doc.fontSize(16).text('Low Stock Alert', { underline: true });
          doc.moveDown(0.5);
          
          if (data.lowStockItems.length > 0) {
            data.lowStockItems.forEach(item => {
              doc.fontSize(11).text(
                `${item.name} (${item.category}): ${item.stock} ${item.unit} (Alert: ${item.alertLevel})`
              );
            });
          } else {
            doc.fontSize(11).text('No low stock items');
          }
        }

        if (type === 'financial' && data.dailyBreakdown) {
          doc.fontSize(16).text('Daily Breakdown', { underline: true });
          doc.moveDown(0.5);
          
          const tableTop = doc.y;
          doc.fontSize(10).text('Date', 50, tableTop);
          doc.text('Revenue', 150, tableTop);
          doc.text('Expenses', 250, tableTop);
          doc.text('Profit', 350, tableTop);
          
          doc.moveDown();
          let y = doc.y;
          
          Object.entries(data.dailyBreakdown).forEach(([date, day]) => {
            doc.fontSize(9).text(date, 50, y);
            doc.text(day.revenue.toFixed(2), 150, y);
            doc.text(day.expenses.toFixed(2), 250, y);
            doc.text(day.profit.toFixed(2), 350, y);
            y += 15;
          });
        }

        // Footer
        doc.fontSize(8).text(
          'MillPro Management System - Confidential',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve({
            filename,
            filepath,
            url: `/reports/${filename}`
          });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Excel Report
  async generateExcelReport(data, type) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(data.title);

      // Title
      worksheet.mergeCells('A1:E1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = data.title;
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };

      // Generated date
      worksheet.mergeCells('A2:E2');
      const dateRow = worksheet.getCell('A2');
      dateRow.value = `Generated: ${data.generatedAt.toLocaleString()}`;
      dateRow.alignment = { horizontal: 'center' };

      // Period if exists
      if (data.period) {
        worksheet.mergeCells('A3:E3');
        const periodRow = worksheet.getCell('A3');
        periodRow.value = `Period: ${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
        periodRow.alignment = { horizontal: 'center' };
      }

      // Summary
      worksheet.addRow([]);
      const summaryHeader = worksheet.addRow(['Summary']);
      summaryHeader.font = { bold: true, size: 14 };

      if (data.summary) {
        Object.entries(data.summary).forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const row = worksheet.addRow([formattedKey, value]);
          row.getCell(1).font = { bold: true };
        });
      }

      // Add specific data based on report type
      if (type === 'sales' && data.orders) {
        worksheet.addRow([]);
        const ordersHeader = worksheet.addRow(['Order Details']);
        ordersHeader.font = { bold: true, size: 14 };

        // Orders table
        const ordersTable = worksheet.addTable({
          name: 'Orders',
          ref: 'A10',
          headerRow: true,
          style: { 
            theme: 'TableStyleMedium2',
            showRowStripes: true
          },
          columns: [
            { name: 'Order Number', filterButton: true },
            { name: 'Customer', filterButton: true },
            { name: 'Date', filterButton: true },
            { name: 'Total', filterButton: true }
          ],
          rows: data.orders.map(order => [
            order.orderNumber,
            order.customer?.name || 'N/A',
            new Date(order.createdAt).toLocaleDateString(),
            order.totals.total
          ])
        });

        ordersTable.commit();
      }

      if (type === 'inventory' && data.products) {
        worksheet.addRow([]);
        const productsHeader = worksheet.addRow(['Inventory List']);
        productsHeader.font = { bold: true, size: 14 };

        // Products table
        const productsTable = worksheet.addTable({
          name: 'Products',
          ref: 'A10',
          headerRow: true,
          style: { 
            theme: 'TableStyleMedium2',
            showRowStripes: true
          },
          columns: [
            { name: 'Product', filterButton: true },
            { name: 'Category', filterButton: true },
            { name: 'Stock', filterButton: true },
            { name: 'Price', filterButton: true },
            { name: 'Value', filterButton: true }
          ],
          rows: data.products.map(product => [
            product.name,
            product.category,
            product.stock,
            product.price,
            product.price * product.stock
          ])
        });

        productsTable.commit();
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      const filename = `${type}-report-${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      await workbook.xlsx.writeFile(filepath);

      return {
        filename,
        filepath,
        url: `/reports/${filename}`
      };
    } catch (error) {
      console.error('Generate Excel report error:', error);
      throw error;
    }
  }

  // Generate CSV Report
  async generateCSVReport(data, type) {
    try {
      const rows = [];
      
      // Add headers
      rows.push(['Report:', data.title]);
      rows.push(['Generated:', data.generatedAt.toLocaleString()]);
      
      if (data.period) {
        rows.push(['Period:', `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`]);
      }
      
      rows.push([]);

      // Add summary
      rows.push(['SUMMARY']);
      if (data.summary) {
        Object.entries(data.summary).forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          rows.push([formattedKey, value]);
        });
      }

      rows.push([]);

      // Add specific data
      if (type === 'sales' && data.orders) {
        rows.push(['ORDER DETAILS']);
        rows.push(['Order Number', 'Customer', 'Date', 'Total', 'Status']);
        
        data.orders.forEach(order => {
          rows.push([
            order.orderNumber,
            order.customer?.name || 'N/A',
            new Date(order.createdAt).toLocaleDateString(),
            order.totals.total,
            order.status
          ]);
        });
      }

      if (type === 'inventory' && data.products) {
        rows.push(['INVENTORY LIST']);
        rows.push(['Product', 'Category', 'Stock', 'Price', 'Value']);
        
        data.products.forEach(product => {
          rows.push([
            product.name,
            product.category,
            product.stock,
            product.price,
            product.price * product.stock
          ]);
        });
      }

      if (type === 'customer' && data.customers) {
        rows.push(['CUSTOMER LIST']);
        rows.push(['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Average']);
        
        data.customers.forEach(customer => {
          rows.push([
            customer.name,
            customer.email,
            customer.phone,
            customer.ordersCount,
            customer.totalSpent,
            customer.averageOrderValue
          ]);
        });
      }

      // Convert to CSV
      const csv = rows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ).join('\n');

      const filename = `${type}-report-${Date.now()}.csv`;
      const filepath = path.join(this.reportsDir, filename);

      fs.writeFileSync(filepath, csv);

      return {
        filename,
        filepath,
        url: `/reports/${filename}`
      };
    } catch (error) {
      console.error('Generate CSV report error:', error);
      throw error;
    }
  }

  // Helper function to get date range
  getDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
}

module.exports = new ReportService();