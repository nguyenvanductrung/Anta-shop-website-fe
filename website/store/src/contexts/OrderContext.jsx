//src/contexts/OrderContext.jsx/*
import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { useAuth } from './AuthContext';
import { useDataSync } from './DataSyncContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const dataSync = useDataSync ? (() => {
    try {
      return useDataSync();
    } catch {
      return null;
    }
  })() : null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadOrders({ userId: user.id }); // ✅ truyền userId
    } else {
      setOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const loadOrders = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders(params);
      // normalize possible shapes: array | { data: [] } | { orders: [] } | { ..someKey: [] }
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (data && Array.isArray(data.data)) arr = data.data;
      else if (data && Array.isArray(data.orders)) arr = data.orders;
      else if (data) {
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k])) { arr = data[k]; break; }
        }
      }
      if (!Array.isArray(arr)) {
        console.warn('[OrderContext] getOrders returned unexpected shape:', data);
        arr = [];
      }
      setOrders(arr);
      if (dataSync) {
        dataSync.emitOrdersUpdate({ action: 'load', orders: arr });
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err?.message || String(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (id) => {
    try {
      const order = await orderService.getOrder(id);
      return order;
    } catch (err) {
      console.error('Error getting order:', err);
      throw err;
    }
  };

  const cancelOrder = async (id) => {
    try {
      await orderService.cancelOrder(id);
      await loadOrders();

      // Emit sync event for real-time updates
      if (dataSync) {
        dataSync.emitOrdersUpdate({
          action: 'cancel',
          orderId: id,
          timestamp: Date.now()
        });
      }

      // Also emit a custom event for admin dashboard
      window.dispatchEvent(new CustomEvent('orderCancelled', {
        detail: { orderId: id, timestamp: Date.now() }
      }));

      return true;
    } catch (err) {
      console.error('Error canceling order:', err);
      throw err;
    }
  };

  const refreshOrders = () => {
    if (isAuthenticated) {
      loadOrders();
    }
  };

  const getOrdersByStatus = (status) => {
    if (!status || status === 'all') return orders;
    return orders.filter(order => {
      const rawStatus = (order && (order.status || order.state || order.statusText || '')) || '';
      const orderStatus = String(rawStatus).toLowerCase();
      switch (status.toLowerCase()) {
        case 'processing':
          return orderStatus.includes('process') || orderStatus.includes('đang xử lý');
        case 'shipping':
          return orderStatus.includes('ship') || orderStatus.includes('đang giao');
        case 'delivered':
          return orderStatus.includes('deliver') || orderStatus.includes('đã giao');
        case 'cancelled':
          return orderStatus.includes('cancel') || orderStatus.includes('hủy');
        default:
          return true;
      }
    });
  };


  const value = {
    orders,
    loading,
    error,
    getOrder,
    cancelOrder,
    refreshOrders,
    getOrdersByStatus,
    totalOrders: orders.length
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
