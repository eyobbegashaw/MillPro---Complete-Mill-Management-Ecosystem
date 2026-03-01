import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers } from '../../utils/storage';
import OperatorSidebar from './OperatorSidebar';
import OperatorHeader from './OperatorHeader';
import OperatorDashboardHome from './OperatorDashboardHome';
import OperatorOrders from './OperatorOrders';
import OfflineOrders from './OfflineOrders';
import OperatorMessages from './OperatorMessages';
import History from './History';
import OperatorSettings from './OperatorSettings';
import '../../styles/operator/operator.css';

const OperatorDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    totalAssigned: 0,
    completedToday: 0,
    processingNow: 0,
    todayEarnings: 0
  });
  const [notificationCount, setNotificationCount] = useState(0);

  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Operator Dashboard - MillPro';
    loadStats();
    checkNotifications();
  }, []);

  const loadStats = () => {
    const usersData = getUsers();
    const orders = usersData.orders || [];
    const today = new Date().toISOString().split('T')[0];

    const assignedOrders = orders.filter(order => 
      order.assignedTo === user?.id || 
      (order.assignedTo && order.assignedTo.includes(user?.id))
    );

    const todayOrders = assignedOrders.filter(o => 
      o.orderDate && o.orderDate.startsWith(today)
    );

    const pending = assignedOrders.filter(o => 
      o.status === 'pending' || o.status === 'processing'
    );

    const completedToday = todayOrders.filter(o => o.status === 'completed').length;
    const processingNow = assignedOrders.filter(o => o.status === 'processing').length;
    const todayEarnings = todayOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    setStats({
      todayOrders: todayOrders.length,
      pendingOrders: pending.length,
      totalAssigned: assignedOrders.length,
      completedToday,
      processingNow,
      todayEarnings
    });
  };

  const checkNotifications = () => {
    const usersData = getUsers();
    const messages = usersData.messages || [];
    const orders = usersData.orders || [];

    const unreadMessages = messages.filter(msg => 
      msg.receiverId === user?.id && !msg.read
    ).length;

    const pendingOrders = orders.filter(order => 
      (order.assignedTo === user?.id || order.assignedTo?.includes(user?.id)) &&
      order.status === 'pending'
    ).length;

    setNotificationCount(unreadMessages + pendingOrders);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="operator-container">
      <OperatorSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        stats={stats}
        notificationCount={notificationCount}
      />

      <main className="operator-main">
        <OperatorHeader 
          activeSection={activeSection}
          toggleSidebar={toggleSidebar}
          user={user}
          onLogout={handleLogout}
          notificationCount={notificationCount}
        />

        <div className="content-wrapper">
          {activeSection === 'dashboard' && (
            <OperatorDashboardHome 
              user={user}
              stats={stats}
              onRefresh={loadStats}
            />
          )}
          
          {activeSection === 'orders' && (
            <OperatorOrders 
              user={user}
              onUpdate={loadStats}
            />
          )}
          
          {activeSection === 'offline' && (
            <OfflineOrders 
              user={user}
              onUpdate={loadStats}
            />
          )}
          
          {activeSection === 'messages' && (
            <OperatorMessages user={user} />
          )}
          
          {activeSection === 'history' && (
            <History user={user} />
          )}
          
          {activeSection === 'settings' && (
            <OperatorSettings user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;