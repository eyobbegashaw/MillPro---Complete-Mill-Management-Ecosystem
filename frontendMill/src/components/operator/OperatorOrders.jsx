import React, { useState, useEffect } from 'react';
import { FaEye, FaBell, FaComment, FaCheckSquare, FaTimes } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Modal from '../common/Modal';

const OperatorOrders = ({ user, onUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, statusFilter, sortBy]);

  const loadOrders = () => {
    const usersData = getUsers();
    const allOrders = usersData.orders || [];
    
    const assignedOrders = allOrders.filter(order => 
      order.assignedTo === user?.id || 
      (order.assignedTo && order.assignedTo.includes(user?.id))
    );

    setOrders(assignedOrders);
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest':
          return new Date(a.orderDate) - new Date(b.orderDate);
        case 'priority':
          return (b.priority || 0) - (a.priority || 0);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
      setSelectAll(false);
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const usersData = getUsers();
    const orderIndex = usersData.orders.findIndex(o => o.id === orderId);

    if (orderIndex !== -1) {
      usersData.orders[orderIndex].status = newStatus;
      usersData.orders[orderIndex].updatedAt = new Date().toISOString();

      // Update inventory if completed
      if (newStatus === 'completed') {
        updateInventoryAfterCompletion(usersData.orders[orderIndex], usersData);
      }

      saveUsers(usersData);
      loadOrders();
      onUpdate();
      showToast('Order status updated', 'success');
    }
  };

  const updateInventoryAfterCompletion = (order, usersData) => {
    const productName = order.productName;
    if (productName && usersData.warehouse && usersData.warehouse[productName]) {
      const quantity = order.quantity || 0;
      usersData.warehouse[productName].quantity = 
        Math.max(0, (usersData.warehouse[productName].quantity || 0) - quantity);
      usersData.warehouse[productName].lastUpdated = new Date().toISOString();
    }
  };

  const handleBulkUpdate = () => {
    if (selectedOrders.length === 0) {
      showToast('Please select orders to update', 'warning');
      return;
    }

    const newStatus = prompt('Enter new status (pending, processing, completed, cancelled):');
    if (!newStatus || !['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
      showToast('Invalid status', 'error');
      return;
    }

    const usersData = getUsers();
    selectedOrders.forEach(orderId => {
      const orderIndex = usersData.orders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        usersData.orders[orderIndex].status = newStatus;
        usersData.orders[orderIndex].updatedAt = new Date().toISOString();

        if (newStatus === 'completed') {
          updateInventoryAfterCompletion(usersData.orders[orderIndex], usersData);
        }
      }
    });

    saveUsers(usersData);
    setSelectedOrders([]);
    setSelectAll(false);
    loadOrders();
    onUpdate();
    showToast(`${selectedOrders.length} orders updated to ${newStatus}`, 'success');
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const notifyCustomer = (orderId) => {
    showToast('Customer notification sent!', 'success');
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
        <div className="section-actions">
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
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">High Priority</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleBulkUpdate}>
            <FaCheckSquare /> Bulk Update
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Type</th>
              <th>Status</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const usersData = getUsers();
                const customer = usersData.customers?.find(c => c.id === order.customerId);
                
                return (
                  <tr key={order.id}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </td>
                    <td>#{order.id.toString().slice(-6)}</td>
                    <td>{customer?.name || 'Walk-in Customer'}</td>
                    <td>{order.productName || 'N/A'}</td>
                    <td>{order.quantity || 0} kg</td>
                    <td>{order.orderType || 'Purchase'}</td>
                    <td>
                      <select 
                        className="status-select"
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => viewOrderDetails(order)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => notifyCustomer(order.id)}
                          title="Notify"
                        >
                          <FaBell />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline"
                          title="Message"
                        >
                          <FaComment />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  <div className="empty-state">
                    <i className="fas fa-clipboard-list"></i>
                    <p>No orders assigned</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                <strong>Status:</strong> 
                <select 
                  className="status-select"
                  value={selectedOrder.status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder.id, e.target.value);
                    setShowDetailsModal(false);
                  }}
                  style={{ marginLeft: '1rem' }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                <strong>Total Amount:</strong> {formatCurrency(selectedOrder.total || 0)}
              </div>
            </div>

            {selectedOrder.customerId && (
              <div className="operator-info">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedOrder.address || 'N/A'}</p>
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

export default OperatorOrders;