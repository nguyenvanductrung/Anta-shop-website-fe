import { useEffect } from 'react';
import { useDataSync } from '../contexts/DataSyncContext';

export const useDataSyncListener = (type, callback, dependencies = []) => {
  const dataSync = useDataSync();

  useEffect(() => {
    if (!dataSync || !callback) return;

    const unsubscribe = dataSync.subscribe(type, callback);
    return unsubscribe;
  }, [dataSync, type, callback, ...dependencies]);
};

export const useCartSync = (callback) => {
  useDataSyncListener('cart', callback);
};

export const useWishlistSync = (callback) => {
  useDataSyncListener('wishlist', callback);
};

export const useOrdersSync = (callback) => {
  useDataSyncListener('orders', callback);
};

export const useUserDataSync = (callback) => {
  useDataSyncListener('userData', callback);
};

export const useAuthSync = (callback) => {
  useDataSyncListener('auth', callback);
};

export const useProductsSync = (callback) => {
  useDataSyncListener('products', callback);
};
