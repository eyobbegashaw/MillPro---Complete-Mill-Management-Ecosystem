import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaEye, FaEnvelope } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { showToast } = useNotification();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const usersData = getUsers();
    setCustomers(usersData.customers || []);
    setOrders(usersData.orders || []);
  };

  const handleExport = () => {
    const csv = [
      'ID,Name,Phone,Email,Address,Orders,Total Spent,Status',
      ...filteredCustomers.map(customer => {
        const customerOrders = orders.filter(o => o.customerId === customer.id);
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        return `"${customer.id}","${customer.name}","${customer.phone}","${customer.email}","${customer.address || ''}",${customerOrders.length},${totalSpent},"Active"`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Customer data exported successfully!', 'success');
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone || '').includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    
    const customerOrders = orders.filter(o => o.customerId === customer.id);
    const hasOnlineActivity = customer.lastActive && 
      (new Date() - new Date(customer.lastActive)) < 300000;
    
    return matchesSearch && (
      (filterStatus === 'online' && hasOnlineActivity) ||
      (filterStatus === 'offline' && !hasOnlineActivity)
    );
  });

  return (
    <>
      <div className="section-header">
        <h2>Customer Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            <FaDownload /> Export Data
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>All Customers</h3>
          <div className="table-controls">
            <div className="search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Customers</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const customerOrders = orders.filter(o => o.customerId === customer.id);
                const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                const isOnline = customer.lastActive && 
                  (new Date() - new Date(customer.lastActive)) < 300000;

                return (
                  <tr key={customer.id}>
                    <td>#{customer.id.toString().slice(-6)}</td>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email}</td>
                    <td>{customer.address ? customer.address.substring(0, 30) + '...' : 'N/A'}</td>
                    <td>{customerOrders.length}</td>
                    <td>{formatCurrency(totalSpent)}</td>
                    <td>
                      <span className={`status-badge ${isOnline ? 'status-completed' : 'status-pending'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-icon btn-outline" title="View">
                          <FaEye />
                        </button>
                        <button className="btn btn-icon btn-outline" title="Message">
                          <FaEnvelope />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CustomerManagement;