import { createContext, useContext, useReducer, useEffect } from 'react';
import { showSnackbar } from '../utils/snackbar';
import cartService from '../services/cartService';
import { useAuth } from '../hooks/useAuth';

// Cart Context
const CartContext = createContext();

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
  loading: true,
};

// Action types
const CART_ACTIONS = {
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  TOGGLE_CART: 'TOGGLE_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_TO_CART: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // Update quantity if item exists
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, item.stock) }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => {
            const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
            return sum + (price * item.quantity);
          }, 0),
        };
      } else {
        // Add new item
        const newItem = {
          ...action.payload,
          quantity: Math.min(action.payload.quantity, action.payload.stock || 999),
        };
        
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => {
            const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
            return sum + (price * item.quantity);
          }, 0),
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_FROM_CART: {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => {
          const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
          return sum + (price * item.quantity);
        }, 0),
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => {
          const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
          return sum + (price * item.quantity);
        }, 0),
      };
    }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    
    case CART_ACTIONS.TOGGLE_CART:
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        ...action.payload,
        loading: false,
      };
    
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart from Firebase on mount and when user changes
  useEffect(() => {
    if (user) {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      cartService.getCart(user.uid)
        .then(result => {
          if (result.success) {
            dispatch({ 
              type: CART_ACTIONS.LOAD_CART, 
              payload: {
                items: result.cart.items || [],
                totalItems: result.cart.totalItems || 0,
                totalPrice: result.cart.totalPrice || 0,
              }
            });
          } else {
            console.error('Error loading cart:', result.error);
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
          }
        })
        .catch(error => {
          console.error('Error loading cart:', error);
          dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        });
    } else {
      // Clear cart when user logs out
      dispatch({ 
        type: CART_ACTIONS.LOAD_CART, 
        payload: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        }
      });
    }
  }, [user]);

  // Actions
  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      showSnackbar('Please login to add items to cart', 'warning');
      return false;
    }

    if (!product || product.stock === 0) {
      showSnackbar('Product is out of stock', 'error');
      return false;
    }

    const availableQuantity = Math.min(quantity, product.stock);
    if (availableQuantity <= 0) {
      showSnackbar('Product is out of stock', 'error');
      return false;
    }

    try {
      const result = await cartService.addToCart(user.uid, product, availableQuantity);
      if (result.success) {
        dispatch({
          type: CART_ACTIONS.LOAD_CART,
          payload: {
            items: result.cart.items,
            totalItems: result.cart.totalItems,
            totalPrice: result.cart.totalPrice,
          }
        });

        showSnackbar(
          `${product.name} (${availableQuantity} item${availableQuantity > 1 ? 's' : ''}) added to cart`,
          'success'
        );
        return true;
      } else {
        showSnackbar(result.error || 'Failed to add to cart', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showSnackbar('Failed to add to cart', 'error');
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) return;

    try {
      const result = await cartService.removeFromCart(user.uid, productId);
      if (result.success) {
        dispatch({
          type: CART_ACTIONS.LOAD_CART,
          payload: {
            items: result.cart.items,
            totalItems: result.cart.totalItems,
            totalPrice: result.cart.totalPrice,
          }
        });
        showSnackbar('Item removed from cart', 'info');
      } else {
        showSnackbar(result.error || 'Failed to remove item', 'error');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      showSnackbar('Failed to remove item', 'error');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      const result = await cartService.updateQuantity(user.uid, productId, quantity);
      if (result.success) {
        dispatch({
          type: CART_ACTIONS.LOAD_CART,
          payload: {
            items: result.cart.items,
            totalItems: result.cart.totalItems,
            totalPrice: result.cart.totalPrice,
          }
        });
      } else {
        showSnackbar(result.error || 'Failed to update quantity', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showSnackbar('Failed to update quantity', 'error');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const result = await cartService.clearCart(user.uid);
      if (result.success) {
        dispatch({
          type: CART_ACTIONS.LOAD_CART,
          payload: {
            items: [],
            totalItems: 0,
            totalPrice: 0,
          }
        });
        showSnackbar('Cart cleared', 'info');
      } else {
        showSnackbar(result.error || 'Failed to clear cart', 'error');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      showSnackbar('Failed to clear cart', 'error');
    }
  };

  const toggleCart = () => {
    dispatch({ type: CART_ACTIONS.TOGGLE_CART });
  };

  const getCartItemCount = () => state.totalItems;

  const isInCart = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    getCartItemCount,
    isInCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
