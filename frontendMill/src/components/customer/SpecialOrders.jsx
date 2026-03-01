import React, { useState, useEffect } from 'react';
import { FaStar, FaHistory, FaCalculator, FaPaperPlane } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Modal from '../common/Modal';

const SpecialOrders = ({ user }) => {
  const [formData, setFormData] = useState({
    productType: '',
    quantity: '',
    millingType: '',
    pickupAddress: user?.address || '',
    deliveryAddress: user?.address || '',
    pickupDate: '',
    deliveryDate: '',
    instructions: ''
  });

  const [priceCalculation, setPriceCalculation] = useState({
    millingFeePerKg: 10,
    distance: 5,
    millingTotal: 0,
    transportTotal: 0,
    orderTotal: 0
  });

  const [specialOrders, setSpecialOrders] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const { showToast } = useNotification();

  useEffect(() => {
    loadSpecialOrders();
  }, []);

  const loadSpecialOrders = () => {
    const usersData = getUsers();
    const orders = (usersData.orders || [])
      .filter(order => order.customerId === user?.id && order.orderType === 'special')
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    setSpecialOrders(orders);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const calculatePrice = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const millingType = formData.millingType;

    let millingFeePerKg = 10; // Base fee
    if (millingType === 'fine') millingFeePerKg = 15;
    if (millingType === 'coarse') millingFeePerKg = 8;

    const distance = 5; // Estimated distance in km
    const transportFeePerKm = 5;

    const millingTotal = quantity * millingFeePerKg;
    const transportTotal = distance * transportFeePerKm;
    const orderTotal = millingTotal + transportTotal;

    setPriceCalculation({
      millingFeePerKg,
      distance,
      millingTotal,
      transportTotal,
      orderTotal
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const orderData = {
      id: Date.now(),
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      orderType: 'special',
      productName: getProductTypeLabel(formData.productType),
      productType: formData.productType,
      quantity: parseFloat(formData.quantity),
      millingType: formData.millingType,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      pickupDate: formData.pickupDate,
      deliveryDate: formData.deliveryDate,
      specialInstructions: formData.instructions,
      total: priceCalculation.orderTotal,
      status: 'pending',
      orderDate: new Date().toISOString()
    };

    // Assign to operator
    assignToOperator(orderData);

    const usersData = getUsers();
    usersData.orders.push(orderData);
    saveUsers(usersData);

    setLastOrder(orderData);
    setShowSuccessModal(true);
    resetForm();
    loadSpecialOrders();
  };

  const validateForm = () => {
    const required = ['productType', 'quantity', 'millingType', 'pickupAddress', 'deliveryAddress', 'pickupDate', 'deliveryDate'];
    
    for (const field of required) {
      if (!formData[field]) {
        showToast('Please fill in all required fields', 'error');
        return false;
      }
    }

    const pickup = new Date(formData.pickupDate);
    const delivery = new Date(formData.deliveryDate);

    if (delivery < pickup) {
      showToast('Delivery date must be after pickup date', 'error');
      return false;
    }

    return true;
  };

  const assignToOperator = (order) => {
    const usersData = getUsers();
    const operators = usersData.operators || [];

    // Find operator assigned to this product type
    const assignedOperator = operators.find(operator => 
      operator.assignments && 
      operator.assignments.some(assignment => 
        assignment.toLowerCase().includes(order.productType.toLowerCase())
      )
    );

    if (assignedOperator) {
      order.assignedTo = assignedOperator.id;
      order.operatorName = assignedOperator.name;
      order.operatorPhone = assignedOperator.phone;
    }
  };

  const getProductTypeLabel = (type) => {
    const types = {
      teff: 'Teff',
      barley: 'Barley',
      wheat: 'Wheat',
      sorghum: 'Sorghum',
      legume: 'Legume',
      other: 'Other'
    };
    return types[type] || type;
  };

  const resetForm = () => {
    setFormData({
      productType: '',
      quantity: '',
      millingType: '',
      pickupAddress: user?.address || '',
      deliveryAddress: user?.address || '',
      pickupDate: '',
      deliveryDate: '',
      instructions: ''
    });
    setPriceCalculation({
      millingFeePerKg: 10,
      distance: 5,
      millingTotal: 0,
      transportTotal: 0,
      orderTotal: 0
    });
  };

  return (
    <>
      <div className="section-header">
        <h2>Special Orders</h2>
        <p>Get milling service for your own grains</p>
      </div>

      <div className="special-order-form">
        {/* Order Form */}
        <div className="form-card">
          <h3><FaStar /> Create Special Order</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="productType">Product Type *</label>
              <select id="productType" value={formData.productType} onChange={handleInputChange} required>
                <option value="">Select Product Type</option>
                <option value="teff">Teff</option>
                <option value="barley">Barley</option>
                <option value="wheat">Wheat</option>
                <option value="sorghum">Sorghum</option>
                <option value="legume">Legume</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantity (kg) *</label>
                <input 
                  type="number" 
                  id="quantity" 
                  step="0.1" 
                  min="1" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onBlur={calculatePrice}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="millingType">Milling Type *</label>
                <select id="millingType" value={formData.millingType} onChange={handleInputChange} onBlur={calculatePrice} required>
                  <option value="">Select Type</option>
                  <option value="regular">Regular Milling</option>
                  <option value="fine">Fine Milling</option>
                  <option value="coarse">Coarse Milling</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupAddress">Pickup Address *</label>
                <input 
                  type="text" 
                  id="pickupAddress" 
                  value={formData.pickupAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="deliveryAddress">Delivery Address *</label>
                <input 
                  type="text" 
                  id="deliveryAddress" 
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupDate">Pickup Date *</label>
                <input 
                  type="date" 
                  id="pickupDate" 
                  value={formData.pickupDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="deliveryDate">Delivery Date *</label>
                <input 
                  type="date" 
                  id="deliveryDate" 
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="instructions">Special Instructions</label>
              <textarea 
                id="instructions" 
                rows="3" 
                placeholder="Any special requirements for milling..."
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </div>

            {/* Price Calculation */}
            <div className="price-calculation">
              <h4>Price Calculation</h4>
              <div className="calculation-row">
                <span>Milling Fee (per kg):</span>
                <span>{formatCurrency(priceCalculation.millingFeePerKg)}</span>
              </div>
              <div className="calculation-row">
                <span>Transport Fee (per km):</span>
                <span>5 Birr</span>
              </div>
              <div className="calculation-row">
                <span>Distance (estimated):</span>
                <span>{priceCalculation.distance} km</span>
              </div>
              <div className="calculation-row total">
                <span>Total Price:</span>
                <span>{formatCurrency(priceCalculation.orderTotal)}</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={calculatePrice}>
                <FaCalculator /> Calculate
              </button>
              <button type="submit" className="btn btn-primary">
                <FaPaperPlane /> Place Special Order
              </button>
            </div>
          </form>
        </div>

        {/* Order History */}
        <div className="special-orders-history">
          <div className="card-header">
            <h3><FaHistory /> Special Orders History</h3>
          </div>
          <div className="history-list">
            {specialOrders.length > 0 ? (
              specialOrders.map(order => (
                <div key={order.id} className="history-item">
                  <div className="history-item-header">
                    <div className="history-item-id">Special Order #{order.id.toString().slice(-6)}</div>
                    <div className={`order-status status-${order.status || 'pending'}`}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                    </div>
                  </div>
                  <div className="history-item-details">
                    <span>{order.productName || 'Milling Service'}</span>
                    <span>{order.quantity} kg</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  <div className="history-item-date">{formatDate(order.orderDate)}</div>
                </div>
              ))
            ) : (
              <p>No special orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        title="Order Placed Successfully!"
      >
        {lastOrder && (
          <div className="order-success">
            <i className="fas fa-check-circle"></i>
            <h3>Your special order has been placed!</h3>
            
            <div className="order-summary">
              <p><strong>Order ID:</strong> #{lastOrder.id.toString().slice(-6)}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(lastOrder.total)}</p>
              {lastOrder.operatorName ? (
                <>
                  <p><strong>Assigned Operator:</strong> {lastOrder.operatorName}</p>
                  <p><strong>Operator Phone:</strong> {lastOrder.operatorPhone}</p>
                </>
              ) : (
                <p>An operator will be assigned shortly</p>
              )}
            </div>
            
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>
                Continue
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SpecialOrders;