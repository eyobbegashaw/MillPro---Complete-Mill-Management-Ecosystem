import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, saveUsers } from '../utils/storage';
import { validatePhone } from '../utils/helpers';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    backupPhone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MillPro - Register';
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    if (!validatePhone(formData.phone)) {
      showToast('Please enter a valid Ethiopian phone number (+2519/7XXXXXXXX)', 'error');
      return;
    }

    const usersData = getUsers();

    // Check if user already exists
    if (usersData.customers.some(u => u.email === formData.email)) {
      showToast('User with this email already exists!', 'error');
      return;
    }

    // Create new customer
    const newCustomer = {
      id: Date.now(),
      ...formData,
      role: 'customer',
      registeredDate: new Date().toISOString(),
      orders: [],
      cart: []
    };

    // Remove confirmPassword before saving
    delete newCustomer.confirmPassword;

    usersData.customers.push(newCustomer);
    saveUsers(usersData);

    showToast('Registration successful! You can now login.', 'success');
    navigate('/login');
  };

  return (
    <main>
      <div className="container" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <h2><i className="fas fa-user-plus"></i> Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone (+2519/7) *</label>
              <input 
                type="tel" 
                id="phone" 
                pattern="\+251[97]\d{8}"
                placeholder="+251911223344"
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="backupPhone">Backup Phone (Optional)</label>
              <input 
                type="tel" 
                id="backupPhone" 
                pattern="\+251[97]\d{8}"
                placeholder="+251911223344"
                value={formData.backupPhone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea 
                id="address" 
                rows="2" 
                value={formData.address}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input 
                type="password" 
                id="password" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary btn-block">Register</button>
            </div>
            <div className="form-footer">
              <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Register;