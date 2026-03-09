import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  setDoc,
  getDoc,
  increment,
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
 * Validate coupon for a user and subtotal; returns discount amount and offer if valid.
 * Also enforces per-user usage limit if set.
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

  // --- Per-user usage limit check ---
  const limitPerUser = Number(offer.usageLimitPerUser) || 0;
  if (limitPerUser > 0 && db) {
    const usageRef = doc(db, OFFERS_COLLECTION, offer.id, 'usageLog', userId);
    const usageSnap = await getDoc(usageRef);
    if (usageSnap.exists()) {
      const usedCount = usageSnap.data().usedCount || 0;
      if (usedCount >= limitPerUser) {
        return {
          valid: false,
          error: limitPerUser === 1
            ? 'You have already used this coupon'
            : `You have already used this coupon ${usedCount} time(s) (limit: ${limitPerUser})`,
          discount: 0,
          offer: null,
        };
      }
    }
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
 * Record that a user has used an offer (called after successful order placement).
 * Uses atomic increment so there's no read-before-write race condition.
 */
export const recordOfferUsage = async (offerId, userId, userName, userEmail) => {
  if (!db || !offerId || !userId) return { success: false };
  try {
    const usageRef = doc(db, OFFERS_COLLECTION, offerId, 'usageLog', userId);
    await setDoc(usageRef, {
      userId,
      userName: userName || '',
      userEmail: userEmail || '',
      usedCount: increment(1),
      lastUsedAt: new Date().toISOString(),
    }, { merge: true });
    // Set firstUsedAt only on creation (merge won't overwrite existing fields
    // when we use a separate setDoc without merge for first-time writes,
    // so we check if the doc exists and only set firstUsedAt if it didn't)
    const snap = await getDoc(usageRef);
    if (snap.exists() && !snap.data().firstUsedAt) {
      await setDoc(usageRef, { firstUsedAt: new Date().toISOString() }, { merge: true });
    }
    return { success: true };
  } catch (error) {
    console.error('recordOfferUsage error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get the usage log for an offer (Admin only)
 */
export const getOfferUsageLog = async (offerId) => {
  if (!db || !offerId) return { success: false, entries: [] };
  try {
    const snapshot = await getDocs(collection(db, OFFERS_COLLECTION, offerId, 'usageLog'));
    const entries = [];
    snapshot.forEach((d) => entries.push({ id: d.id, ...d.data() }));
    entries.sort((a, b) => new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0));
    return { success: true, entries };
  } catch (error) {
    return { success: false, error: error.message, entries: [] };
  }
};

/**
 * Get this user's usage counts for a list of offers (for the User Offers page).
 * Returns a map: { [offerId]: usedCount }
 */
export const getUserUsageForOffers = async (offerIds, userId) => {
  if (!db || !userId || !offerIds?.length) return {};
  try {
    const results = await Promise.all(
      offerIds.map(async (offerId) => {
        const usageRef = doc(db, OFFERS_COLLECTION, offerId, 'usageLog', userId);
        const snap = await getDoc(usageRef);
        return { offerId, usedCount: snap.exists() ? (snap.data().usedCount || 0) : 0 };
      })
    );
    const map = {};
    results.forEach(({ offerId, usedCount }) => { map[offerId] = usedCount; });
    return map;
  } catch (error) {
    console.error('getUserUsageForOffers error:', error);
    return {};
  }
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
      usageLimitPerUser: Number(data.usageLimitPerUser) || 0,
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
    if (updateData.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = Number(updateData.usageLimitPerUser) || 0;
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
