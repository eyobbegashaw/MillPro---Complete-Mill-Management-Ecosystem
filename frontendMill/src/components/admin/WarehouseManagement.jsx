import React, { useState, useEffect } from 'react';
import { FaPlus, FaDownload, FaEdit, FaTrash, FaSearch, FaSeedling, FaLeaf, FaSpice } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency, formatNumber } from '../../utils/helpers';

const WarehouseManagement = () => {
  const [warehouse, setWarehouse] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    purchasePrice: '',
    sellPrice: '',
    totalQuantity: '',
    alertLevel: '',
    description: ''
  });

  const { showToast } = useNotification();

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = () => {
    const usersData = getUsers();
    setWarehouse(usersData.warehouse || {});
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    if (!usersData.warehouse) usersData.warehouse = {};

    usersData.warehouse[formData.itemName] = {
      category: formData.category,
      purchasePrice: parseFloat(formData.purchasePrice),
      sellPrice: parseFloat(formData.sellPrice),
      quantity: parseFloat(formData.totalQuantity),
      alertLevel: parseFloat(formData.alertLevel),
      description: formData.description,
      lastUpdated: new Date().toISOString()
    };

    saveUsers(usersData);

    setShowAddForm(false);
    setFormData({
      itemName: '',
      category: '',
      purchasePrice: '',
      sellPrice: '',
      totalQuantity: '',
      alertLevel: '',
      description: ''
    });
    loadWarehouseData();
    showToast('Item added to warehouse successfully!', 'success');
  };

  const handleDelete = (itemName) => {
    if (window.confirm(`Are you sure you want to delete ${itemName} from warehouse?`)) {
      const usersData = getUsers();
      if (usersData.warehouse && usersData.warehouse[itemName]) {
        delete usersData.warehouse[itemName];
        saveUsers(usersData);
        loadWarehouseData();
        showToast(`${itemName} deleted from warehouse!`, 'success');
      }
    }
  };

  const handleExport = () => {
    const csv = [
      'Item Name,Category,Quantity (kg),Purchase Price,Sell Price,Total Investment,Alert Level,Status',
      ...Object.entries(warehouse).map(([name, item]) => {
        const totalInvestment = (item.quantity || 0) * (item.purchasePrice || 0);
        const status = (item.quantity || 0) < (item.alertLevel || 0) ? 'Low Stock' : 'In Stock';
        return `"${name}","${item.category || ''}",${item.quantity || 0},${item.purchasePrice || 0},${item.sellPrice || 0},${totalInvestment},${item.alertLevel || 0},"${status}"`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Warehouse data exported successfully!', 'success');
  };

  const calculateSummary = () => {
    let totalInvestment = 0;
    let totalWeight = 0;
    let lowStockCount = 0;
    let totalItems = Object.keys(warehouse).length;

    Object.values(warehouse).forEach(item => {
      totalInvestment += (item.quantity || 0) * (item.purchasePrice || 0);
      totalWeight += item.quantity || 0;
      if ((item.quantity || 0) < (item.alertLevel || 0)) {
        lowStockCount++;
      }
    });

    return { totalInvestment, totalWeight, lowStockCount, totalItems };
  };

  const filteredItems = Object.entries(warehouse).filter(([name, item]) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const summary = calculateSummary();

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Grain': return <FaSeedling />;
      case 'Legume': return <FaLeaf />;
      default: return <FaSpice />;
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>Warehouse Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <FaPlus /> Add New Item
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <FaDownload /> Export Data
          </button>
        </div>
      </div>

      {/* Warehouse Summary */}
      <div className="warehouse-summary">
        <div className="summary-card">
          <h4>Total Investment</h4>
          <h2>{formatCurrency(summary.totalInvestment)}</h2>
          <p>Current warehouse value</p>
        </div>
        <div className="summary-card">
          <h4>Low Stock Items</h4>
          <h2>{summary.lowStockCount}</h2>
          <p>Items below alert level</p>
        </div>
        <div className="summary-card">
          <h4>Total Items</h4>
          <h2>{summary.totalItems}</h2>
          <p>Different products</p>
        </div>
        <div className="summary-card">
          <h4>Total Weight</h4>
          <h2>{formatNumber(summary.totalWeight)} kg</h2>
          <p>Current inventory weight</p>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="form-card">
          <h3>Add New Item to Warehouse</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="itemName">Item Name *</label>
                <input type="text" id="itemName" value={formData.itemName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="itemCategory">Category *</label>
                <select id="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="">Select Category</option>
                  <option value="Grain">Grain</option>
                  <option value="Legume">Legume</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="purchasePrice">Purchase Price (Birr/kg) *</label>
                <input type="number" id="purchasePrice" step="0.01" value={formData.purchasePrice} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="sellPrice">Sell Price (Birr/kg) *</label>
                <input type="number" id="sellPrice" step="0.01" value={formData.sellPrice} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalQuantity">Total Quantity (kg) *</label>
                <input type="number" id="totalQuantity" step="0.1" value={formData.totalQuantity} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="alertLevel">Alert Level (kg) *</label>
                <input type="number" id="alertLevel" step="0.1" value={formData.alertLevel} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="itemDescription">Description</label>
              <textarea id="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Warehouse Items Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Warehouse Items</h3>
          <div className="table-controls">
            <div className="search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Grain">Grains</option>
              <option value="Legume">Legumes</option>
              <option value="Other">Others</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity (kg)</th>
                <th>Purchase Price</th>
                <th>Sell Price</th>
                <th>Total Investment</th>
                <th>Alert Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(([name, item]) => {
                const totalInvestment = (item.quantity || 0) * (item.purchasePrice || 0);
                const status = (item.quantity || 0) < (item.alertLevel || 0) ? 'Low Stock' : 'In Stock';
                
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{item.category || 'Uncategorized'}</td>
                    <td>{formatNumber(item.quantity || 0)}</td>
                    <td>{formatCurrency(item.purchasePrice || 0)}</td>
                    <td>{formatCurrency(item.sellPrice || 0)}</td>
                    <td>{formatCurrency(totalInvestment)}</td>
                    <td>{formatNumber(item.alertLevel || 0)}</td>
                    <td>
                      <span className={`status-badge ${status === 'Low Stock' ? 'status-cancelled' : 'status-completed'}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-icon btn-outline" title="Edit">
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-icon btn-danger" 
                          onClick={() => handleDelete(name)}
                          title="Delete"
                        >
                          <FaTrash />
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

      {/* Inventory by Category */}
      <div className="category-cards">
        {['Grain', 'Legume', 'Other'].map(category => {
          const items = Object.entries(warehouse).filter(([_, item]) => item.category === category);
          
          return (
            <div className="category-card" key={category}>
              <h4>
                {getCategoryIcon(category)} {category}s
              </h4>
              <div className="category-items">
                {items.map(([name, item]) => {
                  const percentage = Math.min((item.quantity / item.alertLevel) * 100, 100);
                  
                  return (
                    <div className="category-item" key={name}>
                      <span>{name}</span>
                      <div className="stock-info">
                        <span>{formatNumber(item.quantity)} kg</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p>No items in this category</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default WarehouseManagement;