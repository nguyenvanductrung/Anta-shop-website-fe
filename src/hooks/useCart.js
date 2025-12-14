// src/hooks/useCart.js
import { useEffect, useState, useCallback } from "react";
import { cartService } from "../services/api";
import { getSessionId } from "../utils/session";
import { useAuth } from "../contexts/AuthContext";

export function useCart() {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState({ id: null, items: [] });
  const [loading, setLoading] = useState(false);

  // giữ sessionId ổn định (reset lại khi logout)
  const [sessionId, setSessionId] = useState(() => getSessionId());

  // merge flag - chỉ merge 1 lần / mỗi lần login
  const [hasMerged, setHasMerged] = useState(false);

  // --- helper: resolve variantId từ nhiều shape khác nhau
  const resolveVariantId = (product) => {
    if (!product) return null;
    const cand =
      product.variantId ??
      (product.variant && (product.variant.id ?? product.variantId)) ??
      product.selectedVariantId ??
      product.selectedVariant?.id ??
      product.option?.variantId ??
      null;

    if (cand === undefined || cand === null) return null;
    if (typeof cand === "string" && cand.trim() === "") return null;

    const n = Number(cand);
    return Number.isNaN(n) ? null : n;
  };

  // ================== FETCH CART ==================
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      const res =
        isAuthenticated && user?.id
          ? await cartService.getCurrentCart(user.id, null)
          : await cartService.getCurrentCart(null, sessionId);

      setCart(res || { id: null, items: [] });
    } catch (err) {
      console.error("❌ fetchCart error:", err);
      setCart({ id: null, items: [] });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, sessionId]);

  // fetch khi mount / khi user / session đổi
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ================== RESET MERGE FLAG KHI LOGIN ==================
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setHasMerged(false); // 🔥 quan trọng: login -> cho phép merge lại đúng 1 lần
    }
  }, [isAuthenticated, user?.id]);

  // ================== MERGE GUEST → USER (1 LẦN) ==================
  useEffect(() => {
    if (!isAuthenticated || !user?.id || hasMerged) return;

    const mergeCart = async () => {
      try {
        const guestCart = await cartService.getCurrentCart(null, sessionId);
        if (!guestCart?.items?.length) {
          setHasMerged(true);
          return;
        }

        await cartService.mergeCart(sessionId, user.id);
        setHasMerged(true);
        await fetchCart();
      } catch (err) {
        console.error("❌ mergeCart error:", err);
      }
    };

    mergeCart();
  }, [isAuthenticated, user?.id, sessionId, hasMerged, fetchCart]);

  // ================== CRUD ==================
  const addItem = async (product) => {
    const payload = {
      userId: isAuthenticated ? user.id : null,
      sessionId: isAuthenticated ? null : sessionId,

      productId: Number(product.id),
      variantId: resolveVariantId(product),

      productName: product.name,
      unitPrice: Number(product.price),
      quantity: product.quantity || 1,

      // optional (BE ignore cũng không sao)
      size: product.size || null,
      color: product.color || null,
      sku: product.sku || null,
      imageUrl: product.image || product.imageUrl || null,
    };

    const updated = await cartService.addToCart(payload);
    setCart(updated || { id: null, items: [] });
    return updated;
  };

  const removeItem = async (cartItemId) => {
    await cartService.removeItem(cartItemId);
    await fetchCart();
  };

  const updateQuantity = async (productId, variantId, quantity) => {
    if (!cart?.id) return;

    const resolvedVariant =
      variantId === undefined || variantId === null || variantId === ""
        ? null
        : Number(variantId);

    const updated = await cartService.updateQuantity(
      cart.id,
      Number(productId),
      Number.isNaN(resolvedVariant) ? null : resolvedVariant,
      Number(quantity)
    );

    setCart(updated || { id: null, items: [] });
    return updated;
  };

  // ================== RESET KHI LOGOUT ==================
  useEffect(() => {
    const onLogout = () => {
      console.debug("[useCart] auth:logout → reset FE cart");
      setCart({ id: null, items: [] });
      setHasMerged(false);
      setSessionId(getSessionId());
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  // ================== EXPOSE ==================
  return {
    cart,
    loading,
    addItem,
    removeItem,
    updateQuantity,
    refreshCart: fetchCart,

    get items() {
      return cart?.items || [];
    },

    // badge = tổng quantity
    get totalItems() {
      return (cart?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    },

    get totalPrice() {
      return (cart?.items || []).reduce(
        (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
        0
      );
    },
  };
}
