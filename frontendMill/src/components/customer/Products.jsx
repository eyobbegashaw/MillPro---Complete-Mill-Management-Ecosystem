import React, { useState, useEffect } from 'react';
import { FaSearch, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { getUsers } from '../../utils/storage';
import { formatCurrency } from '../../utils/helpers';

const Products = ({ onAddToCart, onToggleSave, savedItems }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const usersData = getUsers();
    const postedProducts = (usersData.products || []).filter(p => p.posted);
    setProducts(postedProducts);
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => product.posted);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const isSaved = (productId) => {
    return savedItems.some(item => item.productId === productId);
  };

  const filteredProducts = filterAndSortProducts();

  return (
    <>
      <div className="section-header">
        <div className="section-title">
          <h2>Our Products</h2>
          <p>Fresh grains, legumes, and milling services</p>
        </div>
        <div className="section-controls">
          <div className="search-box">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select 
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="grain">Grains</option>
              <option value="legume">Legumes</option>
              <option value="other">Others</option>
            </select>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.image && <img src={product.image} alt={product.name} />}
              <div className="product-badge">{product.category}</div>
              <button 
                className={`favorite-btn ${isSaved(product.id) ? 'active' : ''}`}
                onClick={() => onToggleSave(product)}
              >
                <FaHeart />
              </button>
            </div>
            <div className="product-info">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-category">{product.origin || ''} | {product.quality || ''}</p>
              <p className="product-description">{product.description || ''}</p>
              <div className="product-price">{formatCurrency(product.price)}/kg</div>
              <p className="product-milling">Milling: {formatCurrency(product.millingFee || 0)}/kg</p>
              <div className="product-actions">
                <button 
                  className="btn btn-primary btn-block"
                  onClick={() => onAddToCart(product)}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <FaSearch />
          <h3>No Products Found</h3>
          <p>Try changing your search or filter criteria</p>
        </div>
      )}
    </>
  );
};

export default Products;