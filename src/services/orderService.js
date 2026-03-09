import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '1234567890';

/**
 * Create comprehensive order with shipping details and send WhatsApp message
 */
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with data:', orderData);

    // Create order document with all details
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    const orderId = docRef.id;

    console.log('Order created with ID:', orderId);

    // Generate WhatsApp message
    const message = generateWhatsAppMessage(orderId, orderData);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return { success: true, orderId, whatsappUrl };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Legacy function for backward compatibility
 */
export const createOrderLegacy = async (userId, items, totalAmount) => {
  try {
    // Create order document
    const orderData = {
      userId,
      items,
      totalAmount: Number(totalAmount),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    const orderId = docRef.id;

    // Generate WhatsApp message
    const message = generateWhatsAppMessage(orderId, orderData);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return { success: true, orderId, whatsappUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get user orders (query by userId with index)
 */
export const getUserOrders = async (userId) => {
  try {
    console.log('Fetching orders for user:', userId);

    // First try without ordering to avoid index requirement
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const orders = [];
    snapshot.forEach((docSnapshot) => {
      orders.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Sort client-side by createdAt (descending)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('Fetched user orders:', orders);
    return { success: true, orders };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async () => {
  try {
    console.log('Fetching all orders...');

    // First try without ordering to avoid index requirement
    const q = query(
      collection(db, 'orders'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const orders = [];
    snapshot.forEach((docSnapshot) => {
      orders.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Sort client-side by createdAt (descending)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('Fetched orders:', orders);
    return { success: true, orders };
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete order (Admin only)
 */
export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: status,
      updatedAt: new Date().toISOString()
    });
    console.log(`Order ${orderId} status updated to: ${status}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full image URL for WhatsApp (clickable link). Handles relative paths.
 */
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return origin + (trimmed.startsWith('/') ? trimmed : '/' + trimmed);
};

/**
 * Generate comprehensive WhatsApp message with order details
 */
const generateWhatsAppMessage = (orderId, orderData) => {
  let message = `🛒 *NEW ORDER* 🛒\n\n`;
  message += `*Order ID:* ${orderId}\n`;
  message += `*Date:* ${new Date(orderData.createdAt).toLocaleDateString()}\n\n`;

  message += `👤 *Customer Information*\n`;
  message += `Name: ${orderData.userName}\n`;
  message += `Email: ${orderData.userEmail}\n`;
  message += `Phone: ${orderData.userPhone}\n\n`;

  message += `� *Shipping Address*\n`;
  message += `${orderData.shippingAddress.name}\n`;
  message += `${orderData.shippingAddress.street}, ${orderData.shippingAddress.landmark || ''}\n`;
  message += `${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}\n\n`;

  message += `📦 *Order Details*\n`;
  message += `Total Items: ${orderData.totalItems || 0}\n\n`;

  message += `🛍️ *Products*\n`;
  (orderData.items || []).forEach((item, index) => {
    const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
    const lineTotal = (price || 0) * (item.quantity || 1);
    message += `\n${index + 1}. ${item.name || 'Item'}\n`;
    message += `   Qty: ${item.quantity || 1} × ${formatCurrency(price)}\n`;
    message += `   Total: ${formatCurrency(lineTotal)}\n`;
    const imgUrl = getFullImageUrl(item.imageUrl);
    if (imgUrl) message += `   🖼️ Image: ${imgUrl}\n`;
  });

  message += `\n`;
  message += `💰 *Price summary*\n`;
  const discountAmount = Number(orderData.discountAmount) || 0;
  const appliedCoupon = orderData.appliedCouponCode || null;
  const subtotal = discountAmount > 0 ? (Number(orderData.totalPrice) + discountAmount) : Number(orderData.totalPrice);
  message += `Subtotal: ${formatCurrency(subtotal)}\n`;
  if (discountAmount > 0 && appliedCoupon) {
    message += `Offer discount (${appliedCoupon}): -${formatCurrency(discountAmount)}\n`;
  }
  message += `*Order Total: ${formatCurrency(orderData.totalPrice)}*\n`;
  message += `\n📞 *Please process this order soon!*`;

  return message;
};

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};
