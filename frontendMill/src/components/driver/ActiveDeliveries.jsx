import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import Map from '../common/Map';
import Spinner from '../common/Spinner';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const ActiveDeliveries = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  
  useEffect(() => {
    loadActiveDelivery();
    startLocationTracking();
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
  
  useEffect(() => {
    if (socket && activeDelivery) {
      socket.emit('track-delivery', activeDelivery._id);
      
      socket.on('delivery-update', handleDeliveryUpdate);
      
      return () => {
        socket.off('delivery-update');
      };
    }
  }, [socket, activeDelivery]);
  
  const loadActiveDelivery = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/active-delivery');
      setActiveDelivery(response.data.delivery);
    } catch (error) {
      console.error('Load active delivery error:', error);
      toast.error('Failed to load active delivery');
    } finally {
      setLoading(false);
    }
  };
  
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setCurrentLocation(location);
        
        // Update location every 10 seconds
        if (Date.now() % 10000 < 1000) {
          updateDriverLocation(location);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
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
      
      if (socket && activeDelivery) {
        socket.emit('driver-location-update', {
          deliveryId: activeDelivery._id,
          location
        });
      }
    } catch (error) {
      console.error('Update location error:', error);
    }
  };
  
  const handleDeliveryUpdate = (data) => {
    if (data.deliveryId === activeDelivery?._id) {
      setActiveDelivery(prev => ({ ...prev, status: data.status }));
      
      if (data.status === 'delivered') {
        toast.success('Delivery completed successfully!');
        setTimeout(() => {
          loadActiveDelivery();
        }, 2000);
      }
    }
  };
  
  const updateStatus = async (status) => {
    try {
      const data = {
        status,
        location: currentLocation
      };
      
      if (status === 'delivered') {
        if (!deliveryPhoto) {
          toast.error('Please take a delivery photo');
          return;
        }
        if (!customerSignature) {
          toast.error('Please get customer signature');
          return;
        }
        
        data.deliveryPhoto = deliveryPhoto;
        data.customerSignature = customerSignature;
      }
      
      await api.put(`/deliveries/${activeDelivery._id}/status`, data);
      
      if (status === 'delivered') {
        setShowConfirmModal(false);
        setDeliveryPhoto(null);
        setCustomerSignature(null);
      }
      
      loadActiveDelivery();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };
  
  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'photo') {
        setDeliveryPhoto(reader.result);
      } else if (type === 'signature') {
        setCustomerSignature(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  if (loading) return <Spinner fullPage />;
  
  if (!activeDelivery) {
    return (
      <div className="driver-dashboard">
        <DriverSidebar />
        <div className="driver-main">
          <DriverHeader />
          <div className="dashboard-content">
            <div className="empty-state">
              <i className="fas fa-truck"></i>
              <h3>No Active Delivery</h3>
              <p>You don't have any active deliveries right now.</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/driver/tasks'}
              >
                View Available Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="driver-dashboard">
      <DriverSidebar driver={{ status: 'busy' }} />
      
      <div className="driver-main">
        <DriverHeader />
        
        <div className="dashboard-content">
          <div className="active-delivery-full">
            <div className="delivery-header-large">
              <h2>
                <i className="fas fa-truck"></i>
                Active Delivery - Order #{activeDelivery.order?.orderNumber}
              </h2>
              <span className={`status-badge status-${activeDelivery.status}`}>
                {activeDelivery.status}
              </span>
            </div>
            
            <div className="delivery-map-large">
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
            
            <div className="delivery-progress">
              <div className="progress-steps">
                <div className={`step ${activeDelivery.status !== 'pending' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                  <div className="step-label">Assigned</div>
                </div>
                <div className={`step ${['picked-up', 'in-transit', 'delivery-arrived', 'delivered'].includes(activeDelivery.status) ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="step-label">Picked Up</div>
                </div>
                <div className={`step ${['in-transit', 'delivery-arrived', 'delivered'].includes(activeDelivery.status) ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-road"></i>
                  </div>
                  <div className="step-label">In Transit</div>
                </div>
                <div className={`step ${['delivery-arrived', 'delivered'].includes(activeDelivery.status) ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-map-pin"></i>
                  </div>
                  <div className="step-label">Arrived</div>
                </div>
                <div className={`step ${activeDelivery.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="step-label">Delivered</div>
                </div>
              </div>
            </div>
            
            <div className="delivery-details-grid">
              <div className="detail-card">
                <h3>
                  <i className="fas fa-map-marker-alt pickup"></i>
                  Pickup Location
                </h3>
                <p>{activeDelivery.pickupLocation?.address}</p>
                {activeDelivery.pickupLocation?.instructions && (
                  <p className="instructions">
                    <strong>Instructions:</strong> {activeDelivery.pickupLocation.instructions}
                  </p>
                )}
              </div>
              
              <div className="detail-card">
                <h3>
                  <i className="fas fa-map-marker-alt delivery"></i>
                  Delivery Location
                </h3>
                <p>{activeDelivery.deliveryLocation?.address}</p>
                {activeDelivery.deliveryLocation?.instructions && (
                  <p className="instructions">
                    <strong>Instructions:</strong> {activeDelivery.deliveryLocation.instructions}
                  </p>
                )}
              </div>
              
              <div className="detail-card">
                <h3>
                  <i className="fas fa-user"></i>
                  Customer Information
                </h3>
                <p><strong>Name:</strong> {activeDelivery.order?.customer?.name}</p>
                <p><strong>Phone:</strong> {activeDelivery.order?.customer?.phone}</p>
                <p><strong>Email:</strong> {activeDelivery.order?.customer?.email}</p>
              </div>
              
              <div className="detail-card">
                <h3>
                  <i className="fas fa-box"></i>
                  Order Details
                </h3>
                {activeDelivery.order?.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name}</span>
                    <span>{item.quantity} kg × {item.pricePerKg} Birr</span>
                    <span>{(item.quantity * item.pricePerKg).toFixed(2)} Birr</span>
                  </div>
                ))}
                <div className="order-total">
                  <strong>Total:</strong>
                  <strong>{activeDelivery.order?.totals?.total} Birr</strong>
                </div>
              </div>
            </div>
            
            <div className="delivery-actions-large">
              {activeDelivery.status === 'assigned' && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => updateStatus('pickup-arrived')}
                >
                  <i className="fas fa-map-marker-alt"></i>
                  I've Arrived at Pickup Location
                </button>
              )}
              
              {activeDelivery.status === 'pickup-arrived' && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => updateStatus('picked-up')}
                >
                  <i className="fas fa-box"></i>
                  Confirm Items Picked Up
                </button>
              )}
              
              {activeDelivery.status === 'picked-up' && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => updateStatus('in-transit')}
                >
                  <i className="fas fa-road"></i>
                  Start Delivery Route
                </button>
              )}
              
              {activeDelivery.status === 'in-transit' && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => updateStatus('delivery-arrived')}
                >
                  <i className="fas fa-map-pin"></i>
                  I've Arrived at Delivery Location
                </button>
              )}
              
              {activeDelivery.status === 'delivery-arrived' && (
                <button 
                  className="btn btn-success btn-large"
                  onClick={() => setShowConfirmModal(true)}
                >
                  <i className="fas fa-check-circle"></i>
                  Complete Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Completion Modal */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Complete Delivery</h3>
              <button className="close-modal" onClick={() => setShowConfirmModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                updateStatus('delivered');
              }}>
                <div className="form-group">
                  <label>Delivery Photo *</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    required
                  />
                  {deliveryPhoto && (
                    <img src={deliveryPhoto} alt="Delivery" className="preview-image" />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Customer Signature *</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    required
                  />
                  {customerSignature && (
                    <img src={customerSignature} alt="Signature" className="preview-image" />
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Confirm Delivery
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDeliveries;