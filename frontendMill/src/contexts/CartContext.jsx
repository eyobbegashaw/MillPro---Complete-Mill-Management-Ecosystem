import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  // Load cart from localStorage or API
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromAPI();
    } else {
      loadCartFromStorage();
    }
    loadSavedItems();
  }, [isAuthenticated, user]);

  const loadCartFromAPI = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data.items || []);
    } catch (error) {
      console.error('Load cart error:', error);
      loadCartFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error('Parse cart error:', error);
        setCart([]);
      }
    }
  };

  const loadSavedItems = () => {
    const stored = localStorage.getItem('savedItems');
    if (stored) {
      try {
        setSavedItems(JSON.parse(stored));
      } catch (error) {
        console.error('Parse saved items error:', error);
        setSavedItems([]);
      }
    }
  };

  const saveCart = async (newCart) => {
    setCart(newCart);
    
    if (isAuthenticated && user) {
      try {
        await api.post('/cart', { items: newCart });
      } catch (error) {
        console.error('Save cart to API error:', error);
        // Fallback to localStorage
        localStorage.setItem('cart', JSON.stringify(newCart));
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product._id);
      
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        saveCart(updatedCart);
        toast.success('Cart updated');
        return updatedCart;
      } else {
        const newItem = {
          productId: product._id,
          name: product.name,
          price: product.price,
          millingFee: product.millingFee || 0,
          image: product.images?.[0],
          quantity,
          maxQuantity: product.maxQuantity,
          minQuantity: product.minQuantity || 1
        };
        const updatedCart = [...prevCart, newItem];
        saveCart(updatedCart);
        toast.success('Added to cart');
        return updatedCart;
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.productId !== productId);
      saveCart(updatedCart);
      toast.info('Removed from cart');
      return updatedCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      );
      saveCart(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (isAuthenticated && user) {
      api.delete('/cart').catch(console.error);
    } else {
      localStorage.removeItem('cart');
    }
    toast.info('Cart cleared');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const millingTotal = (item.millingFee || 0) * item.quantity;
      return total + itemTotal + millingTotal;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const saveForLater = (productId) => {
    const item = cart.find(i => i.productId === productId);
    if (item) {
      removeFromCart(productId);
      setSavedItems(prev => {
        const newSaved = [...prev, item];
        localStorage.setItem('savedItems', JSON.stringify(newSaved));
        toast.success('Saved for later');
        return newSaved;
      });
    }
  };

  const moveToCart = (savedItemId) => {
    const item = savedItems.find(i => i.productId === savedItemId);
    if (item) {
      setSavedItems(prev => {
        const newSaved = prev.filter(i => i.productId !== savedItemId);
        localStorage.setItem('savedItems', JSON.stringify(newSaved));
        return newSaved;
      });
      
      addToCart({
        _id: item.productId,
        name: item.name,
        price: item.price,
        millingFee: item.millingFee,
        images: item.image ? [item.image] : []
      }, item.quantity);
    }
  };

  const removeSaved = (productId) => {
    setSavedItems(prev => {
      const newSaved = prev.filter(i => i.productId !== productId);
      localStorage.setItem('savedItems', JSON.stringify(newSaved));
      toast.info('Removed from saved items');
      return newSaved;
    });
  };

  const validateCart = () => {
    const errors = [];
    cart.forEach(item => {
      if (item.minQuantity && item.quantity < item.minQuantity) {
        errors.push(`${item.name}: Minimum quantity is ${item.minQuantity}kg`);
      }
      if (item.maxQuantity && item.quantity > item.maxQuantity) {
        errors.push(`${item.name}: Maximum quantity is ${item.maxQuantity}kg`);
      }
    });
    return errors;
  };

  const value = {
    cart,
    savedItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    saveForLater,
    moveToCart,
    removeSaved,
    validateCart,
    itemCount: getItemCount(),
    total: getCartTotal()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};