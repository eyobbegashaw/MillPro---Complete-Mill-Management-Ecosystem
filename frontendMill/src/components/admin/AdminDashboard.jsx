import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import WarehouseManagement from './WarehouseManagement';
import ProductManagement from './ProductManagement';
import OperatorManagement from './OperatorManagement';
import CustomerManagement from './CustomerManagement';
import FinanceManagement from './FinanceManagement';
import Reports from './Reports';
import Settings from './Settings';
import Messages from './Messages';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardHome from './DashboardHome';
import '../../styles/admin/admin.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin Dashboard - MillPro';
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-container">
      <AdminSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        <AdminHeader 
          activeSection={activeSection}
          toggleSidebar={toggleSidebar}
          user={user}
          onLogout={handleLogout}
        />

        <div className="content-wrapper">
          {activeSection === 'dashboard' && <DashboardHome />}
          {activeSection === 'warehouse' && <WarehouseManagement />}
          {activeSection === 'products' && <ProductManagement />}
          {activeSection === 'operators' && <OperatorManagement />}
          {activeSection === 'customers' && <CustomerManagement />}
          {activeSection === 'finance' && <FinanceManagement />}
          {activeSection === 'reports' && <Reports />}
          {activeSection === 'settings' && <Settings />}
          {activeSection === 'messages' && <Messages />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;