# Real-Time Data Sync System

This application implements a comprehensive real-time data synchronization system that ensures all pages and components automatically update when data changes, including across browser tabs.

## Architecture Overview

The data sync system consists of:

1. **DataSyncContext** - Central hub for managing data synchronization events
2. **Enhanced Contexts** - All data contexts (Cart, Wishlist, Orders, UserData, Auth) emit sync events
3. **Custom Hooks** - Easy-to-use hooks for components to listen to data changes
4. **Cross-Tab Sync** - LocalStorage events keep data in sync across browser tabs

## How It Works

### 1. Central Event System

The `DataSyncContext` provides a pub/sub pattern for data changes:

```jsx
import { useDataSync } from './contexts';

const dataSync = useDataSync();

// Emit an event
dataSync.emitCartUpdate({ action: 'add', productId: 123 });

// Subscribe to events
dataSync.subscribe('cart', (data) => {
  console.log('Cart updated:', data);
});
```

### 2. Automatic Context Updates

All contexts automatically emit events when data changes:

- **CartContext**: Emits `cart` events when items are added/removed/updated
- **WishlistContext**: Emits `wishlist` events when items are added/removed
- **OrderContext**: Emits `orders` events when orders are loaded/cancelled
- **UserDataContext**: Emits `userData` events when profile/addresses change
- **AuthContext**: Emits `auth` events on login/logout

### 3. Cross-Tab Synchronization

The cart automatically syncs across browser tabs using localStorage events. When you update the cart in one tab, all other tabs receive the update instantly.

## Usage Examples

### Basic Component Integration

```jsx
import { useCart } from './contexts';
import { useCartSync } from './hooks';

function MyComponent() {
  const { items, totalItems } = useCart();
  
  // Listen to cart updates from anywhere in the app
  useCartSync(() => {
    console.log('Cart was updated in another component or tab!');
  });

  return (
    <div>
      <p>Cart has {totalItems} items</p>
    </div>
  );
}
```

### Refreshing Data on Related Changes

```jsx
import { useOrders, useDataSync } from './contexts';
import { useEffect } from 'react';

function OrdersPage() {
  const { orders, refreshOrders } = useOrders();
  const dataSync = useDataSync();

  useEffect(() => {
    // When a new order is created (checkout completes), refresh orders
    const unsubscribe = dataSync.subscribe('orders', (data) => {
      if (data.action === 'created') {
        refreshOrders();
      }
    });

    return unsubscribe;
  }, [dataSync, refreshOrders]);

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>{order.id}</div>
      ))}
    </div>
  );
}
```

### Coordinating Multiple Contexts

```jsx
import { useCart, useOrders, useDataSync } from './contexts';
import { useEffect } from 'react';

function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const { refreshOrders } = useOrders();
  const dataSync = useDataSync();

  const handleOrderCreated = async (orderId) => {
    // Clear the cart
    clearCart();
    
    // Refresh orders to show the new order
    await refreshOrders();
    
    // Notify other components
    dataSync.emitOrdersUpdate({ 
      action: 'created', 
      orderId 
    });
  };

  return (
    <button onClick={() => handleOrderCreated(123)}>
      Complete Order
    </button>
  );
}
```

## Available Hooks

### Data Sync Hooks

- `useDataSync()` - Access the full data sync API
- `useCartSync(callback)` - Listen to cart updates
- `useWishlistSync(callback)` - Listen to wishlist updates
- `useOrdersSync(callback)` - Listen to order updates
- `useUserDataSync(callback)` - Listen to user data updates
- `useAuthSync(callback)` - Listen to authentication updates
- `useProductsSync(callback)` - Listen to product updates

### Context Hooks

All contexts provide refresh methods:

- `useCart()` - Cart state and operations
- `useWishlist()` - Wishlist with `refreshWishlist()`
- `useOrders()` - Orders with `refreshOrders()`
- `useUserData()` - User profile/addresses with `refreshUserData()`
- `useAuth()` - Authentication state

## Event Types

### Cart Events
```javascript
{ action: 'update', items: [...] }
{ action: 'add', productId: 123 }
{ action: 'remove', productId: 123 }
{ action: 'clear' }
```

### Wishlist Events
```javascript
{ action: 'load', items: [...] }
{ action: 'add', productId: 123 }
{ action: 'remove', id: 456 }
```

### Order Events
```javascript
{ action: 'load', orders: [...] }
{ action: 'cancel', orderId: 123 }
{ action: 'created', orderId: 456 }
```

### User Data Events
```javascript
{ action: 'updateProfile', data: {...} }
{ action: 'addAddress', address: {...} }
{ action: 'updateAddress', id: 123, data: {...} }
{ action: 'deleteAddress', id: 123 }
{ action: 'setDefaultAddress', id: 123 }
```

### Auth Events
```javascript
{ action: 'login', user: {...} }
{ action: 'logout' }
```

## Benefits

1. **Automatic Updates**: Components automatically refresh when data changes
2. **Cross-Tab Sync**: Cart and other data stay in sync across browser tabs
3. **Loose Coupling**: Components don't need to know about each other
4. **Centralized State**: Single source of truth for all application data
5. **Real-Time Experience**: Users see updates immediately
6. **Developer Friendly**: Simple hooks and clear event patterns

## Best Practices

1. **Use Context Refresh Methods**: Always use `refreshOrders()`, `refreshWishlist()`, etc. instead of reloading the page
2. **Emit Events After Success**: Only emit sync events after successful API calls
3. **Clean Up Subscriptions**: Always return the unsubscribe function from useEffect
4. **Handle Errors**: Wrap sync operations in try-catch blocks
5. **Avoid Circular Updates**: Don't trigger updates that cause infinite loops

## Implementation Details

### Provider Hierarchy

```
DataSyncProvider (top level)
├── AuthProvider
│   └── UserDataProvider
│       └── OrderProvider
│           └── WishlistProvider
│               └── CartProvider
```

The `DataSyncProvider` must be at the top level so all other contexts can access it.

### Storage Events

Cart changes are automatically synced across tabs via localStorage:

```javascript
// In CartContext
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEYS.CART && e.newValue !== e.oldValue) {
      const newCart = JSON.parse(e.newValue);
      dispatch({ type: 'LOAD_CART', payload: newCart });
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Future Enhancements

Potential improvements to consider:

1. **WebSocket Integration**: Real-time server updates for orders, inventory
2. **Optimistic Updates**: Show changes immediately before API confirmation
3. **Offline Support**: Queue changes and sync when connection returns
4. **Conflict Resolution**: Handle simultaneous updates from multiple tabs
5. **Event History**: Track and replay data changes for debugging
6. **Selective Updates**: Fine-grained control over what components update
