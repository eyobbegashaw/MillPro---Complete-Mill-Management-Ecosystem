import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Modal from '../components/common/Modal';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [userType, setUserType] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const { login, forgotPassword } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password, userType);

    if (result.success) {
      showToast('Login successful!', 'success');
      
      // Redirect based on role
      if (userType === 'admin') {
        navigate('/admin');
      } else if (userType === 'operator') {
        navigate('/operator');
      } else {
        navigate('/customer');
      }
    } else {
      showToast(result.error, 'error');
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(forgotEmail);

    if (result.success) {
      showToast('Password reset email sent! Please check your inbox.', 'success');
      setShowForgotModal(false);
      setForgotEmail('');
    } else {
      showToast(result.error, 'error');
    }

    setLoading(false);
  };

  return (
    <main>
      <div className="container" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <h2><i className="fas fa-sign-in-alt"></i> Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={formData.email}
                onChange={handleChange}
                required 
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            <div className="form-footer">
              <button 
                type="button" 
                className="btn-link" 
                onClick={() => setShowForgotModal(true)}
                disabled={loading}
              >
                Forgot Password?
              </button>
              <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
            <div className="user-type">
              <label>Login as:</label>
              <div className="user-options">
                <label>
                  <input 
                    type="radio" 
                    name="userType" 
                    value="customer" 
                    checked={userType === 'customer'}
                    onChange={(e) => setUserType(e.target.value)}
                    disabled={loading}
                  /> Customer
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="userType" 
                    value="operator"
                    checked={userType === 'operator'}
                    onChange={(e) => setUserType(e.target.value)}
                    disabled={loading}
                  /> Operator
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="userType" 
                    value="admin"
                    checked={userType === 'admin'}
                    onChange={(e) => setUserType(e.target.value)}
                    disabled={loading}
                  /> Admin
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Modal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)}
        title="Reset Password"
      >
        <form onSubmit={handleForgotPassword}>
          <div className="form-group">
            <label htmlFor="forgotEmail">Email Address</label>
            <input 
              type="email" 
              id="forgotEmail"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required 
              disabled={loading}
            />
          </div>
          <p className="info-text">We'll send you a link to reset your password.</p>
          <div className="form-group">
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
};

export default Login;