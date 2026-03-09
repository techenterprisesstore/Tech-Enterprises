import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get all users (Admin only)
 * Loaded only when admin panel is opened
 */
export const getAllUsers = async () => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', users: [] };
  }

  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach((docSnapshot) => {
      users.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (userId, newRole) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured' };
  }

  if (newRole !== 'user' && newRole !== 'admin') {
    return { success: false, error: 'Invalid role. Must be "user" or "admin"' };
  }

  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a user document (Admin only)
 * Note: This removes the Firestore record only.
 */
export const deleteUser = async (userId) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
