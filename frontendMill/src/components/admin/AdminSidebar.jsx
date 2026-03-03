import React from 'react';
import { 
  FaTachometerAlt, FaWarehouse, FaShoppingBasket, FaUsersCog, 
  FaUsers, FaChartPie, FaChartBar, FaCog, FaEnvelope 
} from 'react-icons/fa';

const AdminSidebar = ({ activeSection, setActiveSection, sidebarOpen, toggleSidebar, user, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { id: 'warehouse', icon: FaWarehouse, label: 'Warehouse' },
    { id: 'products', icon: FaShoppingBasket, label: 'Products' },
    { id: 'operators', icon: FaUsersCog, label: 'Operators' },
    { id: 'customers', icon: FaUsers, label: 'Customers' },
    { id: 'finance', icon: FaChartPie, label: 'Finance' },
    { id: 'reports', icon: FaChartBar, label: 'Reports' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
    { id: 'messages', icon: FaEnvelope, label: 'Messages' }
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
      <div className="admin-profile">
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=4CAF50&color=fff`} 
          alt="Admin" 
        />
        <h3>{user?.name || 'System Admin'}</h3>
        <p>{user?.email || 'admin@millpro.com'}</p>
      </div>
      
      <nav className="admin-nav">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <div 
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.id === 'messages' && <span className="badge" id="messageCount">0</span>}
              </div>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-indicator online"></div>
          <span>System Online</span>
        </div>
        <p className="version">v1.0.0</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;