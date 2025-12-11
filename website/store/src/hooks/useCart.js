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
        response = await cartService.getCurrentCart(user.id, null);
      } else {
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
        await fetchCart();
      } catch (err) {
        console.error("❌ Merge cart error:", err);
      }
    };

    mergeCartsOnLogin();
  }, [user?.id, sessionId, hasMerged, fetchCart]);

  // --- helper: resolve variantId from various possible shapes
  const resolveVariantId = (product) => {
    if (!product) return null;
    const cand =
      product.variantId ??
      (product.variant && (product.variant.id ?? product.variantId)) ??
      product.selectedVariantId ??
      product.selectedVariant?.id ??
      product.option?.variantId ??
      null;
    if (cand === undefined) return null;
    if (cand === null) return null;
    if (typeof cand === "string" && cand.trim() === "") return null;
    const n = Number(cand);
    return Number.isNaN(n) ? null : n;
  };

  // ============= CRUD CART =============
  // file: src/hooks/useCart.js (function addItem)
  const addItem = async (product) => {
    const payload = {
      userId: user?.id || null,
      sessionId: user ? null : sessionId,
      productId: Number(product.id),
      variantId: resolveVariantId(product), // đảm bảo null hoặc số
      productName: product.name,
      unitPrice: Number(product.price),
      quantity: product.quantity || 1,
      // NEW: include variant attributes so BE can save/display them
      size: product.size || null,
      color: product.color || null,
      sku: product.sku || null,
      imageUrl: product.image || null,
    };

    console.log("➕ [useCart] addItem payload:", payload);

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
    await cartService.clearCart(cart.id);
    await fetchCart();
  };

  const updateQuantity = async (productId, variantId, newQuantity) => {
    if (!cart?.id) throw new Error("No cart found");
    const resolvedVariant = variantId === undefined ? null : (variantId === null ? null : Number(variantId));
    const updatedCart = await cartService.updateQuantity(
      cart.id,
      Number(productId),
      resolvedVariant,
      Number(newQuantity)
    );
    setCart(updatedCart);
    return updatedCart;
  };

  const resetCartAfterLogout = () => {
    setCart(null);
    setHasMerged(false);
  };

  const value = {
    cart,
    loading,
    addItem,
    removeItem,
    clearCart,
    updateQuantity,
    refreshCart: fetchCart,
    mergeGuestToUser: async () => { },
    resetCartAfterLogout,

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
