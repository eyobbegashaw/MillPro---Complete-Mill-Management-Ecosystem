import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency } from '../../utils/helpers';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    millingFee: '',
    minQuantity: '',
    origin: '',
    quality: 'Grade A',
    description: '',
    image: ''
  });

  const { showToast } = useNotification();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const usersData = getUsers();
    setProducts(usersData.products || []);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData({
      ...formData,
      category,
      subcategory: ''
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      millingFee: '',
      minQuantity: '',
      origin: '',
      quality: 'Grade A',
      description: '',
      image: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const usersData = getUsers();
    
    const productData = {
      id: editingProduct ? editingProduct.id : Date.now(),
      ...formData,
      price: parseFloat(formData.price),
      millingFee: parseFloat(formData.millingFee),
      minQuantity: parseFloat(formData.minQuantity),
      posted: editingProduct ? editingProduct.posted : false,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    if (!usersData.products) usersData.products = [];

    if (editingProduct) {
      const index = usersData.products.findIndex(p => p.id === editingProduct.id);
      if (index !== -1) {
        usersData.products[index] = productData;
      }
    } else {
      usersData.products.push(productData);
    }

    saveUsers(usersData);
    loadProducts();
    resetForm();
    showToast(`Product ${editingProduct ? 'updated' : 'saved'} successfully!`, 'success');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      price: product.price || '',
      millingFee: product.millingFee || '',
      minQuantity: product.minQuantity || '',
      origin: product.origin || '',
      quality: product.quality || 'Grade A',
      description: product.description || '',
      image: product.image || ''
    });
    setShowForm(true);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const usersData = getUsers();
      usersData.products = usersData.products.filter(p => p.id !== productId);
      saveUsers(usersData);
      loadProducts();
      showToast('Product deleted successfully!', 'success');
    }
  };

  const togglePost = (productId) => {
    const usersData = getUsers();
    const productIndex = usersData.products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
      usersData.products[productIndex].posted = !usersData.products[productIndex].posted;
      saveUsers(usersData);
      loadProducts();
      showToast(`Product ${usersData.products[productIndex].posted ? 'posted' : 'unposted'} successfully!`, 'success');
    }
  };

  const getSubcategories = () => {
    switch(formData.category) {
      case 'Grain':
        return ['Teff', 'Barley', 'Wheat', 'Sorghum', 'Millet', 'Flax'];
      case 'Legume':
        return ['Peas', 'Beans', 'Lentils', 'Chickpeas', 'Bolokhi', 'Corn'];
      case 'Other':
        return ['Pepper', 'Spices', 'Whole Grains', 'Oats', 'Other'];
      default:
        return [];
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>Product Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="form-card">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input type="text" id="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" value={formData.category} onChange={handleCategoryChange} required>
                  <option value="">Select Category</option>
                  <option value="Grain">Grain</option>
                  <option value="Legume">Legume</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subcategory">Subcategory</label>
                <select id="subcategory" value={formData.subcategory} onChange={handleInputChange}>
                  <option value="">Select Subcategory</option>
                  {getSubcategories().map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (Birr/kg) *</label>
                <input type="number" id="price" step="0.01" value={formData.price} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="millingFee">Milling Fee (Birr/kg) *</label>
                <input type="number" id="millingFee" step="0.01" value={formData.millingFee} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="minQuantity">Minimum Quantity (kg) *</label>
                <input type="number" id="minQuantity" step="0.1" value={formData.minQuantity} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="origin">Origin</label>
                <input type="text" id="origin" value={formData.origin} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="quality">Quality Grade</label>
                <select id="quality" value={formData.quality} onChange={handleInputChange}>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Image URL</label>
              <input type="url" id="image" value={formData.image} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <FaSave /> {editingProduct ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid-admin">
        {products.map(product => (
          <div className="product-card-admin" key={product.id}>
            {product.image && (
              <div className="product-image-admin">
                <img src={product.image} alt={product.name} />
              </div>
            )}
            <div className="product-content-admin">
              <h4>{product.name}</h4>
              <p className="product-category">{product.category}</p>
              <p className="product-price">{formatCurrency(product.price)}/kg</p>
              <p className="product-milling">Milling: {formatCurrency(product.millingFee)}/kg</p>
              <p className="product-description">{product.description || ''}</p>
              
              {product.posted && (
                <div className="posted-badge">Posted</div>
              )}
              
              <div className="product-actions-admin">
                <button 
                  className={`btn btn-sm ${product.posted ? 'btn-outline' : 'btn-primary'}`}
                  onClick={() => togglePost(product.id)}
                >
                  {product.posted ? <FaEyeSlash /> : <FaEye />}
                  {product.posted ? 'Unpost' : 'Post'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(product)}>
                  <FaEdit /> Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductManagement;