import { useEffect, useState, useCallback } from "react";
import { cartService } from "../services/api";
import { getSessionId } from "../utils/session";

export function useCart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previousUser, setPreviousUser] = useState(null);

    // Lấy user từ localStorage
    const getUser = () => {
        try {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    };

    const user = getUser();
    const sessionId = getSessionId();

    // Hàm fetch giỏ hàng
    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);

            let response;
            if (user?.id) {
                // Ưu tiên lấy giỏ theo userId
                response = await cartService.getCurrentCart(user.id, null);
            } else {
                // Nếu chưa login thì lấy theo sessionId
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

    // Auto fetch khi user/session thay đổi
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Merge giỏ khi login
    useEffect(() => {
        const mergeCartsOnLogin = async () => {
            const currentUser = getUser();

            // Chỉ merge khi: có user mới login (previousUser null, currentUser có) và có sessionId
            if (currentUser?.id && !previousUser && sessionId) {
                try {
                    await cartService.mergeCart(sessionId, currentUser.id);
                    await fetchCart(); // Sau merge thì lấy giỏ theo userId
                } catch (err) {
                    console.error("❌ Merge cart error:", err);
                }
            }

            // Cập nhật previousUser
            if (currentUser?.id !== previousUser?.id) {
                setPreviousUser(currentUser);
            }
        };

        mergeCartsOnLogin();
    }, [user?.id, sessionId, previousUser, fetchCart]);

    // Các hàm thao tác giỏ
    const addItem = async (product) => {
        const payload = {
            userId: user?.id || null,
            sessionId: user ? null : sessionId, // bỏ sessionId khi đã login
            productId: Number(product.id),
            variantId: product.variantId ? Number(product.variantId) : null,
            productName: product.name,
            unitPrice: Number(product.price),
            quantity: product.quantity || 1,
        };

        const updatedCart = await cartService.addToCart(payload);
        setCart(updatedCart);
        setTimeout(() => fetchCart(), 1000);
        return updatedCart;
    };

    const removeItem = async (itemId) => {
        await cartService.removeItem(itemId);
        await fetchCart();
    };

    const clearCart = async () => {
        if (!cart?.id) return;
        await cartService.clearCart(cart.id);
        setCart(null);
    };

    const updateQuantity = async (productId, variantId, newQuantity) => {
        if (!cart?.id) throw new Error("No cart found");
        const updatedCart = await cartService.updateQuantity(
            cart.id,
            Number(productId),
            variantId,
            Number(newQuantity)
        );
        setCart(updatedCart?.cart || updatedCart);
        return updatedCart;
    };

    // Giá trị trả về cho context
    const value = {
        cart,
        loading,
        addItem,
        removeItem,
        clearCart,
        updateQuantity,
        refreshCart: fetchCart,

        // Computed properties
        get items() {
            return cart?.items || [];
        },
        get totalItems() {
            return (cart?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
        },
        get totalPrice() {
            return (cart?.items || []).reduce((sum, item) => {
                const price = item.unitPrice || 0;
                const quantity = item.quantity || 0;
                return sum + price * quantity;
            }, 0);
        }
    };

    return value;
}