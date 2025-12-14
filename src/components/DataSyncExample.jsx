import React, { useState, useEffect } from 'react';
import { 
  useCart, 
  useWishlist, 
  useOrders, 
  useDataSync 
} from '../contexts';
import { 
  useCartSync, 
  useWishlistSync, 
  useOrdersSync 
} from '../hooks';

const DataSyncExample = () => {
  const { totalItems: cartItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { totalOrders } = useOrders();
  const dataSync = useDataSync();
  
  const [lastCartUpdate, setLastCartUpdate] = useState(null);
  const [lastWishlistUpdate, setLastWishlistUpdate] = useState(null);
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);

  useCartSync((data) => {
    console.log('Cart sync event:', data);
    setLastCartUpdate({
      action: data.action,
      time: new Date().toLocaleTimeString()
    });
  });

  useWishlistSync((data) => {
    console.log('Wishlist sync event:', data);
    setLastWishlistUpdate({
      action: data.action,
      time: new Date().toLocaleTimeString()
    });
  });

  useOrdersSync((data) => {
    console.log('Orders sync event:', data);
    setLastOrderUpdate({
      action: data.action,
      time: new Date().toLocaleTimeString()
    });
  });

  useEffect(() => {
    const handleCustomEvent = (e) => {
      console.log('Custom data sync event:', e.type, e.detail);
    };

    window.addEventListener('data:cart', handleCustomEvent);
    window.addEventListener('data:wishlist', handleCustomEvent);
    window.addEventListener('data:orders', handleCustomEvent);

    return () => {
      window.removeEventListener('data:cart', handleCustomEvent);
      window.removeEventListener('data:wishlist', handleCustomEvent);
      window.removeEventListener('data:orders', handleCustomEvent);
    };
  }, []);

  const triggerManualUpdate = () => {
    dataSync.emitCartUpdate({ 
      action: 'manual_test', 
      timestamp: Date.now() 
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e0e0e0', 
      borderRadius: '8px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Real-Time Data Sync Demo</h2>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Current State</h3>
        <p>Cart Items: {cartItems}</p>
        <p>Wishlist Items: {totalWishlistItems}</p>
        <p>Total Orders: {totalOrders}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Last Updates</h3>
        {lastCartUpdate && (
          <p>Cart: {lastCartUpdate.action} at {lastCartUpdate.time}</p>
        )}
        {lastWishlistUpdate && (
          <p>Wishlist: {lastWishlistUpdate.action} at {lastWishlistUpdate.time}</p>
        )}
        {lastOrderUpdate && (
          <p>Orders: {lastOrderUpdate.action} at {lastOrderUpdate.time}</p>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={triggerManualUpdate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Trigger Manual Update
        </button>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '10px',
        backgroundColor: '#fff3cd',
        borderRadius: '4px'
      }}>
        <strong>Try this:</strong>
        <ul>
          <li>Add items to cart in another tab - this component will update!</li>
          <li>Add items to wishlist - watch the counter change</li>
          <li>Open DevTools console to see sync events</li>
        </ul>
      </div>
    </div>
  );
};

export default DataSyncExample;
