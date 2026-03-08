import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToImageKit } from './imagekitService';

/**
 * Get all banners (public read), ordered by order then createdAt
 */
export const getBanners = async () => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', banners: [] };
  }
  try {
    const snapshot = await getDocs(collection(db, 'banners'));
    const banners = [];
    snapshot.forEach((docSnap) => {
      banners.push({ id: docSnap.id, ...docSnap.data() });
    });
    banners.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return { success: true, banners };
  } catch (error) {
    console.error('Error fetching banners:', error);
    return { success: false, error: error.message, banners: [] };
  }
};

/**
 * Create banner (admin only). imageFile or imageUrl optional.
 */
export const createBanner = async (data, imageFile, imageUrlFromInput) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadToImageKit(imageFile, 'banners');
    } else if (imageUrlFromInput && (imageUrlFromInput || '').trim()) {
      imageUrl = (imageUrlFromInput || '').trim();
    }
    const payload = {
      title: (data.title || '').trim() || 'Banner',
      subtitle: (data.subtitle || '').trim() || '',
      imageUrl,
      buttonText: (data.buttonText || '').trim() || 'View offers',
      link: (data.link || '').trim() || '/offers',
      order: typeof data.order === 'number' ? data.order : 999,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'banners'), payload);
    return { success: true, bannerId: docRef.id };
  } catch (error) {
    console.error('Error creating banner:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update banner (admin only). data can include title, subtitle, imageUrl, buttonText, link, order.
 */
export const updateBanner = async (bannerId, data, imageFile, imageUrlFromInput) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    const updateData = { ...data };
    if (imageFile) {
      updateData.imageUrl = await uploadToImageKit(imageFile, 'banners');
    } else if (imageUrlFromInput !== undefined) {
      updateData.imageUrl = (imageUrlFromInput || '').trim();
    }
    updateData.updatedAt = serverTimestamp();
    await updateDoc(doc(db, 'banners', bannerId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete banner (admin only)
 */
export const deleteBanner = async (bannerId) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: error.message };
  }
};
