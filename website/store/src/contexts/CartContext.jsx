import React, { createContext, useContext, useMemo } from 'react';
import { useCart as useCartHook } from '../hooks/useCart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { cart, loading, addItem, removeItem, clearCart, updateQuantity, refreshCart } = useCartHook();

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
      // QUAN TRỌNG: CartPage dùng item.id để xóa/update
      // Nhưng item.id này phải là cartItem.id (từ DB)
      const mappedItem = {
        id: cartItem.id,           // CartItem ID từ DB
        cartItemId: cartItem.id,   // Giữ thêm reference
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        name: cartItem.productName,
        price: cartItem.unitPrice,
        quantity: cartItem.quantity,

        // CartPage cần các field này (thêm mặc định)
        image: 'https://via.placeholder.com/100x100?text=Product',
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
    const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    console.log('🧮 [CartContext] Total items:', total);
    return total;
  }, [items]);

  const totalPrice = useMemo(() => {
    const total = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    console.log('💰 [CartContext] Total price:', total);
    return total;
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
      return await addItem(product);
    },

    // QUAN TRỌNG: CartPage gọi removeFromCart(item.id)
    // item.id này là cartItem.id (đã map ở trên)
    removeFromCart: async (cartItemId, options = {}) => {
      console.log('🗑️ [CartContext] removeFromCart called:', { cartItemId, options });
      await removeItem(cartItemId);
    },

    // QUAN TRỌNG: CartPage gọi updateQuantity(item.id, newQuantity)
    updateQuantity: async (cartItemId, quantity, options = {}) => {
      console.log('🔢 [CartContext] updateQuantity called:', { cartItemId, quantity, options });

      // Tìm item để lấy productId và variantId
      const item = items.find(i => i.id === cartItemId);
      if (!item) {
        console.error('❌ [CartContext] Item not found for cartItemId:', cartItemId);
        return;
      }

      console.log('🔍 [CartContext] Found item for update:', item);

      if (cart?.id) {
        await updateQuantity(
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