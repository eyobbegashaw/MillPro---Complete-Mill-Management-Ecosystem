import React, { useState, useEffect } from 'react';
import { FaStore, FaEye, FaSave } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';

const OfflineOrders = ({ user, onUpdate }) => {
  const [products, setProducts] = useState([]);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [formData, setFormData] = useState({
    customerType: 'walkin',
    customerName: '',
    customerPhone: '',
    orderType: 'purchase',
    productId: '',
    quantity: '',
    pricePerKg: '',
    millingFee: '',
    totalAmount: '',
    paymentMethod: '',
    paymentReference: '',
    notes: ''
  });

  const { showToast } = useNotification();

  useEffect(() => {
    loadProducts();
    loadOfflineOrders();
  }, []);

  const loadProducts = () => {
    const usersData = getUsers();
    setProducts(usersData.products || []);
  };

  const loadOfflineOrders = () => {
    const usersData = getUsers();
    const orders = (usersData.orders || [])
      .filter(order => order.type === 'offline' && order.processedBy === user?.id)
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 10);

    setOfflineOrders(orders);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === parseInt(productId));

    setFormData({
      ...formData,
      productId,
      pricePerKg: product?.price || '',
      millingFee: product?.millingFee || ''
    });
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerKg = parseFloat(formData.pricePerKg) || 0;
    const millingFee = parseFloat(formData.millingFee) || 0;
    const orderType = formData.orderType;

    let total = 0;
    if (orderType === 'purchase') {
      total = quantity * pricePerKg;
    } else if (orderType === 'milling') {
      total = quantity * millingFee;
    } else if (orderType === 'both') {
      total = quantity * (pricePerKg + millingFee);
    }

    total += 20; // Fixed order fee
    return total;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const total = calculateTotal();
    const product = products.find(p => p.id === parseInt(formData.productId));

    const orderData = {
      id: Date.now(),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      orderType: formData.orderType,
      productId: parseInt(formData.productId),
      productName: product?.name || '',
      quantity: parseFloat(formData.quantity),
      pricePerKg: parseFloat(formData.pricePerKg) || 0,
      millingFee: parseFloat(formData.millingFee) || 0,
      total: total,
      paymentMethod: formData.paymentMethod,
      paymentReference: formData.paymentReference,
      notes: formData.notes,
      status: 'completed',
      orderDate: new Date().toISOString(),
      type: 'offline',
      processedBy: user?.id,
      assignedTo: user?.id
    };

    const usersData = getUsers();
    if (!usersData.orders) usersData.orders = [];

    usersData.orders.push(orderData);

    // Update inventory for purchase orders
    if (formData.orderType !== 'milling' && product) {
      updateInventory(product.name, parseFloat(formData.quantity), usersData);
    }

    saveUsers(usersData);

    // Reset form
    setFormData({
      customerType: 'walkin',
      customerName: '',
      customerPhone: '',
      orderType: 'purchase',
      productId: '',
      quantity: '',
      pricePerKg: '',
      millingFee: '',
      totalAmount: '',
      paymentMethod: '',
      paymentReference: '',
      notes: ''
    });

    loadOfflineOrders();
    onUpdate();
    showToast('Offline order saved successfully!', 'success');
  };

  const updateInventory = (productName, quantity, usersData) => {
    const warehouse = usersData.warehouse || {};
    const itemName = Object.keys(warehouse).find(key => 
      key.toLowerCase() === productName.toLowerCase()
    );

    if (itemName && warehouse[itemName]) {
      warehouse[itemName].quantity = Math.max(0, (warehouse[itemName].quantity || 0) - quantity);
      warehouse[itemName].lastUpdated = new Date().toISOString();
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>Offline Order Processing</h2>
        <p>Record in-person orders and update inventory</p>
      </div>

      {/* Order Form */}
      <div className="offline-form-card">
        <h3><FaStore /> Record New Order</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerType">Customer Type *</label>
              <select id="customerType" value={formData.customerType} onChange={handleInputChange} required>
                <option value="walkin">Walk-in Customer</option>
                <option value="regular">Regular Customer</option>
                <option value="new">New Customer</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input 
                type="text" 
                id="customerName" 
                value={formData.customerName}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerPhone">Phone Number *</label>
              <input 
                type="tel" 
                id="customerPhone" 
                value={formData.customerPhone}
                onChange={handleInputChange}
                pattern="\+251[97]\d{8}"
                placeholder="+251911223344"
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderType">Order Type *</label>
              <select id="orderType" value={formData.orderType} onChange={handleInputChange} required>
                <option value="purchase">Product Purchase</option>
                <option value="milling">Milling Service</option>
                <option value="both">Purchase & Milling</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="form-section">
            <h4>Product Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productId">Product *</label>
                <select id="productId" value={formData.productId} onChange={handleProductChange} required>
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}/kg
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity (kg) *</label>
                <input 
                  type="number" 
                  id="quantity" 
                  step="0.1" 
                  min="0.1" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricePerKg">Price per kg *</label>
                <input 
                  type="number" 
                  id="pricePerKg" 
                  step="0.01" 
                  value={formData.pricePerKg}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="millingFee">Milling Fee per kg</label>
                <input 
                  type="number" 
                  id="millingFee" 
                  step="0.01" 
                  value={formData.millingFee}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="form-section">
            <h4>Payment Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalAmount">Total Amount *</label>
                <input 
                  type="number" 
                  id="totalAmount" 
                  step="0.01" 
                  value={calculateTotal()}
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method *</label>
                <select id="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} required>
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="cbe">CBE</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="paymentReference">Payment Reference (if any)</label>
              <input 
                type="text" 
                id="paymentReference" 
                value={formData.paymentReference}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea 
              id="notes" 
              rows="3" 
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="reset" className="btn btn-outline">Clear Form</button>
            <button type="submit" className="btn btn-primary">
              <FaSave /> Save Order
            </button>
          </div>
        </form>
      </div>

      {/* Recent Offline Orders */}
      <div className="recent-offline-orders">
        <div className="card-header">
          <h3><i className="fas fa-history"></i> Recent Offline Orders</h3>
        </div>
        <div className="table-responsive">
          <table className="offline-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offlineOrders.length > 0 ? (
                offlineOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.toString().slice(-6)}</td>
                    <td>{order.customerName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity} kg</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{order.paymentMethod}</td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    <div className="empty-state">
                      <FaStore />
                      <p>No offline orders recorded</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OfflineOrders;