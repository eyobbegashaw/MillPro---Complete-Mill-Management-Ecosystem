import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Spinner from '../common/Spinner';
import { toast } from 'react-toastify';
import './DriverDashboard.css';

const DriverSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicle: {
      type: '',
      plateNumber: '',
      model: '',
      capacity: ''
    },
    availabilityHours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '09:00', end: '17:00' },
      sunday: { start: '09:00', end: '17:00' }
    },
    notifications: {
      newDelivery: true,
      deliveryUpdate: true,
      paymentReceived: true,
      messages: true
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/me');
      const driverData = response.data.driver;
      setDriver(driverData);
      
      setFormData({
        name: driverData.user?.name || '',
        email: driverData.user?.email || '',
        phone: driverData.user?.phone || '',
        address: driverData.user?.address || '',
        licenseNumber: driverData.licenseNumber || '',
        licenseExpiry: driverData.licenseExpiry?.split('T')[0] || '',
        vehicle: driverData.vehicle || {
          type: '',
          plateNumber: '',
          model: '',
          capacity: ''
        },
        availabilityHours: driverData.availabilityHours || formData.availabilityHours,
        notifications: driverData.user?.preferences?.notifications || formData.notifications
      });
    } catch (error) {
      console.error('Load driver data error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [name]: value
      }
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availabilityHours: {
        ...prev.availabilityHours,
        [day]: {
          ...prev.availabilityHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Update user profile
      await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });

      // Update driver profile
      await api.put(`/drivers/${driver._id}`, {
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        vehicle: formData.vehicle,
        availabilityHours: formData.availabilityHours
      });

      toast.success('Profile updated successfully');
      loadDriverData();
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const saveNotifications = async () => {
    try {
      await api.put('/users/notifications', {
        preferences: formData.notifications
      });
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Save notifications error:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser({ profilePicture: response.data.avatarUrl });
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Upload avatar error:', error);
      toast.error('Failed to upload profile picture');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="driver-dashboard">
      <DriverSidebar driver={driver} />
      
      <div className="driver-main">
        <DriverHeader />
        
        <div className="dashboard-content">
          <div className="settings-container">
            {/* Settings Tabs */}
            <div className="settings-tabs">
              <button
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i>
                Profile
              </button>
              <button
                className={`tab-btn ${activeTab === 'vehicle' ? 'active' : ''}`}
                onClick={() => setActiveTab('vehicle')}
              >
                <i className="fas fa-truck"></i>
                Vehicle
              </button>
              <button
                className={`tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
                onClick={() => setActiveTab('availability')}
              >
                <i className="fas fa-clock"></i>
                Availability
              </button>
              <button
                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="fas fa-bell"></i>
                Notifications
              </button>
              <button
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-shield-alt"></i>
                Security
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="profile-settings">
                  <div className="avatar-section">
                    <div className="avatar-wrapper">
                      <img
                        src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Driver')}&background=2196F3&color=fff`}
                        alt="Profile"
                      />
                      <label htmlFor="avatar-upload" className="avatar-overlay">
                        <i className="fas fa-camera"></i>
                      </label>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>License Expiry</label>
                        <input
                          type="date"
                          name="licenseExpiry"
                          value={formData.licenseExpiry}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vehicle Tab */}
              {activeTab === 'vehicle' && (
                <div className="vehicle-settings">
                  <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Vehicle Type</label>
                        <select
                          name="type"
                          value={formData.vehicle.type}
                          onChange={handleVehicleChange}
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="truck">Truck</option>
                          <option value="van">Van</option>
                          <option value="motorcycle">Motorcycle</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Plate Number</label>
                        <input
                          type="text"
                          name="plateNumber"
                          value={formData.vehicle.plateNumber}
                          onChange={handleVehicleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Model</label>
                        <input
                          type="text"
                          name="model"
                          value={formData.vehicle.model}
                          onChange={handleVehicleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Capacity (kg)</label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.vehicle.capacity}
                          onChange={handleVehicleChange}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Vehicle Info'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div className="availability-settings">
                  <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                    {Object.entries(formData.availabilityHours).map(([day, hours]) => (
                      <div key={day} className="availability-day">
                        <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                        <div className="time-range">
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Availability'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="notification-settings">
                  <form onSubmit={(e) => { e.preventDefault(); saveNotifications(); }}>
                    <div className="notification-group">
                      <h4>Delivery Notifications</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="newDelivery"
                          checked={formData.notifications.newDelivery}
                          onChange={handleNotificationChange}
                        />
                        <span>New delivery assignments</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="deliveryUpdate"
                          checked={formData.notifications.deliveryUpdate}
                          onChange={handleNotificationChange}
                        />
                        <span>Delivery status updates</span>
                      </label>
                    </div>

                    <div className="notification-group">
                      <h4>Payment Notifications</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="paymentReceived"
                          checked={formData.notifications.paymentReceived}
                          onChange={handleNotificationChange}
                        />
                        <span>Payment received</span>
                      </label>
                    </div>

                    <div className="notification-group">
                      <h4>Message Notifications</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="messages"
                          checked={formData.notifications.messages}
                          onChange={handleNotificationChange}
                        />
                        <span>New messages</span>
                      </label>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Save Preferences
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="security-settings">
                  <form onSubmit={changePassword}>
                    <h4>Change Password</h4>
                    
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Change Password
                      </button>
                    </div>
                  </form>

                  <div className="security-section">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                    <button className="btn btn-outline">
                      <i className="fas fa-shield-alt"></i>
                      Enable 2FA
                    </button>
                  </div>

                  <div className="security-section">
                    <h4>Sessions</h4>
                    <p>Manage your active sessions</p>
                    <button className="btn btn-outline">
                      <i className="fas fa-sign-out-alt"></i>
                      Logout from all devices
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSettings;