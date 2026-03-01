import React, { useState, useEffect } from 'react';
import { FaCamera, FaTrash, FaDatabase, FaUndo, FaSave } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'en',
    fontSize: 16
  });
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    sessionTimeout: 30
  });
  const [notificationSettings, setNotificationSettings] = useState({
    newOrderNotify: true,
    orderStatusNotify: true,
    lowStockNotify: true,
    inventoryUpdateNotify: false
  });
  const [backupHistory, setBackupHistory] = useState([]);

  const { user } = useAuth();
  const { theme } = useTheme();
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
        phone: user.phone || '+251911223344',
        language: user.language || 'en',
        fontSize: user.fontSize || 16
      });
    }

    // Load system settings from localStorage
    const savedSystem = localStorage.getItem('adminSystemSettings');
    if (savedSystem) {
      setSystemSettings(JSON.parse(savedSystem));
    }

    // Load notification settings
    const savedNotifications = localStorage.getItem('adminNotificationSettings');
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }

    // Load backup history
    loadBackupHistory();
  };

  const loadBackupHistory = () => {
    const usersData = getUsers();
    const systemInfo = {
      totalCustomers: usersData.customers?.length || 0,
      totalProducts: usersData.products?.length || 0,
      totalOrders: usersData.orders?.length || 0,
      dataSize: `${Math.round(JSON.stringify(usersData).length / 1024)} KB`,
      lastBackup: localStorage.getItem('lastBackup') || 'Never'
    };

    // Update system info in backup tab
    document.getElementById('sysTotalCustomers') && (document.getElementById('sysTotalCustomers').textContent = systemInfo.totalCustomers);
    document.getElementById('sysTotalProducts') && (document.getElementById('sysTotalProducts').textContent = systemInfo.totalProducts);
    document.getElementById('sysTotalOrders') && (document.getElementById('sysTotalOrders').textContent = systemInfo.totalOrders);
    document.getElementById('dataSize') && (document.getElementById('dataSize').textContent = systemInfo.dataSize);
    document.getElementById('lastBackup') && (document.getElementById('lastBackup').textContent = systemInfo.lastBackup);
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.id]: e.target.value
    });
  };

  const handleSystemChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSystemSettings({
      ...systemSettings,
      [e.target.id]: value
    });
  };

  const handleNotificationChange = (e) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.id]: e.target.checked
    });
  };

  const saveProfileSettings = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    const adminIndex = usersData.admin.findIndex(a => a.id === user.id);

    if (adminIndex !== -1) {
      usersData.admin[adminIndex] = {
        ...usersData.admin[adminIndex],
        ...profileData
      };

      saveUsers(usersData);
      
      // Update current user
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      showToast('Profile settings saved successfully!', 'success');
    }
  };

  const saveSystemSettings = () => {
    localStorage.setItem('adminSystemSettings', JSON.stringify(systemSettings));
    showToast('System settings saved successfully!', 'success');
  };

  const resetSystemSettings = () => {
    if (window.confirm('Are you sure you want to reset all system settings to default?')) {
      const defaults = {
        autoBackup: true,
        emailNotifications: true,
        smsNotifications: false,
        sessionTimeout: 30
      };
      setSystemSettings(defaults);
      localStorage.setItem('adminSystemSettings', JSON.stringify(defaults));
      showToast('System settings reset to default!', 'success');
    }
  };

  const saveNotificationSettings = () => {
    localStorage.setItem('adminNotificationSettings', JSON.stringify(notificationSettings));
    showToast('Notification preferences saved!', 'success');
  };

  const handleBackupNow = () => {
    const usersData = getUsers();
    const backup = {
      timestamp: new Date().toISOString(),
      data: usersData
    };

    // Save backup to localStorage
    const backups = JSON.parse(localStorage.getItem('backups') || '[]');
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));
    localStorage.setItem('lastBackup', new Date().toLocaleString());

    // Download backup file
    const blob = new Blob([JSON.stringify(usersData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `millpro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    loadBackupHistory();
    showToast('Backup created successfully!', 'success');
  };

  const handleRestoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target.result);
          
          if (window.confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) {
            localStorage.setItem('millUsers', JSON.stringify(backupData));
            showToast('Backup restored successfully!', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } catch (error) {
          showToast('Invalid backup file!', 'error');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const handleDeleteAllData = () => {
    if (window.confirm('WARNING: This will delete ALL data including customers, orders, and products. Are you absolutely sure?')) {
      if (window.confirm('This action cannot be undone. Type "DELETE" to confirm:')) {
        localStorage.clear();
        showToast('All data deleted! Redirecting to login...', 'warning');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    }
  };

  const updateFontSize = (e) => {
    const size = e.target.value;
    setProfileData({
      ...profileData,
      fontSize: size
    });
    document.getElementById('fontSizeValue').textContent = `${size}px`;
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'system', label: 'System' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'backup', label: 'Backup' }
  ];

  return (
    <div className="settings-tabs">
      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="tab-pane active">
            <div className="profile-settings">
              <div className="profile-picture-section">
                <div className="profile-picture">
                  <img 
                    id="currentProfilePic" 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Admin')}&background=4CAF50&color=fff`} 
                    alt="Profile" 
                  />
                  <div className="picture-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => showToast('Profile picture change coming soon!', 'info')}>
                      <FaCamera /> Change
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => showToast('Profile picture removed', 'success')}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              </div>
              
              <form onSubmit={saveProfileSettings}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      value={profileData.name} 
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={profileData.email} 
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={profileData.phone} 
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="language">Language</label>
                    <select id="language" value={profileData.language} onChange={handleProfileChange}>
                      <option value="en">English</option>
                      <option value="am">Amharic</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="fontSize">Font Size</label>
                  <input 
                    type="range" 
                    id="fontSize" 
                    min="12" 
                    max="24" 
                    value={profileData.fontSize} 
                    onChange={updateFontSize}
                  />
                  <span id="fontSizeValue">{profileData.fontSize}px</span>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <FaSave /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="tab-pane active">
            <div className="system-settings">
              <h3>System Configuration</h3>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    id="autoBackup" 
                    checked={systemSettings.autoBackup} 
                    onChange={handleSystemChange}
                  />
                  <span>Automatic Backup</span>
                </label>
                <small>Backup data daily at 2:00 AM</small>
              </div>
              
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    id="emailNotifications" 
                    checked={systemSettings.emailNotifications} 
                    onChange={handleSystemChange}
                  />
                  <span>Email Notifications</span>
                </label>
                <small>Receive email alerts for important events</small>
              </div>
              
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    id="smsNotifications" 
                    checked={systemSettings.smsNotifications} 
                    onChange={handleSystemChange}
                  />
                  <span>SMS Notifications</span>
                </label>
                <small>Send SMS alerts to operators</small>
              </div>
              
              <div className="setting-item">
                <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                <input 
                  type="number" 
                  id="sessionTimeout" 
                  value={systemSettings.sessionTimeout} 
                  onChange={handleSystemChange}
                  min="5" 
                  max="240"
                />
              </div>
              
              <div className="form-actions">
                <button className="btn btn-primary" onClick={saveSystemSettings}>Save Settings</button>
                <button className="btn btn-danger" onClick={resetSystemSettings}>Reset to Default</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="tab-pane active">
            <div className="notification-settings">
              <h3>Notification Preferences</h3>
              
              <div className="notification-category">
                <h4>Order Notifications</h4>
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox" 
                      id="newOrderNotify" 
                      checked={notificationSettings.newOrderNotify} 
                      onChange={handleNotificationChange}
                    />
                    <span>New Order Received</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox" 
                      id="orderStatusNotify" 
                      checked={notificationSettings.orderStatusNotify} 
                      onChange={handleNotificationChange}
                    />
                    <span>Order Status Updates</span>
                  </label>
                </div>
              </div>
              
              <div className="notification-category">
                <h4>Inventory Notifications</h4>
                <div className="setting-item">
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
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox" 
                      id="inventoryUpdateNotify" 
                      checked={notificationSettings.inventoryUpdateNotify} 
                      onChange={handleNotificationChange}
                    />
                    <span>Inventory Updates</span>
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button className="btn btn-primary" onClick={saveNotificationSettings}>Save Preferences</button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Settings */}
        {activeTab === 'backup' && (
          <div className="tab-pane active">
            <div className="backup-settings">
              <h3>Data Backup & Restore</h3>
              
              <div className="backup-options">
                <button className="btn btn-primary" onClick={handleBackupNow}>
                  <FaDatabase /> Backup Now
                </button>
                <button className="btn btn-outline" onClick={handleRestoreBackup}>
                  <FaUndo /> Restore Backup
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAllData}>
                  <FaTrash /> Delete All Data
                </button>
              </div>
              
              <div className="backup-history">
                <h4>Recent Backups</h4>
                <div className="backup-list" id="backupList">
                  {JSON.parse(localStorage.getItem('backups') || '[]').slice(-5).reverse().map((backup, index) => (
                    <div key={index} className="backup-item">
                      <span>{new Date(backup.timestamp).toLocaleString()}</span>
                      <button className="btn btn-sm btn-outline">Restore</button>
                    </div>
                  ))}
                  {(!localStorage.getItem('backups') || JSON.parse(localStorage.getItem('backups')).length === 0) && (
                    <p>No backups found</p>
                  )}
                </div>
              </div>
              
              <div className="system-info">
                <h4>System Information</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Total Customers:</td>
                      <td id="sysTotalCustomers">0</td>
                    </tr>
                    <tr>
                      <td>Total Products:</td>
                      <td id="sysTotalProducts">0</td>
                    </tr>
                    <tr>
                      <td>Total Orders:</td>
                      <td id="sysTotalOrders">0</td>
                    </tr>
                    <tr>
                      <td>Data Size:</td>
                      <td id="dataSize">0 KB</td>
                    </tr>
                    <tr>
                      <td>Last Backup:</td>
                      <td id="lastBackup">Never</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;