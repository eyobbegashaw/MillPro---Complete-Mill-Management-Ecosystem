import React, { useState, useEffect } from 'react';
import { FaUser, FaCreditCard, FaCog, FaShieldAlt, FaCamera, FaTrash, FaSave, FaKey, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers, getPreferences, savePreferences } from '../../utils/storage';

const CustomerSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    backupPhone: '',
    address: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
    fontSize: 16
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const { user, logout } = useAuth();
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
        backupPhone: user.backupPhone || '',
        address: user.address || ''
      });
    }

    // Load payment methods
    setPaymentMethods(user?.paymentMethods || []);

    // Load preferences
    const savedPrefs = getPreferences(user?.id);
    setPreferences({
      darkMode: savedPrefs.darkMode || false,
      emailNotifications: savedPrefs.emailNotifications !== undefined ? savedPrefs.emailNotifications : true,
      smsNotifications: savedPrefs.smsNotifications || false,
      language: savedPrefs.language || 'en',
      fontSize: savedPrefs.fontSize || 16
    });

    // Apply theme
    if (savedPrefs.darkMode) {
      document.body.setAttribute('data-theme', 'dark');
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

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
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
    if (e.target.id === 'darkMode') {
      if (value) {
        document.body.setAttribute('data-theme', 'dark');
      } else {
        document.body.removeAttribute('data-theme');
      }
    }

    if (e.target.id === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
      document.getElementById('fontSizeValue').textContent = `${value}px`;
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    const customerIndex = usersData.customers.findIndex(c => c.id === user?.id);

    if (customerIndex !== -1) {
      usersData.customers[customerIndex] = {
        ...usersData.customers[customerIndex],
        ...profileData
      };

      saveUsers(usersData);

      // Update current user
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      showToast('Profile updated successfully!', 'success');
    }
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
    const customerIndex = usersData.customers.findIndex(c => c.id === user?.id);

    if (customerIndex !== -1) {
      usersData.customers[customerIndex].password = passwordData.new;
      saveUsers(usersData);

      // Update current user
      const updatedUser = { ...user, password: passwordData.new };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setPasswordData({ current: '', new: '', confirm: '' });
      showToast('Password changed successfully!', 'success');
    }
  };

  const savePreferencesSettings = () => {
    savePreferences(user?.id, preferences);
    showToast('Preferences saved!', 'success');
  };

  const addPaymentMethod = () => {
    const type = prompt('Enter payment method type (cbe or telebirr):');
    const accountNumber = prompt('Enter account number:');

    if (!type || !accountNumber) {
      showToast('Please enter both fields', 'warning');
      return;
    }

    if (!['cbe', 'telebirr'].includes(type.toLowerCase())) {
      showToast('Invalid payment method type', 'error');
      return;
    }

    const newMethod = {
      id: Date.now(),
      type: type.toLowerCase(),
      accountNumber,
      addedAt: new Date().toISOString()
    };

    const usersData = getUsers();
    const customerIndex = usersData.customers.findIndex(c => c.id === user?.id);

    if (customerIndex !== -1) {
      if (!usersData.customers[customerIndex].paymentMethods) {
        usersData.customers[customerIndex].paymentMethods = [];
      }
      usersData.customers[customerIndex].paymentMethods.push(newMethod);
      saveUsers(usersData);

      setPaymentMethods(usersData.customers[customerIndex].paymentMethods);
      showToast('Payment method added!', 'success');
    }
  };

  const deletePaymentMethod = (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      const usersData = getUsers();
      const customerIndex = usersData.customers.findIndex(c => c.id === user?.id);

      if (customerIndex !== -1) {
        usersData.customers[customerIndex].paymentMethods = 
          usersData.customers[customerIndex].paymentMethods.filter(m => m.id !== id);
        saveUsers(usersData);

        setPaymentMethods(usersData.customers[customerIndex].paymentMethods);
        showToast('Payment method deleted!', 'success');
      }
    }
  };

  const tabs = [
    { id: 'profile', icon: FaUser, label: 'Profile Settings' },
    { id: 'payment', icon: FaCreditCard, label: 'Payment Methods' },
    { id: 'preferences', icon: FaCog, label: 'Preferences' },
    { id: 'security', icon: FaShieldAlt, label: 'Security' }
  ];

  return (
    <>
      <div className="section-header">
        <h2>Account Settings</h2>
      </div>

      <div className="settings-container">
        {/* Profile Settings */}
        <div className="settings-card">
          <h3><FaUser /> Profile Settings</h3>
          <form onSubmit={saveProfile}>
            <div className="profile-picture-section">
              <div className="profile-picture">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Customer')}&background=FF9800&color=fff`} 
                  alt="Profile" 
                />
                <div className="picture-actions">
                  <button type="button" className="btn btn-sm btn-outline">
                    <FaCamera /> Change
                  </button>
                  <button type="button" className="btn btn-sm btn-outline">
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            </div>

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
                <label htmlFor="backupPhone">Backup Phone</label>
                <input 
                  type="tel" 
                  id="backupPhone" 
                  value={profileData.backupPhone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea 
                id="address" 
                rows="3" 
                value={profileData.address}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Payment Methods */}
        <div className="settings-card">
          <h3><FaCreditCard /> Payment Methods</h3>
          <div className="payment-methods">
            {paymentMethods.length > 0 ? (
              paymentMethods.map(method => (
                <div key={method.id} className="payment-method">
                  <div className="payment-method-info">
                    <div className="payment-method-icon">
                      <i className={`fas fa-${method.type === 'cbe' ? 'university' : 'mobile-alt'}`}></i>
                    </div>
                    <div>
                      <h5>{method.type === 'cbe' ? 'CBE' : 'Telebirr'}</h5>
                      <p>{method.accountNumber}</p>
                    </div>
                  </div>
                  <div className="payment-method-actions">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deletePaymentMethod(method.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No payment methods saved</p>
            )}
          </div>
          <button className="btn btn-outline btn-block" onClick={addPaymentMethod}>
            <FaPlus /> Add Payment Method
          </button>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <h3><FaCog /> Preferences</h3>
          <div className="preferences-list">
            <div className="preference-item">
              <label>
                <input 
                  type="checkbox" 
                  id="darkMode" 
                  checked={preferences.darkMode}
                  onChange={handlePreferenceChange}
                />
                <span>Dark Mode</span>
              </label>
            </div>
            <div className="preference-item">
              <label>
                <input 
                  type="checkbox" 
                  id="emailNotifications" 
                  checked={preferences.emailNotifications}
                  onChange={handlePreferenceChange}
                />
                <span>Email Notifications</span>
              </label>
            </div>
            <div className="preference-item">
              <label>
                <input 
                  type="checkbox" 
                  id="smsNotifications" 
                  checked={preferences.smsNotifications}
                  onChange={handlePreferenceChange}
                />
                <span>SMS Notifications</span>
              </label>
            </div>
            <div className="preference-item">
              <label htmlFor="language">Language</label>
              <select 
                id="language" 
                value={preferences.language}
                onChange={handlePreferenceChange}
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
              </select>
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
          </div>
          <button className="btn btn-primary btn-block" onClick={savePreferencesSettings}>
            <FaSave /> Save Preferences
          </button>
        </div>

        {/* Security */}
        <div className="settings-card">
          <h3><FaShieldAlt /> Security</h3>
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
            <button type="submit" className="btn btn-primary btn-block">
              <FaKey /> Change Password
            </button>
          </form>

          <div className="security-actions">
            <button className="btn btn-outline btn-block">
              <FaHistory /> View Login History
            </button>
            <button className="btn btn-outline btn-block" onClick={logout}>
              <FaSignOutAlt /> Logout Other Sessions
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSettings;