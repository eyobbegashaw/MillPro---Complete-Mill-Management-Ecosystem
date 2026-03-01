import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';

const DriverHeader = ({ driver, onToggleAvailability }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.querySelector('.driver-sidebar')?.classList.toggle('active');
  };
  
  return (
    <header className="driver-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="header-title">
          <h1>Driver Dashboard</h1>
          <p className="date-display">
            {formatDate(currentTime)} {formatTime(currentTime)}
          </p>
        </div>
      </div>
      
      <div className="header-right">
        <div className="quick-actions">
          <div 
            className={`availability-toggle ${driver?.status}`}
            onClick={onToggleAvailability}
          >
            <i className={`fas fa-${driver?.status === 'available' ? 'toggle-on' : 'toggle-off'}`}></i>
            <span>{driver?.status === 'available' ? 'Online' : 'Offline'}</span>
          </div>
          
          <button className="btn btn-sm btn-outline" id="darkModeToggle">
            <i className="fas fa-moon"></i>
          </button>
          
          <button className="btn btn-sm btn-outline" id="notifyBtn">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">0</span>
          </button>
          
          <button className="btn btn-sm btn-primary" id="refreshBtn">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        <button className="btn btn-danger" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </header>
  );
};

export default DriverHeader;