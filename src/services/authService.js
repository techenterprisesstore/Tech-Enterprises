import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

/**
 * Register new user with email and password
 */
export const registerWithEmail = async (email, password, name, phone) => {
  if (!auth || !db) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phone: phone || '',
      role: 'user',
      provider: 'email',
      createdAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  if (!auth) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  if (!auth || !db || !googleProvider) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user profile if doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || '',
        email: user.email,
        phone: user.phoneNumber || '',
        role: 'user',
        provider: 'google',
        createdAt: serverTimestamp()
      });
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign out current user
 */
export const logout = async () => {
  if (!auth) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get current user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, profile: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile in Firestore (name, phone). Email is read-only for security.
 */
export const updateUserProfile = async (uid, data) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured' };
  }
  try {
    const ref = doc(db, 'users', uid);
    const updateData = { updatedAt: serverTimestamp() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    await updateDoc(ref, updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Auth state observer
 */
export const onAuthChange = (callback) => {
  if (!auth) {
    // Return a no-op unsubscribe function if auth is not configured
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
