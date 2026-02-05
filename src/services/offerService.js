import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const OFFERS_COLLECTION = 'offers';

/**
 * Normalize coupon code for storage and lookup (uppercase, trim)
 */
const normalizeCode = (code) => (code && String(code).trim().toUpperCase()) || '';

/**
 * Get all offers (Admin only)
 */
export const getOffers = async () => {
  if (!db) return { success: false, error: 'Firebase is not configured', offers: [] };
  try {
    const snapshot = await getDocs(collection(db, OFFERS_COLLECTION));
    const offers = [];
    snapshot.forEach((docSnap) => {
      offers.push({ id: docSnap.id, ...docSnap.data() });
    });
    offers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return { success: true, offers };
  } catch (error) {
    return { success: false, error: error.message, offers: [] };
  }
};

/**
 * Get a single offer by coupon code (for checkout validation)
 */
export const getOfferByCode = async (code) => {
  if (!db) return { success: false, error: 'Firebase is not configured', offer: null };
  const normalized = normalizeCode(code);
  if (!normalized) return { success: false, error: 'Invalid code', offer: null };
  try {
    const q = query(
      collection(db, OFFERS_COLLECTION),
      where('code', '==', normalized)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: false, error: 'Coupon not found', offer: null };
    const docSnap = snapshot.docs[0];
    const offer = { id: docSnap.id, ...docSnap.data() };
    return { success: true, offer };
  } catch (error) {
    return { success: false, error: error.message, offer: null };
  }
};

/**
 * Get offers available for a specific user (for user dashboard)
 * Returns offers where: isActive, within date range, and (targetUserIds empty or includes userId)
 */
export const getOffersForUser = async (userId) => {
  if (!db || !userId) return { success: false, error: 'Invalid request', offers: [] };
  try {
    const q = query(
      collection(db, OFFERS_COLLECTION),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    const now = new Date();
    const offers = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const targetUserIds = data.targetUserIds || [];
      const isForUser = targetUserIds.length === 0 || targetUserIds.includes(userId);
      const startOk = !data.startDate || new Date(data.startDate) <= now;
      const endOk = !data.endDate || new Date(data.endDate) >= now;
      if (isForUser && startOk && endOk) {
        offers.push({ id: docSnap.id, ...data });
      }
    });
    offers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return { success: true, offers };
  } catch (error) {
    return { success: false, error: error.message, offers: [] };
  }
};

/**
 * Validate coupon for a user and subtotal; returns discount amount and offer if valid
 */
export const validateCouponForUser = async (code, userId, subtotal) => {
  const res = await getOfferByCode(code);
  if (!res.success || !res.offer) {
    return { valid: false, error: res.error || 'Invalid coupon', discount: 0, offer: null };
  }
  const offer = res.offer;
  if (!offer.isActive) {
    return { valid: false, error: 'This coupon is no longer active', discount: 0, offer: null };
  }
  const targetUserIds = offer.targetUserIds || [];
  const allowed = targetUserIds.length === 0 || targetUserIds.includes(userId);
  if (!allowed) {
    return { valid: false, error: 'This coupon is not valid for your account', discount: 0, offer: null };
  }
  const now = new Date();
  if (offer.startDate && new Date(offer.startDate) > now) {
    return { valid: false, error: 'This coupon is not yet valid', discount: 0, offer: null };
  }
  if (offer.endDate && new Date(offer.endDate) < now) {
    return { valid: false, error: 'This coupon has expired', discount: 0, offer: null };
  }
  let discount = 0;
  if (offer.discountType === 'percent') {
    discount = Math.min((subtotal * (offer.discountValue || 0)) / 100, subtotal);
  } else {
    discount = Math.min(Number(offer.discountValue) || 0, subtotal);
  }
  return { valid: true, error: null, discount, offer };
};

/**
 * Create offer (Admin only)
 */
export const createOffer = async (data) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  const code = normalizeCode(data.code);
  if (!code) return { success: false, error: 'Coupon code is required' };
  try {
    const docRef = await addDoc(collection(db, OFFERS_COLLECTION), {
      name: data.name || code,
      code,
      discountType: data.discountType === 'percent' ? 'percent' : 'amount',
      discountValue: Number(data.discountValue) || 0,
      targetUserIds: Array.isArray(data.targetUserIds) ? data.targetUserIds : [],
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      isActive: data.isActive !== false,
      createdAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update offer (Admin only)
 */
export const updateOffer = async (id, data) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    const updateData = { ...data };
    if (updateData.code !== undefined) updateData.code = normalizeCode(updateData.code);
    if (updateData.discountValue !== undefined) updateData.discountValue = Number(updateData.discountValue);
    if (updateData.targetUserIds !== undefined) updateData.targetUserIds = Array.isArray(updateData.targetUserIds) ? updateData.targetUserIds : [];
    await updateDoc(doc(db, OFFERS_COLLECTION, id), updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete offer (Admin only)
 */
export const deleteOffer = async (id) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    await deleteDoc(doc(db, OFFERS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
