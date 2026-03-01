import React, { useState, useEffect } from 'react';
import { FaCamera, FaTrash, FaSave, FaKey, FaShieldAlt, FaBell, FaCog, FaUser } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers, getPreferences, savePreferences } from '../../utils/storage';

const OperatorSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    language: 'en'
  });
  const [preferences, setPreferences] = useState({
    autoRefresh: true,
    fontSize: 16,
    itemsPerPage: 25,
    defaultView: 'dashboard',
    showNotifications: true
  });
  const [notificationSettings, setNotificationSettings] = useState({
    newOrderNotify: true,
    orderUpdateNotify: true,
    orderCompleteNotify: false,
    newMessageNotify: true,
    adminMessageNotify: true,
    lowStockNotify: true,
    systemUpdateNotify: false
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useNotification();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load profile data
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        language: user.language || 'en'
      });
    }

    // Load preferences
    const savedPrefs = getPreferences(user?.id);
    setPreferences({
      autoRefresh: savedPrefs.autoRefresh !== undefined ? savedPrefs.autoRefresh : true,
      fontSize: savedPrefs.fontSize || 16,
      itemsPerPage: savedPrefs.itemsPerPage || 25,
      defaultView: savedPrefs.defaultView || 'dashboard',
      showNotifications: savedPrefs.showNotifications !== undefined ? savedPrefs.showNotifications : true
    });

    // Load notification settings
    const savedNotifications = localStorage.getItem(`operatorNotifications_${user?.id}`);
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }

    // Apply font size
    document.documentElement.style.fontSize = `${savedPrefs.fontSize || 16}px`;
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.id]: e.target.value
    });
  };

  const handlePreferenceChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setPreferences({
      ...preferences,
      [e.target.id]: value
    });

    // Apply changes immediately
    if (e.target.id === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
      document.getElementById('fontSizeValue').textContent = `${value}px`;
    }
  };

  const handleNotificationChange = (e) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.id]: e.target.checked
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.id]: e.target.value
    });
  };

  const saveProfile = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    const operatorIndex = usersData.operators?.findIndex(o => o.id === user?.id);

    if (operatorIndex !== -1 && usersData.operators) {
      usersData.operators[operatorIndex] = {
        ...usersData.operators[operatorIndex],
        ...profileData
      };

      saveUsers(usersData);

      // Update current user
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      showToast('Profile updated successfully!', 'success');
    }
  };

  const savePreferencesSettings = () => {
    savePreferences(user?.id, preferences);
    localStorage.setItem(`operatorNotifications_${user?.id}`, JSON.stringify(notificationSettings));
    showToast('Settings saved successfully!', 'success');
  };

  const changePassword = (e) => {
    e.preventDefault();

    if (passwordData.new !== passwordData.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.current !== user?.password) {
      showToast('Current password is incorrect', 'error');
      return;
    }

    const usersData = getUsers();
    const operatorIndex = usersData.operators?.findIndex(o => o.id === user?.id);

    if (operatorIndex !== -1 && usersData.operators) {
      usersData.operators[operatorIndex].password = passwordData.new;
      saveUsers(usersData);

      // Update current user
      const updatedUser = { ...user, password: passwordData.new };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setPasswordData({ current: '', new: '', confirm: '' });
      showToast('Password changed successfully!', 'success');
    }
  };

  const enableTwoFactor = () => {
    showToast('Two-factor authentication setup coming soon!', 'info');
  };

  const logoutOtherSessions = () => {
    showToast('Other sessions logged out', 'success');
  };

  const tabs = [
    { id: 'profile', icon: FaUser, label: 'Profile' },
    { id: 'preferences', icon: FaCog, label: 'Preferences' },
    { id: 'notifications', icon: FaBell, label: 'Notifications' },
    { id: 'security', icon: FaShieldAlt, label: 'Security' }
  ];

  return (
    <>
      <div className="section-header">
        <h2>Settings</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={savePreferencesSettings}>
            <FaSave /> Save Changes
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <div className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-pane active">
              <div className="profile-settings">
                <div className="profile-picture-section">
                  <div className="profile-picture">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Operator')}&background=2196F3&color=fff`} 
                      alt="Profile" 
                    />
                    <div className="picture-actions">
                      <button className="btn btn-sm btn-outline">
                        <FaCamera /> Change
                      </button>
                      <button className="btn btn-sm btn-outline">
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={saveProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input 
                        type="text" 
                        id="name" 
                        value={profileData.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input 
                        type="email" 
                        id="email" 
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="language">Language</label>
                      <select 
                        id="language" 
                        value={profileData.language}
                        onChange={handleProfileChange}
                      >
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="address">Address</label>
                      <textarea 
                        id="address" 
                        rows="2" 
                        value={profileData.address}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-pane active">
              <div className="preference-settings">
                <h3>System Preferences</h3>
                
                <div className="preference-item">
                  <label>
                    <input 
                      type="checkbox" 
                      id="autoRefresh" 
                      checked={preferences.autoRefresh}
                      onChange={handlePreferenceChange}
                    />
                    <span>Auto-refresh dashboard</span>
                  </label>
                  <small>Automatically refresh data every 5 minutes</small>
                </div>

                <div className="preference-item">
                  <label htmlFor="fontSize">Font Size</label>
                  <input 
                    type="range" 
                    id="fontSize" 
                    min="12" 
                    max="24" 
                    value={preferences.fontSize}
                    onChange={handlePreferenceChange}
                  />
                  <span id="fontSizeValue">{preferences.fontSize}px</span>
                </div>

                <div className="preference-item">
                  <label htmlFor="itemsPerPage">Items Per Page</label>
                  <select 
                    id="itemsPerPage" 
                    value={preferences.itemsPerPage}
                    onChange={handlePreferenceChange}
                  >
                    <option value="10">10 items</option>
                    <option value="25">25 items</option>
                    <option value="50">50 items</option>
                    <option value="100">100 items</option>
                  </select>
                </div>

                <div className="preference-item">
                  <label htmlFor="defaultView">Default View</label>
                  <select 
                    id="defaultView" 
                    value={preferences.defaultView}
                    onChange={handlePreferenceChange}
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="orders">My Orders</option>
                    <option value="messages">Messages</option>
                  </select>
                </div>

                <div className="preference-item">
                  <label>
                    <input 
                      type="checkbox" 
                      id="showNotifications" 
                      checked={preferences.showNotifications}
                      onChange={handlePreferenceChange}
                    />
                    <span>Show desktop notifications</span>
                  </label>
                  <small>Show notifications for new orders and messages</small>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="tab-pane active">
              <div className="notification-settings">
                <h3>Notification Preferences</h3>
                
                <div className="notification-category">
                  <h4>Order Notifications</h4>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="newOrderNotify" 
                        checked={notificationSettings.newOrderNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>New Order Assignment</span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="orderUpdateNotify" 
                        checked={notificationSettings.orderUpdateNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>Order Status Updates</span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="orderCompleteNotify" 
                        checked={notificationSettings.orderCompleteNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>Order Completion</span>
                    </label>
                  </div>
                </div>

                <div className="notification-category">
                  <h4>Message Notifications</h4>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="newMessageNotify" 
                        checked={notificationSettings.newMessageNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>New Messages</span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="adminMessageNotify" 
                        checked={notificationSettings.adminMessageNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>Messages from Admin</span>
                    </label>
                  </div>
                </div>

                <div className="notification-category">
                  <h4>System Notifications</h4>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="lowStockNotify" 
                        checked={notificationSettings.lowStockNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>Low Stock Alerts</span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>
                      <input 
                        type="checkbox" 
                        id="systemUpdateNotify" 
                        checked={notificationSettings.systemUpdateNotify}
                        onChange={handleNotificationChange}
                      />
                      <span>System Updates</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-pane active">
              <div className="security-settings">
                <h3>Security Settings</h3>
                
                <div className="security-section">
                  <h4>Change Password</h4>
                  <form onSubmit={changePassword}>
                    <div className="form-group">
                      <label htmlFor="current">Current Password *</label>
                      <input 
                        type="password" 
                        id="current" 
                        value={passwordData.current}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new">New Password *</label>
                      <input 
                        type="password" 
                        id="new" 
                        value={passwordData.new}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirm">Confirm Password *</label>
                      <input 
                        type="password" 
                        id="confirm" 
                        value={passwordData.confirm}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <FaKey /> Change Password
                    </button>
                  </form>
                </div>

                <div className="security-section">
                  <h4>Session Management</h4>
                  <div className="session-item">
                    <p><strong>Current Session:</strong> Started today at {new Date().toLocaleTimeString()}</p>
                    <button className="btn btn-sm btn-outline" onClick={logoutOtherSessions}>
                      Logout Other Sessions
                    </button>
                  </div>
                  <div className="session-item">
                    <label>
                      <input type="checkbox" id="autoLogout" defaultChecked />
                      <span>Auto-logout after 30 minutes of inactivity</span>
                    </label>
                  </div>
                </div>

                <div className="security-section">
                  <h4>Two-Factor Authentication</h4>
                  <div className="two-factor-item">
                    <p>Add an extra layer of security to your account</p>
                    <button className="btn btn-outline" onClick={enableTwoFactor}>
                      <FaShieldAlt /> Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OperatorSettings;