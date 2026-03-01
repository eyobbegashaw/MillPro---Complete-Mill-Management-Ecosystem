import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './DriverDashboard.css';

const DriverSidebar = ({ driver }) => {
  const { user } = useAuth();
  
  const getStatusClass = () => {
    switch(driver?.status) {
      case 'available': return 'available';
      case 'busy': return 'busy';
      case 'on-delivery': return 'busy';
      default: return 'offline';
    }
  };
  
  return (
    <aside className="driver-sidebar">
      <div className="driver-profile">
        <img 
          src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Driver')}&background=2196F3&color=fff`} 
          alt={user?.name}
        />
        <div className="profile-info">
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <div className="driver-status">
            <span className={`status-dot ${getStatusClass()}`}></span>
            <span>{driver?.status || 'Offline'}</span>
          </div>
        </div>
      </div>
      
      <nav className="driver-nav">
        <ul>
          <li>
            <NavLink to="/driver" className="nav-item" end>
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/driver/tasks" className="nav-item">
              <i className="fas fa-tasks"></i>
              <span>Delivery Tasks</span>
              {driver?.assignedDeliveries?.length > 0 && (
                <span className="badge">{driver.assignedDeliveries.length}</span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/driver/active" className="nav-item">
              <i className="fas fa-truck"></i>
              <span>Active Delivery</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/driver/history" className="nav-item">
              <i className="fas fa-history"></i>
              <span>Delivery History</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/driver/messages" className="nav-item">
              <i className="fas fa-comments"></i>
              <span>Messages</span>
              <span className="badge" id="messageBadge">0</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/driver/settings" className="nav-item">
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      {driver?.vehicle && (
        <div className="vehicle-info">
          <h4>
            <i className="fas fa-truck"></i>
            <span>My Vehicle</span>
          </h4>
          <div className="vehicle-details">
            <p><strong>Type:</strong> {driver.vehicle.type}</p>
            <p><strong>Plate:</strong> {driver.vehicle.plateNumber}</p>
            <p><strong>Model:</strong> {driver.vehicle.model || 'N/A'}</p>
            <p><strong>Capacity:</strong> {driver.vehicle.capacity || 'N/A'} kg</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default DriverSidebar;