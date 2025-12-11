//src/contexts/OrderContext.jsx/*
import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { useAuth } from './AuthContext';
import { useDataSync } from './DataSyncContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
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
    if (isAuthenticated) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
      if (dataSync) {
        dataSync.emitOrdersUpdate({ action: 'load', orders: data });
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message);
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
      const orderStatus = order.status.toLowerCase();
      switch (status.toLowerCase()) {
        case 'processing':
          return orderStatus === 'processing' || orderStatus === 'đang xử lý';
        case 'shipping':
          return orderStatus === 'shipping' || orderStatus === 'đang giao';
        case 'delivered':
          return orderStatus === 'delivered' || orderStatus === 'đã giao';
        case 'cancelled':
          return orderStatus === 'cancelled' || orderStatus === 'đã hủy';
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
