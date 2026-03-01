import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/common/Modal';

const Cart = ({ cart, onUpdateCart }) => {
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    address: '',
    paymentMethod: '',
    notes: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const { user } = useAuth();
  const { showToast } = useNotification();

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const millingTotal = cart.reduce((sum, item) => sum + ((item.millingFee || 0) * item.quantity), 0);
    const orderTotal = subtotal + millingTotal + 20;
    return { subtotal, millingTotal, orderTotal };
  };

  const { subtotal, millingTotal, orderTotal } = calculateTotals();

  const handleCheckout = async () => {
    if (!checkoutData.address || !checkoutData.paymentMethod) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setLoading(true);
    setPaymentProcessing(true);

    try {
      // Create orders
      const orderResult = await orderService.createBulkOrder(
        cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          millingFee: item.millingFee
        })),
        {
          customerId: user.id,
          address: checkoutData.address,
          notes: checkoutData.notes
        }
      );

      // Process payment
      if (checkoutData.paymentMethod === 'cash') {
        // Cash on delivery
        showToast('Order placed successfully! Payment will be collected on delivery.', 'success');
        onUpdateCart([]); // Clear cart
        setShowCheckoutModal(false);
      } else {
        // Online payment
        const paymentResult = await paymentService.initializePayment(
          orderResult.orders[0].id,
          checkoutData.paymentMethod
        );

        // Redirect to payment gateway
        if (paymentResult.paymentUrl) {
          window.location.href = paymentResult.paymentUrl;
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to process order', 'error');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handlePaymentCallback = async (paymentId) => {
    try {
      const result = await paymentService.verifyPayment(paymentId);
      if (result.success) {
        showToast('Payment successful!', 'success');
        onUpdateCart([]);
      } else {
        showToast('Payment failed. Please try again.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Payment verification failed', 'error');
    }
  };

  return (
    <>
      <div className="cart-container">
        {/* Cart items display */}
        <div className="cart-items">
          {cart.map((item, index) => (
            <div key={index} className="cart-item">
              {/* Cart item details */}
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Milling Service</span>
              <span>{formatCurrency(millingTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Order Fee</span>
              <span>20 Birr</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-block" 
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal 
        isOpen={showCheckoutModal} 
        onClose={() => !paymentProcessing && setShowCheckoutModal(false)}
        title="Checkout"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
          {/* Form fields */}
          <div className="form-group">
            <label htmlFor="address">Delivery Address *</label>
            <textarea 
              id="address" 
              rows="3" 
              value={checkoutData.address}
              onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
              required
              disabled={paymentProcessing}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select 
              id="paymentMethod" 
              value={checkoutData.paymentMethod}
              onChange={(e) => setCheckoutData({...checkoutData, paymentMethod: e.target.value})}
              required
              disabled={paymentProcessing}
            >
              <option value="">Select Payment Method</option>
              <option value="cbe">CBE</option>
              <option value="telebirr">Telebirr</option>
              <option value="cash">Cash on Delivery</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setShowCheckoutModal(false)}
              disabled={paymentProcessing}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={paymentProcessing}
            >
              {paymentProcessing ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Cart;