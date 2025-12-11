//src/contexts/CartContext.jsx
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
  // Map data từ BE sang CartPage format (chuẩn hoá kiểu: number|null, fallback rõ ràng)
  // Map data từ BE sang CartPage format (chuẩn hoá kiểu: number|null, fallback rõ ràng)
  const items = useMemo(() => {
    if (!cart?.items) {
      console.log('🔄 [CartContext] No items in cart');
      return [];
    }

    console.log('🔄 [CartContext] Mapping BE items...');
    // inside useMemo mapping in CartContext.jsx (replace the mapping function body)
    return cart.items.map(cartItem => {
      // normalize numeric fields (prevent undefined / string)
      const mappedProductId = cartItem.productId != null ? Number(cartItem.productId) : (cartItem.product_id != null ? Number(cartItem.product_id) : null);
      const mappedVariantId = cartItem.variantId != null ? Number(cartItem.variantId) : (cartItem.variant_id != null ? Number(cartItem.variant_id) : null);
      const mappedPrice = cartItem.unitPrice != null ? Number(cartItem.unitPrice) : (cartItem.unit_price != null ? Number(cartItem.unit_price) : 0);
      const mappedQty = cartItem.quantity != null ? Number(cartItem.quantity) : (cartItem.qty != null ? Number(cartItem.qty) : 0);

      // attributes could be present under various keys or even as a JSON string
      let attrObj = null;
      const rawAttributes = cartItem.attributes ?? cartItem.attrs ?? cartItem.attribute ?? null;
      if (rawAttributes) {
        if (typeof rawAttributes === 'string') {
          try { attrObj = JSON.parse(rawAttributes); } catch { attrObj = null; }
        } else if (typeof rawAttributes === 'object') {
          attrObj = rawAttributes;
        }
      }

      // try many possible keys for size/color
      const sizeCandidate = cartItem.size ?? cartItem.size_label ?? cartItem.attributeSize ?? cartItem.attribute_size ?? attrObj?.size ?? attrObj?.Size ?? cartItem.variant?.size ?? cartItem.variant_size ?? null;
      const colorCandidate = cartItem.color ?? cartItem.attributeColor ?? cartItem.attribute_color ?? attrObj?.color ?? attrObj?.Color ?? cartItem.variant?.color ?? cartItem.variant_color ?? null;

      const size = (sizeCandidate !== undefined && sizeCandidate !== null && String(sizeCandidate).trim() !== '') ? String(sizeCandidate) : null;
      const color = (colorCandidate !== undefined && colorCandidate !== null && String(colorCandidate).trim() !== '') ? String(colorCandidate) : null;

      const mappedItem = {
        id: cartItem.id,             // CartItem ID từ DB (dùng làm key trên FE)
        cartItemId: cartItem.id,     // alias
        productId: mappedProductId,
        // IMPORTANT: variantId must be number or null (not undefined)
        variantId: mappedVariantId,
        name: cartItem.productName || cartItem.name || cartItem.product_name || 'Sản phẩm',
        price: mappedPrice,
        quantity: mappedQty,

        // Các field bổ sung cho FE
        image: cartItem.imageUrl || cartItem.image_url || cartItem.thumbnail || 'https://via.placeholder.com/100x100?text=Product',
        size: size,
        color: color,
        sku: cartItem.sku || cartItem.productSku || cartItem.sku_code || `SKU-${mappedProductId ?? 'unknown'}`,
        originalPrice: cartItem.originalPrice != null ? Number(cartItem.originalPrice) : (cartItem.original_price != null ? Number(cartItem.original_price) : null)
      };

      // Debugging output (tùy bạn giữ/loại)
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