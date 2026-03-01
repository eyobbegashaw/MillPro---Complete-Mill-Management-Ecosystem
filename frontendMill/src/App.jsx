import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CartProvider } from './contexts/CartContext';
import PrivateRoute from './components/common/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentCallback from './pages/PaymentCallback';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import WarehouseManagement from './components/admin/WarehouseManagement';
import ProductManagement from './components/admin/ProductManagement';
import OperatorManagement from './components/admin/OperatorManagement';
import CustomerManagement from './components/admin/CustomerManagement';
import FinanceManagement from './components/admin/FinanceManagement';
import Reports from './components/admin/Reports';
import AdminSettings from './components/admin/Settings';
import AdminMessages from './components/admin/Messages';
import DriverManagement from './components/admin/DriverManagement';

// Customer Components
import CustomerDashboard from './components/customer/CustomerDashboard';
import Products from './components/customer/Products';
import Cart from './components/customer/Cart';
import MyOrders from './components/customer/MyOrders';
import SpecialOrders from './components/customer/SpecialOrders';
import CustomerMessages from './components/customer/CustomerMessages';
import CustomerSettings from './components/customer/CustomerSettings';

// Operator Components
import OperatorDashboard from './components/operator/OperatorDashboard';
import OperatorOrders from './components/operator/OperatorOrders';
import OfflineOrders from './components/operator/OfflineOrders';
import OperatorMessages from './components/operator/OperatorMessages';
import History from './components/operator/History';
import OperatorSettings from './components/operator/OperatorSettings';

// Driver Components
import DriverDashboard from './components/driver/DriverDashboard';
import DeliveryTasks from './components/driver/DeliveryTasks';
import ActiveDeliveries from './components/driver/ActiveDeliveries';
import DeliveryHistory from './components/driver/DeliveryHistory';
import DriverMessages from './components/driver/DriverMessages';
import DriverSettings from './components/driver/DriverSettings';

import './styles/App.css';

function App() {
  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMapsAPI = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };
    
    if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      loadGoogleMapsAPI();
    }
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/payment/callback" element={<PaymentCallback />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <PrivateRoute role="admin">
                      <AdminDashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/warehouse" element={
                    <PrivateRoute role="admin">
                      <WarehouseManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/products" element={
                    <PrivateRoute role="admin">
                      <ProductManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/operators" element={
                    <PrivateRoute role="admin">
                      <OperatorManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/customers" element={
                    <PrivateRoute role="admin">
                      <CustomerManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/finance" element={
                    <PrivateRoute role="admin">
                      <FinanceManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <PrivateRoute role="admin">
                      <Reports />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <PrivateRoute role="admin">
                      <AdminSettings />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/messages" element={
                    <PrivateRoute role="admin">
                      <AdminMessages />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/drivers" element={
                    <PrivateRoute role="admin">
                      <DriverManagement />
                    </PrivateRoute>
                  } />
                  
                  {/* Customer Routes */}
                  <Route path="/customer" element={
                    <PrivateRoute role="customer">
                      <CustomerDashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/products" element={
                    <PrivateRoute role="customer">
                      <Products />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/cart" element={
                    <PrivateRoute role="customer">
                      <Cart />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/orders" element={
                    <PrivateRoute role="customer">
                      <MyOrders />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/special-orders" element={
                    <PrivateRoute role="customer">
                      <SpecialOrders />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/messages" element={
                    <PrivateRoute role="customer">
                      <CustomerMessages />
                    </PrivateRoute>
                  } />
                  <Route path="/customer/settings" element={
                    <PrivateRoute role="customer">
                      <CustomerSettings />
                    </PrivateRoute>
                  } />
                  
                  {/* Operator Routes */}
                  <Route path="/operator" element={
                    <PrivateRoute role="operator">
                      <OperatorDashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/operator/orders" element={
                    <PrivateRoute role="operator">
                      <OperatorOrders />
                    </PrivateRoute>
                  } />
                  <Route path="/operator/offline" element={
                    <PrivateRoute role="operator">
                      <OfflineOrders />
                    </PrivateRoute>
                  } />
                  <Route path="/operator/messages" element={
                    <PrivateRoute role="operator">
                      <OperatorMessages />
                    </PrivateRoute>
                  } />
                  <Route path="/operator/history" element={
                    <PrivateRoute role="operator">
                      <History />
                    </PrivateRoute>
                  } />
                  <Route path="/operator/settings" element={
                    <PrivateRoute role="operator">
                      <OperatorSettings />
                    </PrivateRoute>
                  } />
                  
                  {/* Driver Routes */}
                  <Route path="/driver" element={
                    <PrivateRoute role="driver">
                      <DriverDashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/driver/tasks" element={
                    <PrivateRoute role="driver">
                      <DeliveryTasks />
                    </PrivateRoute>
                  } />
                  <Route path="/driver/active" element={
                    <PrivateRoute role="driver">
                      <ActiveDeliveries />
                    </PrivateRoute>
                  } />
                  <Route path="/driver/history" element={
                    <PrivateRoute role="driver">
                      <DeliveryHistory />
                    </PrivateRoute>
                  } />
                  <Route path="/driver/messages" element={
                    <PrivateRoute role="driver">
                      <DriverMessages />
                    </PrivateRoute>
                  } />
                  <Route path="/driver/settings" element={
                    <PrivateRoute role="driver">
                      <DriverSettings />
                    </PrivateRoute>
                  } />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </CartProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;