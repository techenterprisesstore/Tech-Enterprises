import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Client-side cache for products
let productsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all products with pagination
 * Uses caching to minimize API calls
 */
export const getProducts = async (pageSize = 8, lastDoc = null) => {
  if (!db) {
    console.error('Firebase db not initialized');
    return { success: false, error: 'Firebase is not configured', products: [] };
  }
  
  try {
    // Clear cache for admin queries or when explicitly requested
    if (pageSize > 8) {
      productsCache = null;
      lastFetchTime = null;
    }

    // Only use cache if explicitly not forcing refresh and cache is fresh
    // For admin dashboard, always fetch fresh data
    if (productsCache && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION && !lastDoc && pageSize <= 8) {
      console.log('Using cached products:', productsCache.length);
      return { success: true, products: productsCache, hasMore: true };
    }

    // Query products - use the same simple approach as debug component
    console.log('Fetching products from Firestore...', { pageSize, hasLastDoc: !!lastDoc });
    
    let snapshot;
    if (lastDoc) {
      // Pagination query with limit
      const q = query(
        collection(db, 'products'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      );
      snapshot = await getDocs(q);
    } else {
      // Simple query without limit - fetch all products (matches debug component)
      const q = query(collection(db, 'products'));
      snapshot = await getDocs(q);
    }

    console.log(`Found ${snapshot.size} products in Firestore`);

    const allProducts = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // Ensure createdAt exists, use current time if missing
      if (!data.createdAt) {
        data.createdAt = { toDate: () => new Date() };
      }
      allProducts.push({ id: docSnapshot.id, ...data, _docRef: docSnapshot });
    });

    console.log(`Processed ${allProducts.length} products from snapshot`);

    // Sort products by createdAt if available (client-side)
    allProducts.sort((a, b) => {
      try {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime; // Descending order
      } catch (e) {
        return 0;
      }
    });

    // Handle pagination
    let products, lastVisible, hasMore;
    if (lastDoc) {
      // For pagination, use the products as-is (already limited by query)
      products = allProducts.slice(0, pageSize);
      lastVisible = allProducts[pageSize - 1]?._docRef || null;
      hasMore = allProducts.length > pageSize;
    } else {
      // For first page, limit client-side
      products = allProducts.slice(0, pageSize);
      lastVisible = allProducts[pageSize - 1]?._docRef || null;
      hasMore = allProducts.length > pageSize;
    }

    // Remove _docRef from final products
    const finalProducts = products.map(({ _docRef, ...product }) => product);

    console.log(`Returning ${finalProducts.length} products (hasMore: ${hasMore})`);

    // Cache first page only (and only for regular user queries)
    if (!lastDoc && pageSize <= 8) {
      productsCache = finalProducts;
      lastFetchTime = Date.now();
      console.log('Cached products:', finalProducts.length);
    }

    return { success: true, products: finalProducts, hasMore, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return { success: false, error: error.message, products: [] };
  }
};

/**
 * Whether a product has a valid offer (for display)
 */
export const productHasOffer = (product) => {
  if (!product) return false;
  const price = Number(product.price);
  const offerPrice = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
  const isOffer = product.isOffer === true;
  return isOffer || (offerPrice != null && offerPrice > 0 && price > offerPrice);
};

/**
 * Get products with offers (isOffer == true or valid offerPrice). Merges from both query and full list so we show all offer products.
 */
