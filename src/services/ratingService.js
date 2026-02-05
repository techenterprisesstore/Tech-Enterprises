import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const RATINGS_COLLECTION = 'productRatings';

/**
 * Get the current user's rating for a product (for prefill / edit)
 */
export const getUserRatingForProduct = async (productId, userId) => {
  if (!db || !productId || !userId) {
    return { success: false, rating: null, reviewText: '' };
  }
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { success: true, rating: null, reviewText: '', ratingId: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      success: true,
      rating: data.rating ?? null,
      reviewText: data.reviewText ?? '',
      ratingId: docSnap.id,
    };
  } catch (error) {
    console.error('getUserRatingForProduct error:', error);
    return { success: false, rating: null, reviewText: '', ratingId: null };
  }
};

/**
 * Recompute average rating and total count for a product and update the product document
 */
const updateProductRatingAggregate = async (productId) => {
  if (!db || !productId) return;
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    let sum = 0;
    let count = 0;
    snapshot.forEach((d) => {
      const r = d.data().rating;
      if (typeof r === 'number' && r >= 1 && r <= 5) {
        sum += r;
        count += 1;
      }
    });
    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    await updateDoc(doc(db, 'products', productId), {
      rating: average,
      totalReviews: count,
    });
  } catch (error) {
    console.error('updateProductRatingAggregate error:', error);
  }
};

/**
 * Submit or update a user's rating (and optional review text) for a product.
 * One rating per user per product; updating overwrites previous.
 */
export const submitRating = async ({
  productId,
  productName,
  userId,
  userName,
  userEmail,
  rating,
  reviewText = '',
}) => {
  if (!db || !productId || !userId || !rating || rating < 1 || rating > 5) {
    return { success: false, error: 'Invalid input' };
  }
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const payload = {
      productId,
      productName: productName || '',
      userId,
      userName: userName || '',
      userEmail: userEmail || '',
      rating: Number(rating),
      reviewText: String(reviewText).trim(),
      updatedAt: serverTimestamp(),
    };

    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, RATINGS_COLLECTION, docId), payload);
    } else {
      await addDoc(collection(db, RATINGS_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await updateProductRatingAggregate(productId);
    return { success: true };
  } catch (error) {
    console.error('submitRating error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all ratings/reviews for a single product (for product detail page)
 */
export const getRatingsByProduct = async (productId) => {
  if (!db || !productId) {
    return { success: false, reviews: [] };
  }
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const reviews = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      reviews.push({
        id: docSnap.id,
        userId: data.userId,
        userName: data.userName || data.userEmail || 'User',
        userEmail: data.userEmail || '',
        rating: data.rating,
        reviewText: data.reviewText || '',
        updatedAt,
        createdAt,
      });
    });
    // Sort by date descending (newest first) in memory so no composite index is needed
    reviews.sort((a, b) => {
      const tA = a.updatedAt || a.createdAt || 0;
      const tB = b.updatedAt || b.createdAt || 0;
      const timeA = tA instanceof Date ? tA.getTime() : 0;
      const timeB = tB instanceof Date ? tB.getTime() : 0;
      return timeB - timeA;
    });
    return { success: true, reviews };
  } catch (error) {
    console.error('getRatingsByProduct error:', error);
    return { success: false, reviews: [] };
  }
};

/**
 * Get all ratings for admin: list with product name, user, rating, review, date
 */
export const getAllRatingsForAdmin = async () => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', ratings: [] };
  }
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const ratings = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
      ratings.push({
        id: docSnap.id,
        productId: data.productId,
        productName: data.productName || '—',
        userId: data.userId,
        userName: data.userName || data.userEmail || '—',
        userEmail: data.userEmail || '',
        rating: data.rating,
        reviewText: data.reviewText || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
        updatedAt,
      });
    });
    return { success: true, ratings };
  } catch (error) {
    console.error('getAllRatingsForAdmin error:', error);
    return { success: false, error: error.message, ratings: [] };
  }
};
