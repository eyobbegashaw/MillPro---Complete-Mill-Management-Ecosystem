import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers } from '../utils/storage';
import { formatCurrency } from '../utils/helpers';

const Services = () => {
  const [products, setProducts] = useState([]);
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MillPro - Services';
    loadProducts();
  }, []);

  const loadProducts = () => {
    const usersData = getUsers();
    const postedProducts = (usersData.products || []).filter(p => p.posted);
    setProducts(postedProducts);
  };

  const handleOrder = (productId) => {
    if (!user) {
      showToast('Please login to place an order', 'warning');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      showToast('Only customers can place orders', 'warning');
      return;
    }

    // Store product ID for order form
    localStorage.setItem('orderProductId', productId);
    navigate('/customer?order=true');
  };

  const handleAddToCart = (productId) => {
    if (!user) {
      showToast('Please login to add items to cart', 'warning');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      showToast('Only customers can add to cart', 'warning');
      return;
    }

    // Add to cart logic will be handled in customer dashboard
    localStorage.setItem('addToCartProduct', productId);
    navigate('/customer?cart=true');
  };

  return (
    <main>
      <section id="services" className="section active">
        <div className="container">
          <h2 className="section-title">Our Products & Services</h2>
          <p className="section-subtitle">Fresh Grains, Legumes, and Milling Services</p>
          
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-description">{product.description}</p>
                  <div className="product-details">
                    <p><strong>Origin:</strong> {product.origin}</p>
                    <p><strong>Quality:</strong> {product.quality}</p>
                    <p><strong>Min. Quantity:</strong> {product.minQuantity}kg</p>
                  </div>
                  <div className="product-price">
                    Price: {formatCurrency(product.price)}/kg<br />
                    Milling: {formatCurrency(product.millingFee)}/kg
                  </div>
                  <div className="product-actions">
                    <button 
                      className="btn btn-primary btn-block"
                      onClick={() => handleOrder(product.id)}
                    >
                      <i className="fas fa-shopping-cart"></i> Buy Now
                    </button>
                    <button 
                      className="btn btn-outline btn-block"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <i className="fas fa-heart"></i> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Services;