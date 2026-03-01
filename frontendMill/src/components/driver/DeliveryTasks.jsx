import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import Map from '../common/Map';
import Spinner from '../common/Spinner';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const DeliveryTasks = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [filter, setFilter] = useState('all');
  const [currentLocation, setCurrentLocation] = useState(null);
  
  useEffect(() => {
    loadDeliveries();
    startLocationTracking();
  }, [filter]);
  
  useEffect(() => {
    if (socket) {
      socket.on('delivery-update', handleDeliveryUpdate);
      
      return () => {
        socket.off('delivery-update');
      };
    }
  }, [socket]);
  
  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/deliveries', {
        params: { filter }
      });
      setDeliveries(response.data.deliveries);
    } catch (error) {
      console.error('Load deliveries error:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };
  
  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    );
  };
  
  const handleDeliveryUpdate = (data) => {
    setDeliveries(prev => 
      prev.map(d => d._id === data.deliveryId ? { ...d, status: data.status } : d)
    );
    
    if (selectedDelivery?._id === data.deliveryId) {
      setSelectedDelivery(prev => ({ ...prev, status: data.status }));
    }
  };
  
  const acceptDelivery = async (deliveryId) => {
    try {
      await api.put(`/deliveries/${deliveryId}/accept`);
      toast.success('Delivery accepted');
      loadDeliveries();
    } catch (error) {
      console.error('Accept delivery error:', error);
      toast.error('Failed to accept delivery');
    }
  };
  
  const updateStatus = async (deliveryId, status) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, {
        status,
        location: currentLocation
      });
      
      toast.success(`Status updated to ${status}`);
      loadDeliveries();
      
      if (selectedDelivery?._id === deliveryId) {
        setSelectedDelivery(prev => ({ ...prev, status }));
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };
  
  const getStatusActions = (delivery) => {
    switch(delivery.status) {
      case 'pending':
        return (
          <button 
            className="btn btn-primary"
            onClick={() => acceptDelivery(delivery._id)}
          >
            <i className="fas fa-check"></i> Accept Delivery
          </button>
        );
      case 'assigned':
        return (
          <button 
            className="btn btn-primary"
            onClick={() => updateStatus(delivery._id, 'pickup-arrived')}
          >
            <i className="fas fa-map-marker-alt"></i> Arrived at Pickup
          </button>
        );
      case 'pickup-arrived':
        return (
          <button 
            className="btn btn-primary"
            onClick={() => updateStatus(delivery._id, 'picked-up')}
          >
            <i className="fas fa-box"></i> Confirm Pickup
          </button>
        );
      case 'picked-up':
        return (
          <button 
            className="btn btn-primary"
            onClick={() => updateStatus(delivery._id, 'in-transit')}
          >
            <i className="fas fa-road"></i> Start Delivery
          </button>
        );
      case 'in-transit':
        return (
          <button 
            className="btn btn-primary"
            onClick={() => updateStatus(delivery._id, 'delivery-arrived')}
          >
            <i className="fas fa-map-pin"></i> Arrived at Destination
          </button>
        );
      case 'delivery-arrived':
        return (
          <button 
            className="btn btn-success"
            onClick={() => updateStatus(delivery._id, 'delivered')}
          >
            <i className="fas fa-check-circle"></i> Mark as Delivered
          </button>
        );
      default:
        return null;
    }
  };
  
  if (loading) return <Spinner fullPage />;
  
  return (
    <div className="driver-dashboard">
      <DriverSidebar driver={{ status: 'available' }} />
      
      <div className="driver-main">
        <DriverHeader />
        
        <div className="dashboard-content">
          <div className="section-header">
            <h2>Delivery Tasks</h2>
            <div className="filter-controls">
              <select 
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Deliveries</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="deliveries-grid">
            {deliveries.map(delivery => (
              <div 
                key={delivery._id} 
                className={`delivery-card ${selectedDelivery?._id === delivery._id ? 'selected' : ''}`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="delivery-header">
                  <span className="delivery-id">
                    Order #{delivery.order?.orderNumber}
                  </span>
                  <span className={`status-badge status-${delivery.status}`}>
                    {delivery.status}
                  </span>
                </div>
                
                <div className="delivery-addresses">
                  <p>
                    <i className="fas fa-map-marker-alt pickup"></i>
                    {delivery.pickupLocation?.address}
                  </p>
                  <p>
                    <i className="fas fa-map-marker-alt delivery"></i>
                    {delivery.deliveryLocation?.address}
                  </p>
                </div>
                
                <div className="delivery-meta">
                  <span>
                    <i className="fas fa-user"></i>
                    {delivery.order?.customer?.name}
                  </span>
                  <span>
                    <i className="fas fa-phone"></i>
                    {delivery.order?.customer?.phone}
                  </span>
                </div>
                
                {selectedDelivery?._id === delivery._id && (
                  <div className="delivery-details">
                    <div className="delivery-map">
                      <Map
                        center={currentLocation || delivery.pickupLocation}
                        zoom={13}
                        markers={[
                          {
                            position: delivery.pickupLocation,
                            title: 'Pickup',
                            icon: 'pickup'
                          },
                          {
                            position: delivery.deliveryLocation,
                            title: 'Delivery',
                            icon: 'delivery'
                          },
                          currentLocation && {
                            position: currentLocation,
                            title: 'You',
                            icon: 'driver'
                          }
                        ]}
                        showRoute={delivery.status !== 'delivered'}
                        origin={delivery.pickupLocation}
                        destination={delivery.deliveryLocation}
                      />
                    </div>
                    
                    <div className="delivery-actions">
                      {getStatusActions(delivery)}
                      
                      <button 
                        className="btn btn-outline"
                        onClick={() => window.open(
                          `https://www.google.com/maps/dir/?api=1&origin=${currentLocation?.lat},${currentLocation?.lng}&destination=${delivery.pickupLocation.lat},${delivery.pickupLocation.lng}`,
                          '_blank'
                        )}
                      >
                        <i className="fas fa-directions"></i> Navigate
                      </button>
                    </div>
                    
                    <div className="delivery-timeline">
                      <h4>Timeline</h4>
                      {delivery.timeline?.map((event, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-time">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="timeline-status">
                            {event.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {deliveries.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-truck"></i>
                <h3>No Deliveries Found</h3>
                <p>You don't have any deliveries matching the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTasks;