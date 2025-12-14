import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistService } from '../services/api';
import { useAuth } from './AuthContext';
import { useDataSync } from './DataSyncContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const dataSync = useDataSync ? (() => {
    try {
      return useDataSync();
    } catch {
      return null;
    }
  })() : null;

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data);
      if (dataSync) {
        dataSync.emitWishlistUpdate({ action: 'load', items: data });
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
      setError(err.message);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      await wishlistService.addToWishlist(productId);
      await loadWishlist();
      if (dataSync) {
        dataSync.emitWishlistUpdate({ action: 'add', productId });
      }
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      throw err;
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      await wishlistService.removeFromWishlist(id);
      await loadWishlist();
      if (dataSync) {
        dataSync.emitWishlistUpdate({ action: 'remove', id });
      }
      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      throw err;
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => 
      (item.productId === productId) || (item.id === productId)
    );
  };

  const refreshWishlist = () => {
    if (isAuthenticated) {
      loadWishlist();
    }
  };

  const value = {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist,
    totalWishlistItems: wishlist.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
