import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// Save address to database
export const saveAddress = async (userId, addressData) => {
  try {
    const addressId = uuidv4();
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    
    const addressToSave = {
      id: addressId,
      userId,
      ...addressData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(addressRef, addressToSave);
    return addressToSave;
  } catch (error) {
    console.error('Error saving address:', error);
    throw error;
  }
};

// Get all addresses for a user
export const getUserAddresses = async (userId) => {
  try {
    const addressesRef = collection(db, 'users', userId, 'addresses');
    const q = query(addressesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const addresses = [];
    querySnapshot.forEach((doc) => {
      addresses.push(doc.data());
    });
    
    // Sort by createdAt (newest first) and then by isDefault
    return addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

// Update an existing address
export const updateAddress = async (userId, addressId, addressData) => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    
    const updatedAddress = {
      ...addressData,
      id: addressId,
      userId,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(addressRef, updatedAddress);
    return updatedAddress;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

// Delete an address
export const deleteAddress = async (userId, addressId) => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(addressRef);
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

// Set address as default (will uncheck other addresses)
export const setDefaultAddress = async (userId, addressId) => {
  try {
    // First, get all addresses
    const addresses = await getUserAddresses(userId);
    
    // Update all addresses to remove default flag
    const updatePromises = addresses.map(async (address) => {
      const isDefault = address.id === addressId;
      if (address.isDefault !== isDefault) {
        return updateAddress(userId, address.id, { ...address, isDefault });
      }
      return Promise.resolve(address);
    });
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};
