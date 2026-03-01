import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FaMoon, FaSun, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <button onClick={toggleTheme} className="dark-mode-btn">
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          {!user && (
            <div className="auth-buttons">
              <button onClick={() => navigate('/login')} className="btn btn-outline">
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
              <button onClick={() => navigate('/register')} className="btn btn-primary">
                <i className="fas fa-user-plus"></i> Register
              </button>
            </div>
          )}
        </div>

        <div className="nav-center">
          <h1 className="logo">Mill<span>Pro</span></h1>
        </div>

        <div className="nav-right">
          <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
            {navLinks.map(link => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  className="nav-link"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user && (
              <>
                {user.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="nav-link">Dashboard</Link>
                  </li>
                )}
                {user.role === 'customer' && (
                  <li>
                    <Link to="/customer" className="nav-link">Dashboard</Link>
                  </li>
                )}
                {user.role === 'operator' && (
                  <li>
                    <Link to="/operator" className="nav-link">Dashboard</Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="btn btn-danger">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </li>
              </>
            )}
          </ul>
          <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;