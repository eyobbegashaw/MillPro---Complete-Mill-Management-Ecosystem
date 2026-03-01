import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilePdf } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';

const FinanceManagement = () => {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    taxExpense: 0
  });
 
  const { showToast } = useNotification();

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = () => {
    const usersData = getUsers();
    setOrders(usersData.orders || []);
    setExpenses(usersData.expenses || []);
    
    const totalIncome = (usersData.orders || []).reduce((sum, order) => sum + (order.total || 0), 0);
    const totalExpenses = (usersData.expenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    const taxExpense = totalIncome * 0.15; // 15% tax

    setSummary({ totalIncome, totalExpenses, netProfit, taxExpense });
  };

  const incomeExpenseChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [12000, 19000, 15000, 22000, 18000, 25000],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expenses',
        data: [8000, 12000, 10000, 15000, 13000, 18000],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const profitChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Profit',
      data: [4000, 7000, 5000, 7000, 5000, 7000],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Br ' + value.toLocaleString();
          }
        }
      }
    }
  };

  const handleAddExpense = () => {
    showToast('Add expense feature coming soon!', 'info');
  };

  const handleGenerateReport = () => {
    showToast('Generate report feature coming soon!', 'info');
  };

  return (
    <>
      <div className="section-header">
        <h2>Financial Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={handleAddExpense}>
            <FaPlus /> Add Expense
          </button>
          <button className="btn btn-outline" onClick={handleGenerateReport}>
            <FaFilePdf /> Generate Report
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="finance-overview">
        <div className="finance-card income">
          <h4>Total Income</h4>
          <h2>{formatCurrency(summary.totalIncome)}</h2>
          <p>From all orders</p>
        </div>
        <div className="finance-card expense">
          <h4>Total Expenses</h4>
          <h2>{formatCurrency(summary.totalExpenses)}</h2>
          <p>Operational costs</p>
        </div>
        <div className="finance-card profit">
          <h4>Net Profit</h4>
          <h2>{formatCurrency(summary.netProfit)}</h2>
          <p>This month</p>
        </div>
        <div className="finance-card tax">
          <h4>Tax Expense</h4>
          <h2>{formatCurrency(summary.taxExpense)}</h2>
          <p>Annual</p>
        </div>
      </div>

      {/* Charts */}
      <div className="finance-charts">
        <div className="chart-card">
          <h3>Income vs Expenses</h3>
          <div className="chart-wrapper">
            <Line data={incomeExpenseChartData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Profit Trend</h3>
          <div className="chart-wrapper">
            <Line data={profitChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Recent Expenses</h3>
          <button className="btn btn-sm btn-outline">View All</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(-5).reverse().map(expense => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.date)}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.paymentMethod}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-icon btn-outline" title="View">
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">No expenses recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default FinanceManagement;