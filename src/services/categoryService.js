import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

/**
 * Get all categories (public read)
 */
export const getCategories = async () => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', categories: [] };
  }
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach((docSnap) => {
      categories.push({ id: docSnap.id, ...docSnap.data() });
    });
    categories.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.name || '').localeCompare(b.name || ''));
    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: error.message, categories: [] };
  }
};

/**
 * Create category (admin only) with optional image file or image URL
 */
export const createCategory = async (name, imageFile, imageUrlFromInput) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    let imageUrl = '';
    if (imageFile) {
      const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    } else if (imageUrlFromInput && (imageUrlFromInput || '').trim()) {
      imageUrl = (imageUrlFromInput || '').trim();
    }
    const data = {
      name: (name || '').trim(),
      imageUrl,
      order: 999,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'categories'), data);
    return { success: true, categoryId: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update category (admin only). data can include name, imageUrl. If imageFile is provided, it is uploaded and imageUrl is set from it.
 */
export const updateCategory = async (categoryId, data, imageFile, imageUrlFromInput) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    const updateData = { ...data };
    if (imageFile) {
      const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      updateData.imageUrl = await getDownloadURL(imageRef);
    } else if (imageUrlFromInput !== undefined) {
      updateData.imageUrl = (imageUrlFromInput || '').trim();
    }
    updateData.updatedAt = serverTimestamp();
    await updateDoc(doc(db, 'categories', categoryId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete category (admin only)
 */
export const deleteCategory = async (categoryId) => {
  if (!db) return { success: false, error: 'Firebase is not configured' };
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
};
