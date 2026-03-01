import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import DriverSidebar from './DriverSidebar';
import DriverHeader from './DriverHeader';
import Map from '../common/Map';
import Spinner from '../common/Spinner';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    completedToday: 0,
    earnings: 0,
    rating: 0
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  
  useEffect(() => {
    loadDriverData();
    startLocationTracking();
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
  
  useEffect(() => {
    if (socket) {
      socket.on('delivery-assigned', handleNewDelivery);
      socket.on('delivery-update', handleDeliveryUpdate);
      
      return () => {
        socket.off('delivery-assigned');
        socket.off('delivery-update');
      };
    }
  }, [socket]);
  
  const loadDriverData = async () => {
    try {
      setLoading(true);
      
      const [driverRes, deliveriesRes, statsRes] = await Promise.all([
        api.get('/drivers/me'),
        api.get('/drivers/deliveries'),
        api.get('/drivers/stats')
      ]);
      
      setDriver(driverRes.data.driver);
      setDeliveries(deliveriesRes.data.deliveries);
      
      // Find active delivery
      const active = deliveriesRes.data.deliveries.find(
        d => ['assigned', 'in-transit', 'pickup-arrived', 'delivery-arrived'].includes(d.status)
      );
      setActiveDelivery(active);
      
      setStats(statsRes.data.stats);
      
    } catch (error) {
      console.error('Load driver data error:', error);
      toast.error('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };
  
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setCurrentLocation(location);
        
        // Send to server every 30 seconds
        if (activeDelivery && Date.now() % 30000 < 1000) {
          updateDriverLocation(location);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
    
    setWatchId(id);
  };
  
  const updateDriverLocation = async (location) => {
    try {
      await api.post('/drivers/location', location);
      
      if (socket) {
        socket.emit('driver-location-update', {
          deliveryId: activeDelivery?._id,
          location
        });
      }
    } catch (error) {
      console.error('Update location error:', error);
    }
  };
  
  const handleNewDelivery = (data) => {
    toast.info('New delivery assigned!');
    loadDriverData();
  };
  
  const handleDeliveryUpdate = (data) => {
    if (data.deliveryId === activeDelivery?._id) {
      setActiveDelivery(prev => ({ ...prev, status: data.status }));
    }
    loadDriverData();
  };
  
  const updateStatus = async (deliveryId, status, location = null) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, {
        status,
        location: location || currentLocation
      });
      
      toast.success(`Delivery status updated to ${status}`);
      loadDriverData();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };
  
  const toggleAvailability = async () => {
    try {
      const newStatus = driver.status === 'available' ? 'offline' : 'available';
      const response = await api.put('/drivers/status', { status: newStatus });
      setDriver(prev => ({ ...prev, status: response.data.status }));
      toast.success(`You are now ${newStatus}`);
    } catch (error) {
      console.error('Toggle availability error:', error);
      toast.error('Failed to update status');
    }
  };
  
  if (loading) return <Spinner fullPage />;
  
  return (
    <div className="driver-dashboard">
      <DriverSidebar driver={driver} />
      
      <div className="driver-main">
        <DriverHeader 
          driver={driver} 
          onToggleAvailability={toggleAvailability}
        />
        
        <div className="dashboard-content">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.todayDeliveries}</h3>
                <p>Today's Deliveries</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.completedToday}</h3>
                <p>Completed Today</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.earnings} Birr</h3>
                <p>Today's Earnings</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.rating.toFixed(1)}</h3>
                <p>Rating</p>
              </div>
            </div>
          </div>
          
          {/* Active Delivery */}
          {activeDelivery ? (
            <div className="active-delivery-card">
              <h3>
                <i className="fas fa-truck"></i>
                Active Delivery
              </h3>
              
              <div className="delivery-map">
                <Map
                  center={currentLocation || activeDelivery.pickupLocation}
                  zoom={14}
                  markers={[
                    {
                      position: activeDelivery.pickupLocation,
                      title: 'Pickup',
                      icon: 'pickup'
                    },
                    {
                      position: activeDelivery.deliveryLocation,
                      title: 'Delivery',
                      icon: 'delivery'
                    },
                    currentLocation && {
                      position: currentLocation,
                      title: 'You',
                      icon: 'driver'
                    }
                  ]}
                  showRoute={true}
                  origin={activeDelivery.pickupLocation}
                  destination={activeDelivery.deliveryLocation}
                />
              </div>
              
              <div className="delivery-info">
                <h4>Order #{activeDelivery.order?.orderNumber}</h4>
                <p>
                  <strong>Customer:</strong> {activeDelivery.order?.customer?.name}
                </p>
                <p>
                  <strong>Phone:</strong> {activeDelivery.order?.customer?.phone}
                </p>
                <p>
                  <strong>Pickup:</strong> {activeDelivery.pickupLocation?.address}
                </p>
                <p>
                  <strong>Delivery:</strong> {activeDelivery.deliveryLocation?.address}
                </p>
              </div>
              
              <div className="delivery-actions">
                {activeDelivery.status === 'assigned' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateStatus(activeDelivery._id, 'pickup-arrived', currentLocation)}
                  >
                    <i className="fas fa-map-marker-alt"></i>
                    Arrived at Pickup
                  </button>
                )}
                
                {activeDelivery.status === 'pickup-arrived' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateStatus(activeDelivery._id, 'picked-up', currentLocation)}
                  >
                    <i className="fas fa-box"></i>
                    Items Picked Up
                  </button>
                )}
                
                {activeDelivery.status === 'picked-up' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateStatus(activeDelivery._id, 'in-transit', currentLocation)}
                  >
                    <i className="fas fa-road"></i>
                    Start Delivery
                  </button>
                )}
                
                {activeDelivery.status === 'in-transit' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateStatus(activeDelivery._id, 'delivery-arrived', currentLocation)}
                  >
                    <i className="fas fa-map-pin"></i>
                    Arrived at Delivery
                  </button>
                )}
                
                {activeDelivery.status === 'delivery-arrived' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => updateStatus(activeDelivery._id, 'delivered', currentLocation)}
                  >
                    <i className="fas fa-check-circle"></i>
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-active-delivery">
              <i className="fas fa-truck"></i>
              <h3>No Active Deliveries</h3>
              <p>You're all caught up! Waiting for new assignments.</p>
            </div>
          )}
          
          {/* Today's Schedule */}
          <div className="schedule-card">
            <h3>
              <i className="fas fa-calendar-alt"></i>
              Today's Schedule
            </h3>
            
            <div className="schedule-list">
              {deliveries
                .filter(d => d.status !== 'delivered' && d.status !== 'cancelled')
                .slice(0, 5)
                .map(delivery => (
                  <div key={delivery._id} className="schedule-item">
                    <div className="schedule-time">
                      {delivery.estimatedDeliveryTime 
                        ? new Date(delivery.estimatedDeliveryTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Pending'
                      }
                    </div>
                    <div className="schedule-info">
                      <h4>Order #{delivery.order?.orderNumber}</h4>
                      <p>{delivery.deliveryLocation?.address}</p>
                      <span className={`status-badge status-${delivery.status}`}>
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;