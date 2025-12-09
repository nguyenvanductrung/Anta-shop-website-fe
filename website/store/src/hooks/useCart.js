// src/hooks/useCart.js
import { useEffect, useState, useCallback } from "react";
import { cartService } from "../services/api";
import { getSessionId } from "../utils/session";
import { STORAGE_KEYS } from "../constants/index";

export function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMerged, setHasMerged] = useState(false);

  const getUser = () => {
    try {
      const userStr =
        localStorage.getItem(STORAGE_KEYS.USER) ||
        localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("❌ getUser parse error:", e);
      return null;
    }
  };

  const user = getUser();
  const sessionId = getSessionId();

  // ============= FETCH CART =============
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      let response;
      if (user?.id) {
        // ưu tiên giỏ theo userId
        response = await cartService.getCurrentCart(user.id, null);
      } else {
        // guest: lấy theo sessionId
        response = await cartService.getCurrentCart(null, sessionId);
      }

      setCart(response || null);
    } catch (err) {
      console.error("❌ fetchCart error:", err);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, sessionId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ============= MERGE guest -> user KHI LOGIN =============
  useEffect(() => {
    const mergeCartsOnLogin = async () => {
      const currentUser = getUser();

      if (!currentUser?.id || !sessionId || hasMerged) return;

      try {
        await cartService.mergeCart(sessionId, currentUser.id);
        setHasMerged(true);
        await fetchCart(); // sau merge luôn fetch theo userId
      } catch (err) {
        console.error("❌ Merge cart error:", err);
      }
    };

    mergeCartsOnLogin();
  }, [user?.id, sessionId, hasMerged, fetchCart]);

  // ============= CRUD CART =============
  const addItem = async (product) => {
    const payload = {
      userId: user?.id || null,
      sessionId: user ? null : sessionId,
      productId: Number(product.id),
      variantId: product.variantId ? Number(product.variantId) : null,
      productName: product.name,
      unitPrice: Number(product.price),
      quantity: product.quantity || 1,
    };

    const updatedCart = await cartService.addToCart(payload);
    setCart(updatedCart);
    return updatedCart;
  };

  const removeItem = async (itemId) => {
    await cartService.removeItem(itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!cart?.id) return;
    await cartService.clearCart(cart.id); // 👈 CÁI NÀY CHỈ DÙNG KHI BẠN BẤM "XÓA GIỎ HÀNG" TRÊN UI
    await fetchCart();
  };

  const updateQuantity = async (productId, variantId, newQuantity) => {
    if (!cart?.id) throw new Error("No cart found");
    const updatedCart = await cartService.updateQuantity(
      cart.id,
      Number(productId),
      variantId,
      Number(newQuantity)
    );
    setCart(updatedCart);
    return updatedCart;
  };

  // ============= RESET KHI LOGOUT – CHỈ FE, KHÔNG ĐỤNG DB =============
  const resetCartAfterLogout = () => {
    // ❌ KHÔNG gọi clearCart / API
    // ❌ KHÔNG xoá sessionId (để DB giữ nguyên mọi thứ)
    setCart(null);
    setHasMerged(false);
  };

  const value = {
    cart,
    loading,
    addItem,
    removeItem,
    clearCart,              // dùng cho nút "Xóa tất cả" trong CartPage
    updateQuantity,
    refreshCart: fetchCart,
    mergeGuestToUser: async () => {}, // hiện chưa dùng, để trống cũng được
    resetCartAfterLogout,   // 👉 dùng khi logout

    get items() {
      return cart?.items || [];
    },
    get totalItems() {
      return (cart?.items || []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    },
    get totalPrice() {
      return (cart?.items || []).reduce((sum, item) => {
        const price = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    },
  };

  return value;
}
