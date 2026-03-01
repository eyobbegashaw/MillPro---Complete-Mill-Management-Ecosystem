import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, getCart, saveCart, getSavedItems, saveSavedItems } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import CustomerHeader from './CustomerHeader';
import DashboardHome from './DashboardHome';
import Products from './Products';
import Cart from './Cart';
import MyOrders from './MyOrders';
import SpecialOrders from './SpecialOrders';
import CustomerMessages from './CustomerMessages';
import CustomerSettings from './CustomerSettings';
import '../../styles/customer/customer.css';

const CustomerDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Customer Dashboard - MillPro';
    loadUserData();
  }, []);

  useEffect(() => {
    updateCartCount();
  }, [cart]);

  const loadUserData = () => {
    if (user) {
      const userCart = getCart(user.id);
      setCart(userCart);
      
      const userSaved = getSavedItems(user.id);
      setSavedItems(userSaved);
    }
  };

  const updateCartCount = () => {
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        millingFee: product.millingFee,
        quantity: product.minQuantity || 1,
        image: product.image,
        addedAt: new Date().toISOString()
      }];
    }
    
    setCart(updatedCart);
    saveCart(user.id, updatedCart);
    showToast('Product added to cart', 'success');
  };

  const updateCartQuantity = (index, newQuantity) => {
    if (newQuantity < 0.5) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    saveCart(user.id, updatedCart);
  };

  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    saveCart(user.id, updatedCart);
    showToast('Item removed from cart', 'success');
  };

  const toggleSaveItem = (product) => {
    const existingIndex = savedItems.findIndex(item => item.productId === product.id);
    
    let updatedSaved;
    if (existingIndex !== -1) {
      updatedSaved = savedItems.filter((_, i) => i !== existingIndex);
      showToast('Removed from saved items', 'success');
    } else {
      updatedSaved = [...savedItems, {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        savedAt: new Date().toISOString()
      }];
      showToast('Added to saved items', 'success');
    }
    
    setSavedItems(updatedSaved);
    saveSavedItems(user.id, updatedSaved);
  };

  const moveToCart = (savedIndex) => {
    const item = savedItems[savedIndex];
    
    // Get product details from storage
    const usersData = getUsers();
    const product = usersData.products.find(p => p.id === item.productId);
    
    if (product) {
      addToCart(product);
      
      const updatedSaved = savedItems.filter((_, i) => i !== savedIndex);
      setSavedItems(updatedSaved);
      saveSavedItems(user.id, updatedSaved);
    }
  };

  const navigateToSection = (section) => {
    setActiveSection(section);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  return (
    <div className="customer-container">
      <CustomerHeader 
        activeSection={activeSection}
        setActiveSection={navigateToSection}
        cartCount={cartCount}
        user={user}
        onLogout={handleLogout}
      />

      <main className="customer-main">
        {activeSection === 'dashboard' && (
          <DashboardHome 
            user={user}
            onNavigate={navigateToSection}
            onAddToCart={addToCart}
            onToggleSave={toggleSaveItem}
          />
        )}
        
        {activeSection === 'products' && (
          <Products 
            onAddToCart={addToCart}
            onToggleSave={toggleSaveItem}
            savedItems={savedItems}
          />
        )}
        
        {activeSection === 'cart' && (
          <Cart 
            cart={cart}
            savedItems={savedItems}
            onUpdateQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onMoveToCart={moveToCart}
            onToggleSave={toggleSaveItem}
            user={user}
          />
        )}
        
        {activeSection === 'orders' && (
          <MyOrders user={user} />
        )}
        
        {activeSection === 'special' && (
          <SpecialOrders user={user} />
        )}
        
        {activeSection === 'messages' && (
          <CustomerMessages user={user} />
        )}
        
        {activeSection === 'settings' && (
          <CustomerSettings user={user} />
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;