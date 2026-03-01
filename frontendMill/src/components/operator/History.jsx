import React, { useState, useEffect } from 'react';
import { FaFilter, FaDownload, FaEye, FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Modal from '../common/Modal';

const History = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    totalRevenue: 0,
    avgProcessingTime: '2.5h',
    rating: 4.5
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, startDate, endDate]);

  const loadHistory = () => {
    const usersData = getUsers();
    const allOrders = usersData.orders || [];

    // Get completed orders processed by this operator
    const completedOrders = allOrders.filter(order => 
      (order.assignedTo === user?.id || order.assignedTo?.includes(user?.id)) &&
      order.status === 'completed'
    ).sort((a, b) => new Date(b.completedDate || b.updatedAt || b.orderDate) - new Date(a.completedDate || a.updatedAt || a.orderDate));

    setOrders(completedOrders);
    calculateStats(completedOrders);
  };

  const calculateStats = (completedOrders) => {
    const totalProcessed = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    setStats(prev => ({
      ...prev,
      totalProcessed,
      totalRevenue
    }));
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (startDate) {
      filtered = filtered.filter(order => 
        new Date(order.completedDate || order.updatedAt || order.orderDate) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(order => 
        new Date(order.completedDate || order.updatedAt || order.orderDate) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    filterOrders();
    showToast('Filter applied', 'success');
  };

  const handleExport = () => {
    const csv = [
      'Order ID,Customer,Product,Quantity,Total,Order Date,Completed Date',
      ...filteredOrders.map(order => {
        const customerName = order.customerName || 'Customer';
        const productName = order.productName || 'Product';
        const orderDate = formatDate(order.orderDate);
        const completedDate = formatDate(order.completedDate || order.updatedAt);
        
        return `"#${order.id.toString().slice(-6)}","${customerName}","${productName}",${order.quantity || 0},${order.total || 0},"${orderDate}","${completedDate}"`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('History exported successfully!', 'success');
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" />);
    }

    return stars;
  };

  return (
    <>
      <div className="section-header">
        <h2>Order History</h2>
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
          <button className="btn btn-primary" onClick={handleFilter}>
            <FaFilter /> Filter
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* History Stats */}
      <div className="history-stats">
        <div className="stat-card">
          <h4>Total Orders Processed</h4>
          <h2>{stats.totalProcessed}</h2>
        </div>
        <div className="stat-card">
          <h4>Total Revenue</h4>
          <h2>{formatCurrency(stats.totalRevenue)}</h2>
        </div>
        <div className="stat-card">
          <h4>Avg. Processing Time</h4>
          <h2>{stats.avgProcessingTime}</h2>
        </div>
        <div className="stat-card">
          <h4>Customer Rating</h4>
          <div className="rating">
            {renderRatingStars(stats.rating)}
            <span>{stats.rating}</span>
          </div>
        </div>
      </div>

      {/* Order History Table */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Order Date</th>
              <th>Completed Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(order => {
                const usersData = getUsers();
                const customer = usersData.customers?.find(c => c.id === order.customerId);

                return (
                  <tr key={order.id}>
                    <td>#{order.id.toString().slice(-6)}</td>
                    <td>{customer?.name || order.customerName || 'Walk-in Customer'}</td>
                    <td>{order.productName || 'N/A'}</td>
                    <td>{order.quantity || 0} kg</td>
                    <td>{formatCurrency(order.total || 0)}</td>
                    <td>
                      <span className="status-badge status-completed">Completed</span>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{formatDate(order.completedDate || order.updatedAt)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  <div className="empty-state">
                    <i className="fas fa-history"></i>
                    <p>No history found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="pagination">
          <button 
            className="btn btn-outline" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Previous
          </button>
          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            className="btn btn-outline" 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}

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
                <strong>Status:</strong> Completed
              </div>
              <div className="detail-item">
                <strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}
              </div>
              <div className="detail-item">
                <strong>Completed Date:</strong> {formatDate(selectedOrder.completedDate || selectedOrder.updatedAt)}
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

export default History;