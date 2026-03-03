import React from 'react';
import { 
  FaTachometerAlt, FaClipboardList, FaStore, 
  FaComments, FaHistory, FaCog, FaExclamationTriangle 
} from 'react-icons/fa';

const OperatorSidebar = ({ 
  activeSection, setActiveSection, sidebarOpen, 
  toggleSidebar, user, stats, notificationCount 
}) => {
  const navItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { id: 'orders', icon: FaClipboardList, label: 'My Orders', badge: stats.pendingOrders },
    { id: 'offline', icon: FaStore, label: 'Offline Orders' },
    { id: 'messages', icon: FaComments, label: 'Messages', badge: notificationCount },
    { id: 'history', icon: FaHistory, label: 'History' },
    { id: 'settings', icon: FaCog, label: 'Settings' }
  ];

  return (
    <aside className={`operator-sidebar ${sidebarOpen ? 'active' : ''}`}>
      <div className="operator-profile">
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Operator')}&background=2196F3&color=fff`} 
          alt="Operator" 
        />
        <div className="profile-info">
          <h3>{user?.name || 'Operator Name'}</h3>
          <p>{user?.email || 'operator@millpro.com'}</p>
          <div className="operator-status">
            <span className="status-dot active"></span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Assignments Section */}
      <div className="assignments-section">
        <h4><i className="fas fa-tasks"></i> My Assignments</h4>
        <div className="assignments-list">
          {user?.assignments?.map((assignment, index) => (
            <div key={index} className="assignment-item">
              <h5>{assignment}</h5>
              <div className="assignment-stats">
                <span>Orders: 0</span>
                <span>Pending: 0</span>
              </div>
            </div>
          ))}
          {(!user?.assignments || user.assignments.length === 0) && (
            <p>No assignments yet</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <FaClipboardList />
          <div>
            <h4>{stats.todayOrders}</h4>
            <small>Today's Orders</small>
          </div>
        </div>
        <div className="stat-item">
          <FaHistory />
          <div>
            <h4>{stats.pendingOrders}</h4>
            <small>Pending</small>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="operator-nav">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <div 
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(item.id);
                  if (window.innerWidth <= 768) toggleSidebar();
                }}
              >
                <div>
                  <item.icon />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="badge">{item.badge}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Inventory Alert */}
      <div className="inventory-alert" style={{ display: 'none' }}>
        <FaExclamationTriangle />
        <p>Low inventory alert!</p>
        <span className="alert-link">View details</span>
      </div>
    </aside>
  );
};

export default OperatorSidebar;