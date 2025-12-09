import React, { createContext, useContext, useMemo } from 'react';
import { useCart as useCartHook } from '../hooks/useCart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Đổi tên updateQuantity từ hook để tránh trùng
  const {
    cart,
    loading,
    addItem,
    removeItem,
    clearCart,
    updateQuantity: updateQuantityHook,
    refreshCart,
    mergeGuestToUser,
    resetCartAfterLogout,
  } = useCartHook();

  // DEBUG: Log cart từ BE
  console.log('🛒 [CartContext] BE Cart:', cart);
  console.log('🛒 [CartContext] BE Items:', cart?.items);

  // Map data từ BE sang CartPage format
  const items = useMemo(() => {
    if (!cart?.items) {
      console.log('🔄 [CartContext] No items in cart');
      return [];
    }

    console.log('🔄 [CartContext] Mapping BE items...');
    return cart.items.map(cartItem => {
      const mappedItem = {
        id: cartItem.id,           // CartItem ID từ DB
        cartItemId: cartItem.id,   // Giữ thêm reference
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        name: cartItem.productName,
        price: cartItem.unitPrice,
        quantity: cartItem.quantity,

        // Các field bổ sung cho FE
        image: cartItem.imageUrl || 'https://via.placeholder.com/100x100?text=Product',
        size: null,
        color: null,
        sku: `SKU-${cartItem.productId}`,
        originalPrice: null
      };

      console.log('📝 [CartContext] Mapped item:', mappedItem);
      return mappedItem;
    });
  }, [cart]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  }, [items]);

  const value = {
    items,
    cartId: cart?.id,
    loading,
    totalItems,
    totalPrice,
    subtotal: totalPrice,

    addToCart: async (product, quantity = 1, options = {}) => {
      console.log('➕ [CartContext] addToCart called:', { product, quantity, options });
      // Truyền quantity vào payload
      return await addItem({ ...product, quantity });
    },

    removeFromCart: async (cartItemId, options = {}) => {
      console.log('🗑️ [CartContext] removeFromCart called:', { cartItemId, options });
      await removeItem(cartItemId);
    },

    updateQuantity: async (cartItemId, quantity, options = {}) => {
      console.log('🔢 [CartContext] updateQuantity called:', { cartItemId, quantity, options });

      const item = items.find(i => i.id === cartItemId);
      if (!item) {
        console.error('❌ [CartContext] Item not found for cartItemId:', cartItemId);
        return;
      }

      if (cart?.id) {
        await updateQuantityHook(
          item.productId,
          item.variantId,
          Number(quantity)
        );
      }
    },

    clearCart: async () => {
      console.log('🧹 [CartContext] clearCart called');
      if (cart?.id) {
        await clearCart();
      }
    },

    refreshCart,
    mergeGuestToUser,
    resetCartAfterLogout,
  };

  console.log('🎯 [CartContext] Returning value:', {
    itemsCount: value.items.length,
    totalItems: value.totalItems,
    totalPrice: value.totalPrice,
    cartId: value.cartId
  });

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};