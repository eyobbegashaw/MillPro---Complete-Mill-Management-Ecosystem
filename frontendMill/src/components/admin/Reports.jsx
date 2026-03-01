import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel, FaFileCsv, FaPrint, FaChartBar } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  const { showToast } = useNotification();

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const generateReport = () => {
    const usersData = getUsers();
    let data = {};

    switch(reportType) {
      case 'sales':
        data = generateSalesReport(usersData);
        break;
      case 'inventory':
        data = generateInventoryReport(usersData);
        break;
      case 'customer':
        data = generateCustomerReport(usersData);
        break;
      case 'financial':
        data = generateFinancialReport(usersData);
        break;
    }

    setReportData(data);
    showToast('Report generated successfully!', 'success');
  };

  const generateSalesReport = (data) => {
    const orders = (data.orders || []).filter(order => {
      const orderDate = new Date(order.orderDate);
      return (!startDate || orderDate >= new Date(startDate)) &&
             (!endDate || orderDate <= new Date(endDate));
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      type: 'Sales Report',
      period: `${startDate} to ${endDate}`,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      orders: orders.slice(0, 10) // Show last 10 orders
    };
  };

  const generateInventoryReport = (data) => {
    const warehouse = data.warehouse || {};
    const items = Object.entries(warehouse).map(([name, item]) => ({
      name,
      ...item,
      totalValue: (item.quantity || 0) * (item.purchasePrice || 0)
    }));

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = items.filter(item => (item.quantity || 0) < (item.alertLevel || 0));

    return {
      type: 'Inventory Report',
      asOf: new Date().toISOString().split('T')[0],
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      items: items.sort((a, b) => b.totalValue - a.totalValue)
    };
  };

  const generateCustomerReport = (data) => {
    const customers = data.customers || [];
    const orders = data.orders || [];

    const customerStats = customers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id);
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const lastOrder = customerOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0];

      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.orderDate : null
      };
    });

    const totalCustomers = customers.length;
    const activeCustomers = customerStats.filter(c => 
      c.lastOrderDate && new Date(c.lastOrderDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      type: 'Customer Report',
      asOf: new Date().toISOString().split('T')[0],
      totalCustomers,
      activeCustomers,
      totalRevenue: customerStats.reduce((sum, c) => sum + c.totalSpent, 0),
      averageSpentPerCustomer: totalCustomers > 0 ? 
        customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0,
      customers: customerStats.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20)
    };
  };

  const generateFinancialReport = (data) => {
    const orders = data.orders || [];
    const expenses = data.expenses || [];

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      type: 'Financial Report',
      asOf: new Date().toISOString().split('T')[0],
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      revenueByMonth: calculateMonthlyTotals(orders, 'total'),
      expensesByCategory: calculateCategoryTotals(expenses, 'category', 'amount')
    };
  };

  const calculateMonthlyTotals = (items, valueKey) => {
    const months = {};
    items.forEach(item => {
      const date = new Date(item.orderDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      months[monthKey] = (months[monthKey] || 0) + (item[valueKey] || 0);
    });
    return months;
  };

  const calculateCategoryTotals = (items, categoryKey, valueKey) => {
    const categories = {};
    items.forEach(item => {
      const category = item[categoryKey] || 'Other';
      categories[category] = (categories[category] || 0) + (item[valueKey] || 0);
    });
    return categories;
  };

  const handleExport = (format) => {
    if (!reportData) {
      showToast('Please generate a report first', 'warning');
      return;
    }

    let content = '';
    let filename = `report-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      content = generateCSV(reportData);
      filename += '.csv';
    } else if (format === 'pdf') {
      showToast('PDF export coming soon!', 'info');
      return;
    } else if (format === 'excel') {
      showToast('Excel export coming soon!', 'info');
      return;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateCSV = (data) => {
    let csv = '';

    if (data.type === 'Sales Report') {
      csv = 'Order ID,Date,Customer,Product,Quantity,Total,Status\n';
      data.orders?.forEach(order => {
        csv += `"#${order.id?.toString().slice(-6)}","${formatDate(order.orderDate)}","${order.customerName || ''}","${order.productName || ''}",${order.quantity || 0},${order.total || 0},"${order.status || ''}"\n`;
      });
    }

    return csv;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="section-header">
        <h2>Reports & Analytics</h2>
        <div className="section-actions">
          <div className="date-range">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={generateReport}>
            <FaChartBar /> Generate Report
          </button>
        </div>
      </div>

      {/* Report Options */}
      <div className="report-options">
        <div className="report-type">
          <h4>Report Type</h4>
          <div className="type-options">
            <label>
              <input 
                type="radio" 
                name="reportType" 
                value="sales" 
                checked={reportType === 'sales'} 
                onChange={(e) => setReportType(e.target.value)}
              /> Sales Report
            </label>
            <label>
              <input 
                type="radio" 
                name="reportType" 
                value="inventory" 
                checked={reportType === 'inventory'} 
                onChange={(e) => setReportType(e.target.value)}
              /> Inventory Report
            </label>
            <label>
              <input 
                type="radio" 
                name="reportType" 
                value="customer" 
                checked={reportType === 'customer'} 
                onChange={(e) => setReportType(e.target.value)}
              /> Customer Report
            </label>
            <label>
              <input 
                type="radio" 
                name="reportType" 
                value="financial" 
                checked={reportType === 'financial'} 
                onChange={(e) => setReportType(e.target.value)}
              /> Financial Report
            </label>
          </div>
        </div>
        
        <div className="export-options">
          <h4>Export Format</h4>
          <div className="format-options">
            <button className="btn btn-outline" onClick={() => handleExport('pdf')}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn btn-outline" onClick={() => handleExport('excel')}>
              <FaFileExcel /> Excel
            </button>
            <button className="btn btn-outline" onClick={() => handleExport('csv')}>
              <FaFileCsv /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="report-preview">
          <div className="preview-header">
            <h3>{reportData.type}</h3>
            <button className="btn btn-sm btn-primary" onClick={handlePrint}>
              <FaPrint /> Print
            </button>
          </div>
          <div className="preview-content">
            <div className="report-summary">
              <h4>Summary</h4>
              <div className="summary-stats">
                {Object.entries(reportData).map(([key, value]) => {
                  if (typeof value === 'object' || key === 'customers' || key === 'items' || key === 'orders') return null;
                  return (
                    <div key={key} className="stat-item">
                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                      <span>{typeof value === 'number' && key.includes('Revenue') ? formatCurrency(value) : value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {reportData.items && (
              <div className="report-table">
                <h4>Inventory Items</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items.slice(0, 10).map(item => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.quantity} kg</td>
                        <td>{formatCurrency(item.totalValue)}</td>
                        <td>
                          <span className={`status-badge ${item.quantity < item.alertLevel ? 'status-cancelled' : 'status-completed'}`}>
                            {item.quantity < item.alertLevel ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportData.customers && (
              <div className="report-table">
                <h4>Top Customers</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customers.slice(0, 10).map(customer => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.orderCount}</td>
                        <td>{formatCurrency(customer.totalSpent)}</td>
                        <td>{formatDate(customer.lastOrderDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportData.orders && (
              <div className="report-table">
                <h4>Recent Orders</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id?.toString().slice(-6)}</td>
                        <td>{formatDate(order.orderDate)}</td>
                        <td>{order.customerName || ''}</td>
                        <td>{order.productName || ''}</td>
                        <td>{order.quantity || 0} kg</td>
                        <td>{formatCurrency(order.total || 0)}</td>
                        <td>
                          <span className={`status-badge status-${order.status || 'pending'}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Reports;