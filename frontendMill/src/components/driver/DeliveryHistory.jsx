import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import Pagination from '../common/Pagination';
import StatusBadge from '../common/StatusBadge';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const DeliveryHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    onTimeRate: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });

  useEffect(() => {
    loadDeliveryHistory();
  }, [pagination.page, filters]);

  const loadDeliveryHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/deliveries/history', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        }
      });

      setDeliveries(response.data.data);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Load delivery history error:', error);
      toast.error('Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const viewDeliveryDetails = (deliveryId) => {
    // Navigate to delivery details or open modal
    window.location.href = `/driver/deliveries/${deliveryId}`;
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="driver-dashboard">
      <DriverSidebar />
      
      <div className="driver-main">
        <DriverHeader />
        
        <div className="dashboard-content">
          <div className="section-header">
            <h2>Delivery History</h2>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-truck"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalDeliveries}</h3>
                <p>Total Deliveries</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-info">
                <h3>{formatCurrency(stats.totalEarnings)}</h3>
                <p>Total Earnings</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.averageRating.toFixed(1)}</h3>
                <p>Average Rating</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.onTimeRate}%</h3>
                <p>On-Time Delivery</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
                <span>to</span>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Delivery List */}
          <div className="delivery-list">
            {deliveries.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-history"></i>
                <h3>No Delivery History</h3>
                <p>You haven't completed any deliveries yet.</p>
              </div>
            ) : (
              deliveries.map(delivery => (
                <div key={delivery._id} className="delivery-history-item">
                  <div className="delivery-header">
                    <div className="delivery-info">
                      <h4>Order #{delivery.order?.orderNumber}</h4>
                      <span className="delivery-date">
                        {formatDate(delivery.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={delivery.status} />
                  </div>

                  <div className="delivery-details">
                    <div className="detail-row">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <strong>Pickup:</strong> {delivery.pickupLocation?.address}
                      </div>
                    </div>
                    <div className="detail-row">
                      <i className="fas fa-flag-checkered"></i>
                      <div>
                        <strong>Delivery:</strong> {delivery.deliveryLocation?.address}
                      </div>
                    </div>
                    <div className="detail-row">
                      <i className="fas fa-road"></i>
                      <div>
                        <strong>Distance:</strong> {delivery.distance?.toFixed(1)} km
                      </div>
                    </div>
                    <div className="detail-row">
                      <i className="fas fa-clock"></i>
                      <div>
                        <strong>Duration:</strong> {Math.round(delivery.duration)} mins
                      </div>
                    </div>
                  </div>

                  <div className="delivery-footer">
                    <div className="delivery-meta">
                      <span className="earnings">
                        <i className="fas fa-money-bill-wave"></i>
                        {formatCurrency(delivery.deliveryFee)}
                      </span>
                      {delivery.rating && (
                        <span className="rating">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${i < delivery.rating.score ? 'filled' : ''}`}
                            ></i>
                          ))}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => viewDeliveryDetails(delivery._id)}
                    >
                      View Details
                    </button>
                  </div>

                  {/* Timeline */}
                  {delivery.timeline && delivery.timeline.length > 0 && (
                    <div className="delivery-timeline">
                      <h5>Timeline</h5>
                      <div className="timeline-items">
                        {delivery.timeline.map((event, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-time">
                              {formatTime(event.timestamp)}
                            </div>
                            <div className="timeline-status">
                              {event.status}
                            </div>
                            {event.note && (
                              <div className="timeline-note">{event.note}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryHistory;