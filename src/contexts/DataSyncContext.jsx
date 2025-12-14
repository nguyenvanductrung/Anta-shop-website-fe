import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';

const DataSyncContext = createContext();

export const DataSyncProvider = ({ children }) => {
  const listeners = useRef({
    cart: new Set(),
    wishlist: new Set(),
    orders: new Set(),
    userData: new Set(),
    auth: new Set(),
    products: new Set()
  });

  const subscribe = useCallback((type, callback) => {
    if (listeners.current[type]) {
      listeners.current[type].add(callback);
    }
    
    return () => {
      if (listeners.current[type]) {
        listeners.current[type].delete(callback);
      }
    };
  }, []);

  const notify = useCallback((type, data) => {
    if (listeners.current[type]) {
      listeners.current[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    }

    const event = new CustomEvent(`data:${type}`, { detail: data });
    window.dispatchEvent(event);
  }, []);

  const emitCartUpdate = useCallback((data) => notify('cart', data), [notify]);
  const emitWishlistUpdate = useCallback((data) => notify('wishlist', data), [notify]);
  const emitOrdersUpdate = useCallback((data) => notify('orders', data), [notify]);
  const emitUserDataUpdate = useCallback((data) => notify('userData', data), [notify]);
  const emitAuthUpdate = useCallback((data) => notify('auth', data), [notify]);
  const emitProductsUpdate = useCallback((data) => notify('products', data), [notify]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'anta_cart' && e.newValue !== e.oldValue) {
        notify('cart', { source: 'storage', action: 'update' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [notify]);

  const value = {
    subscribe,
    notify,
    emitCartUpdate,
    emitWishlistUpdate,
    emitOrdersUpdate,
    emitUserDataUpdate,
    emitAuthUpdate,
    emitProductsUpdate
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