export const getOfferProducts = async () => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', products: [] };
  }

  const mergeAndSort = (list) => {
    const byId = new Map();
    list.forEach((p) => byId.set(p.id, p));
    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      try {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      } catch (e) {
        return 0;
      }
    });
    return merged.slice(0, 20);
  };

  try {
    let fromQuery = [];
    try {
      const q = query(
        collection(db, 'products'),
        where('isOffer', '==', true),
        limit(20)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnapshot) => {
        fromQuery.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
    } catch (queryErr) {
      console.warn('Offer products query failed, using fallback only:', queryErr.message);
    }

    // Always also fetch from full list and include any product with valid offer (offerPrice), so we don't miss products that have offer price but isOffer not set
    let fromFilter = [];
    const allResult = await getProducts(100);
    if (allResult.success && allResult.products?.length > 0) {
      fromFilter = allResult.products.filter((p) => productHasOffer(p));
    }

    const products = mergeAndSort([...fromQuery, ...fromFilter]);
    return { success: true, products };
  } catch (error) {
    console.error('Error fetching offer products:', error);
    try {
      const allResult = await getProducts(100);
      if (allResult.success && allResult.products?.length > 0) {
        const products = allResult.products.filter((p) => productHasOffer(p)).slice(0, 20);
        products.sort((a, b) => {
          try {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          } catch (e) {
            return 0;
          }
        });
        return { success: true, products };
      }
    } catch (fallbackErr) {
      console.error('Fallback offer products failed:', fallbackErr);
    }
    return { success: false, error: error.message, products: [] };
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured' };
  }
  
  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
      return { success: true, product: { id: productDoc.id, ...productDoc.data() } };
    }
    return { success: false, error: 'Product not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create new product (Admin only). imageFile = main image; galleryFiles = extra images to upload; productData.galleryUrls = existing URLs for gallery.
 */
export const createProduct = async (productData, imageFile, galleryFiles = [], galleryUrls = []) => {
  try {
    let imageUrl = (productData.imageUrl || '').trim();

    if (imageFile) {
      const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const uploadedGallery = [];
    for (const file of galleryFiles) {
      if (!file) continue;
      const imageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      uploadedGallery.push(url);
    }

    const allGalleryUrls = [imageUrl].filter(Boolean).concat(uploadedGallery, (galleryUrls || []).filter(Boolean));
    const galleryImages = allGalleryUrls.length > 0 ? allGalleryUrls : (imageUrl ? [imageUrl] : []);

    const product = {
      name: productData.name,
      description: (productData.description || '').trim() || null,
      price: Number(productData.price),
      offerPrice: productData.offerPrice ? Number(productData.offerPrice) : null,
      stock: Number(productData.stock),
      category: productData.category,
      imageUrl: imageUrl || (galleryImages[0] || ''),
      galleryImages,
      isOffer: productData.isOffer || false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'products'), product);
    return { success: true, productId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update product (Admin only). Supports main imageFile and gallery (galleryFiles + galleryUrls). Pass galleryImages in productData to set full gallery.
 */
export const updateProduct = async (productId, productData, imageFile, galleryFiles = [], galleryUrls = []) => {
  try {
    const updateData = { ...productData };
    delete updateData.galleryImages;

    let imageUrl = (productData.imageUrl || '').trim();
    if (imageFile) {
      const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
      updateData.imageUrl = imageUrl;
    }

    const uploadedGallery = [];
    for (const file of galleryFiles) {
      if (!file) continue;
      const imageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      uploadedGallery.push(url);
    }

    const hasNewGallery = uploadedGallery.length > 0 || (galleryUrls && galleryUrls.length > 0);
    if (hasNewGallery || imageFile) {
      const first = imageUrl || (productData.imageUrl || '').trim();
      updateData.galleryImages = [first].filter(Boolean).concat(uploadedGallery, (galleryUrls || []).filter(Boolean));
      if (updateData.galleryImages.length > 0 && !updateData.imageUrl) updateData.imageUrl = updateData.galleryImages[0];
    } else if (Array.isArray(productData.galleryImages)) {
      updateData.galleryImages = productData.galleryImages;
    }

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.offerPrice !== undefined) updateData.offerPrice = updateData.offerPrice ? Number(updateData.offerPrice) : null;
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
    if (updateData.isOffer !== undefined) updateData.isOffer = Boolean(updateData.isOffer);
    if (updateData.description !== undefined) updateData.description = (updateData.description || '').trim() || null;

    await updateDoc(doc(db, 'products', productId), updateData);

    productsCache = null;
    lastFetchTime = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete product (Admin only)
 */
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    
    // Clear cache on delete
    productsCache = null;
    lastFetchTime = null;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Search products by name or category (client-side filter). Returns up to 12 matches.
 */
export const searchProducts = async (searchTerm) => {
  if (!db) {
    return { success: false, error: 'Firebase is not configured', products: [] };
  }
  const term = (searchTerm || '').trim().toLowerCase();
  if (!term) {
    return { success: true, products: [] };
  }
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const all = [];
    snapshot.forEach((docSnap) => {
      all.push({ id: docSnap.id, ...docSnap.data() });
    });
    const filtered = all.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      return name.includes(term) || category.includes(term);
    });
    const products = filtered.slice(0, 12);
    return { success: true, products };
  } catch (error) {
    console.error('Error searching products:', error);
    return { success: false, error: error.message, products: [] };
  }
};

/**
 * Get product count by category
 */
export const getProductCountByCategory = async (category) => {
  if (!db) {
    return 0;
  }
  
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting products by category:', error);
    return 0;
  }
};

/**
 * Get product counts for all categories
 */
export const getCategoryCounts = async () => {
  if (!db) {
    return {};
  }
  
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const counts = {};
    
    snapshot.forEach((doc) => {
      const category = doc.data().category;
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error getting category counts:', error);
    return {};
  }
};

/**
 * Clear products cache (useful for admin updates)
 */
export const clearProductsCache = () => {
  productsCache = null;
  lastFetchTime = null;
};
