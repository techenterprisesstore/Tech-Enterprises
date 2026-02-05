import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

// Cart service using Firebase Firestore
class CartService {
  constructor() {
    this.collectionName = 'carts';
  }

  // Get user's cart document
  getCartDoc(userId) {
    return doc(db, this.collectionName, userId);
  }

  // Get cart for a user
  async getCart(userId) {
    try {
      const cartDoc = await getDoc(this.getCartDoc(userId));
      if (cartDoc.exists()) {
        return {
          success: true,
          cart: cartDoc.data()
        };
      } else {
        // Create empty cart if it doesn't exist
        await this.createEmptyCart(userId);
        return {
          success: true,
          cart: {
            items: [],
            totalItems: 0,
            totalPrice: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('Error getting cart:', error);
      return {
        success: false,
        error: 'Failed to load cart'
      };
    }
  }

  // Create empty cart for new user
  async createEmptyCart(userId) {
    try {
      const cartData = {
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(this.getCartDoc(userId), cartData);
      return { success: true };
    } catch (error) {
      console.error('Error creating empty cart:', error);
      return { success: false, error: 'Failed to create cart' };
    }
  }

  // Add item to cart
  async addToCart(userId, product, quantity = 1) {
    try {
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.cart;
      const existingItemIndex = cart.items.findIndex(item => item.id === product.id);

      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...cart.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock || 999);
        
        if (newQuantity <= 0) {
          // Remove item if quantity is 0 or less
          updatedItems.splice(existingItemIndex, 1);
        } else {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        // Add new item
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          offerPrice: product.offerPrice,
          isOffer: product.isOffer,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          quantity: Math.min(quantity, product.stock || 999),
          addedAt: new Date().toISOString()
        };
        updatedItems = [...cart.items, newItem];
      }

      // Calculate totals
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
        return sum + (price * item.quantity);
      }, 0);

      // Update cart in database
      await updateDoc(this.getCartDoc(userId), {
        items: updatedItems,
        totalItems,
        totalPrice,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        cart: {
          ...cart,
          items: updatedItems,
          totalItems,
          totalPrice,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        error: 'Failed to add item to cart'
      };
    }
  }

  // Remove item from cart
  async removeFromCart(userId, productId) {
    try {
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.cart;
      const updatedItems = cart.items.filter(item => item.id !== productId);

      // Calculate totals
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
        return sum + (price * item.quantity);
      }, 0);

      // Update cart in database
      await updateDoc(this.getCartDoc(userId), {
        items: updatedItems,
        totalItems,
        totalPrice,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        cart: {
          ...cart,
          items: updatedItems,
          totalItems,
          totalPrice,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        error: 'Failed to remove item from cart'
      };
    }
  }

  // Update item quantity
  async updateQuantity(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(userId, productId);
      }

      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.cart;
      const updatedItems = cart.items.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.stock || 999),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      }).filter(item => item.quantity > 0);

      // Calculate totals
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
        return sum + (price * item.quantity);
      }, 0);

      // Update cart in database
      await updateDoc(this.getCartDoc(userId), {
        items: updatedItems,
        totalItems,
        totalPrice,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        cart: {
          ...cart,
          items: updatedItems,
          totalItems,
          totalPrice,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return {
        success: false,
        error: 'Failed to update quantity'
      };
    }
  }

  // Clear cart
  async clearCart(userId) {
    try {
      await updateDoc(this.getCartDoc(userId), {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        error: 'Failed to clear cart'
      };
    }
  }
}

export default new CartService();
