import React, { useState, useEffect } from 'react';
import { FaEye, FaComment, FaTimes } from 'react-icons/fa';
import { getUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Modal from '../common/Modal';

const MyOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, startDate, endDate]);

  const loadOrders = () => {
    const usersData = getUsers();
    const userOrders = (usersData.orders || [])
      .filter(order => order.customerId === user?.id)
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    setOrders(userOrders);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    if (startDate) {
      filtered = filtered.filter(order => 
        new Date(order.orderDate) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(order =>
        new Date(order.orderDate) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredOrders(filtered);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const cancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const usersData = getUsers();
      const orderIndex = usersData.orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        usersData.orders[orderIndex].status = 'cancelled';
        usersData.orders[orderIndex].cancelledAt = new Date().toISOString();
        
        localStorage.setItem('millUsers', JSON.stringify(usersData));
        loadOrders();
      }
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>My Orders</h2>
        <div className="order-filters">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
        </div>
      </div>

      <div className="orders-container">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-id">Order #{order.id.toString().slice(-6)}</div>
                  <div className="order-date">{formatDate(order.orderDate)}</div>
                </div>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                </div>
              </div>
              
              <div className="order-details-grid">
                <div className="order-item-row">
                  <span className="order-item-name">{order.productName || 'Product'}</span>
                  <span className="order-item-quantity">{order.quantity || 0} kg</span>
                  <span className="order-item-price">{formatCurrency((order.pricePerKg || 0) * (order.quantity || 0))}</span>
                </div>
                {order.millingFee > 0 && (
                  <div className="order-item-row">
                    <span className="order-item-name">Milling Service</span>
                    <span className="order-item-quantity">{order.quantity || 0} kg</span>
                    <span className="order-item-price">{formatCurrency((order.millingFee || 0) * (order.quantity || 0))}</span>
                  </div>
                )}
              </div>
              
              {order.operatorName && (
                <div className="order-operator">
                  <p><strong>Assigned Operator:</strong> {order.operatorName}</p>
                  <p><strong>Contact:</strong> {order.operatorPhone || 'N/A'}</p>
                </div>
              )}
              
              <div className="order-total">
                <div>
                  <div className="order-total-label">Total Amount</div>
                  {order.orderType === 'special' && <div className="order-type">Special Order</div>}
                </div>
                <div className="order-total-amount">{formatCurrency(order.total || 0)}</div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => viewOrderDetails(order)}
                >
                  <FaEye /> View Details
                </button>
                {order.status === 'processing' && (
                  <button className="btn btn-sm btn-primary">
                    <FaComment /> Contact Operator
                  </button>
                )}
                {order.status === 'pending' && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => cancelOrder(order.id)}
                  >
                    <FaTimes /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <h3>No Orders Yet</h3>
            <p>Start shopping to place your first order!</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="order-details-modal">
            <div className="details-grid">
              <div className="detail-item">
                <strong>Order ID:</strong> #{selectedOrder.id.toString().slice(-6)}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedOrder.status}
              </div>
              <div className="detail-item">
                <strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}
              </div>
              <div className="detail-item">
                <strong>Product:</strong> {selectedOrder.productName}
              </div>
              <div className="detail-item">
                <strong>Quantity:</strong> {selectedOrder.quantity} kg
              </div>
              <div className="detail-item">
                <strong>Price per kg:</strong> {formatCurrency(selectedOrder.pricePerKg || 0)}
              </div>
              {selectedOrder.millingFee > 0 && (
                <div className="detail-item">
                  <strong>Milling Fee:</strong> {formatCurrency(selectedOrder.millingFee)}/kg
                </div>
              )}
              <div className="detail-item">
                <strong>Order Fee:</strong> 20 Birr
              </div>
              <div className="detail-item total">
                <strong>Total Amount:</strong> {formatCurrency(selectedOrder.total || 0)}
              </div>
            </div>
            
            {selectedOrder.operatorName && (
              <div className="operator-info">
                <h4>Operator Information</h4>
                <p><strong>Name:</strong> {selectedOrder.operatorName}</p>
                <p><strong>Phone:</strong> {selectedOrder.operatorPhone || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedOrder.operatorEmail || 'N/A'}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default MyOrders;