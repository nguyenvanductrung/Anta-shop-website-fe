import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartService } from "../services/api";
import { getSessionId } from "../utils/session";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const userId = useMemo(() => (isAuthenticated && user?.id ? Number(user.id) : null), [isAuthenticated, user?.id]);

  const [cart, setCart] = useState({ id: null, items: [] });
  const [loading, setLoading] = useState(false);

  // giữ sessionId ổn định + có thể reset khi logout
  const [sessionId, setSessionId] = useState(() => getSessionId());

  // merge flag - chỉ merge 1 lần / mỗi lần login
  const [hasMerged, setHasMerged] = useState(false);

  // tránh setState khi unmount (optional safety)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ================== FETCH CART ==================
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      const res = userId
        ? await cartService.getCurrentCart(userId, null)
        : await cartService.getCurrentCart(null, sessionId);

      if (!mountedRef.current) return;
      setCart(res || { id: null, items: [] });
    } catch (err) {
      console.error("❌ fetchCart error:", err);
      if (!mountedRef.current) return;
      setCart({ id: null, items: [] });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId, sessionId]);

  // fetch khi mount / khi userId / session đổi
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ================== RESET MERGE FLAG KHI LOGIN ==================
  useEffect(() => {
    if (userId) {
      setHasMerged(false); // 🔥 quan trọng: login -> reset để merge lại đúng 1 lần
    }
  }, [userId]);

  // ================== MERGE GUEST → USER (1 LẦN) ==================
  useEffect(() => {
    if (!userId || hasMerged) return;

    const mergeCart = async () => {
      try {
        // nếu guest cart trống thì khỏi merge
        const guestCart = await cartService.getCurrentCart(null, sessionId);
        const hasGuestItems = !!guestCart?.items?.length;

        if (!hasGuestItems) {
          setHasMerged(true);
          return;
        }

        await cartService.mergeCart(sessionId, userId);
        setHasMerged(true);
        await fetchCart();
      } catch (err) {
        console.error("❌ mergeCart error:", err);
      }
    };

    mergeCart();
  }, [userId, sessionId, hasMerged, fetchCart]);

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

    if (cand === undefined || cand === null) return null;
    if (typeof cand === "string" && cand.trim() === "") return null;

    const n = Number(cand);
    return Number.isNaN(n) ? null : n;
  };

  // ================== CRUD ==================
  const addItem = useCallback(
    async (product) => {
      const payload = {
        userId: userId || null,
        sessionId: userId ? null : sessionId,

        productId: Number(product.id),
        variantId: resolveVariantId(product), // null hoặc number

        productName: product.name,
        unitPrice: Number(product.price),
        quantity: product.quantity || 1,

        // optional (không ảnh hưởng nếu BE bỏ qua)
        size: product.size || null,
        color: product.color || null,
        sku: product.sku || null,
        imageUrl: product.image || product.imageUrl || null,
      };

      const updated = await cartService.addToCart(payload);
      if (mountedRef.current) setCart(updated || { id: null, items: [] });
      return updated;
    },
    [userId, sessionId]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      await cartService.removeItem(cartItemId);
      await fetchCart();
    },
    [fetchCart]
  );

  // ✅ FIX: updateQuantity nhận (cartItemId, quantity, options) đúng như CartPage đang gọi
  const updateQuantity = useCallback(
    async (cartItemId, quantity, options) => {
      if (!cart?.id) return;

      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) throw new Error("Quantity invalid");

      // item.id thường là cartItemId
      let item = (cart?.items || []).find(i => String(i.id) === String(cartItemId));

      // fallback nếu nơi khác truyền productId thay vì cartItemId
      if (!item) item = (cart?.items || []).find(i => String(i.productId) === String(cartItemId));

      if (!item) throw new Error("Không tìm thấy cart item để cập nhật");

      const productId = Number(item.productId ?? item.product?.id ?? item.productId);
      const variantIdRaw = item.variantId ?? item.variant?.id ?? null;
      const variantIdNum = (variantIdRaw === null || variantIdRaw === undefined || variantIdRaw === "")
        ? null
        : Number(variantIdRaw);

      const updated = await cartService.updateQuantity(
        cart.id,
        productId,
        Number.isNaN(variantIdNum) ? null : variantIdNum,
        qty
      );

      if (mountedRef.current) setCart(updated || { id: null, items: [] });
      return updated;
    },
    [cart?.id, cart?.items]
  );


  const clearCart = useCallback(
    async () => {
      if (!cart?.id) return;
      await cartService.clearCart(cart.id);
      await fetchCart();
    },
    [cart?.id, fetchCart]
  );

  // ================== RESET KHI LOGOUT ==================
  useEffect(() => {
    const onLogout = () => {
      console.debug("[CartContext] auth:logout → reset FE cart");
      setCart({ id: null, items: [] });
      setHasMerged(false);
      setSessionId(getSessionId());
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      addItem,
      removeItem,
      removeFromCart: removeItem,
      clearCart,
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
    }),
    [cart, loading, addItem, removeItem, clearCart, updateQuantity, fetchCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider />");
  return ctx;
}
