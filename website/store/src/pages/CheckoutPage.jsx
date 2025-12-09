// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components';
import { useCart, useAuth, useDataSync, useUserData } from '../contexts';
import adminService from '../services/adminService';
import { momoPaymentService } from '../services';
import { productService, userService, orderService } from '../services/api';
import { generateVNPayQR, generateBankTransferQR } from '../utils/qrCodeGenerator';
import './CheckoutPage.css';
// --- Helpers: đọc profile & sổ địa chỉ từ localStorage và chuẩn hoá ---
const getStoredProfile = () => {
  try {
    const raw = localStorage.getItem('anta_user_profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      fullName: p.fullName || p.name || p.displayName || '',
      email: p.email || '',
      phoneNumber: p.phoneNumber || p.phone || '', // hỗ trợ cả phone và phoneNumber
    };
  } catch {
    return null;
  }
};

function normalizeAddr(a) {
  if (!a) return null;
  return {
    id: a.id ?? a._id ?? a.key,
    recipientName: a.recipientName || a.name || a.fullName || '',
    phoneNumber: a.phoneNumber || a.phone || '',
    detailedAddress: a.detailedAddress || a.address || '',
    address: a.address || a.detailedAddress || '',
    country: a.country || '',
    isDefault: !!(a.isDefault ?? a.default ?? a.primary),
  };
}

const getStoredAddresses = () => {
  try {
    const raw = localStorage.getItem('anta_user_addresses');
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.map(normalizeAddr).filter(Boolean);
  } catch {
    return [];
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { profile: ctxProfile, addresses: ctxAddresses } = useUserData();
  const dataSync = useDataSync ? (() => {
    try { return useDataSync(); } catch { return null; }
  })() : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: ''
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(null);
  const [momoTransactionId, setMomoTransactionId] = useState(null);
  const paymentTimerRef = useRef(null);

  // ✅ address picker
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // ✅ Helper: áp địa chỉ vào form (đặt TRONG component để dùng được setFormData)
  const applyAddressToForm = useCallback((addr) => {
    if (!addr) return;
    const full = addr.detailedAddress || addr.address || '';
    const parts = full.split(',').map(s => s.trim());
    const base = { address: full, ward: '', district: '', city: '' };
    if (parts.length >= 4) {
      base.address = parts.slice(0, parts.length - 3).join(', ');
      base.ward = parts[parts.length - 3];
      base.district = parts[parts.length - 2];
      base.city = parts[parts.length - 1];
    }
    setFormData(prev => ({
      ...prev,
      fullName: addr.recipientName || prev.fullName,
      phone: addr.phoneNumber || prev.phone,
      address: base.address,
      ward: base.ward,
      district: base.district,
      city: base.city || prev.city
    }));
  }, []);

  // ✅ Load profile + địa chỉ mặc định
  useEffect(() => {
    try {
      // 1) Lấy profile: ưu tiên LocalStorage, fallback context, rồi tới user/email
      const p = getStoredProfile();
      setFormData(prev => ({
        ...prev,
        fullName: (p?.fullName ?? ctxProfile?.fullName ?? '') || '',
        email: (p?.email ?? ctxProfile?.email ?? user?.email) || '',
        phone: (p?.phoneNumber ?? ctxProfile?.phone ?? '') || '',
      }));

      // 2) Lấy sổ địa chỉ: ưu tiên LocalStorage, fallback context
      let list = getStoredAddresses();
      if ((!list || list.length === 0) && ctxAddresses?.length) {
        list = ctxAddresses.map(normalizeAddr);
      }

      setAddresses(list);

      const def = list.find(a => a.isDefault) || list[0] || null;
      if (def) {
        setSelectedAddress(def);
        applyAddressToForm(def);
      }
    } catch (e) {
      console.error('Error loading profile/addresses', e);
    }

    // Reload khi quay lại tab cửa sổ
    const onFocus = () => {
      try {
        let list = getStoredAddresses();
        if ((!list || list.length === 0) && ctxAddresses?.length) {
          list = ctxAddresses.map(normalizeAddr);
        }
        setAddresses(list);
        const latestDefault = list.find(a => a.isDefault) || list[0] || null;
        if (latestDefault) {
          setSelectedAddress(latestDefault);
          applyAddressToForm(latestDefault);
        }
      } catch { }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.email, ctxProfile, ctxAddresses, applyAddressToForm]);


  const SHIPPING_METHODS = {
    standard: { name: 'Giao hàng tiêu chuẩn', price: 30000, time: '3-5 ngày làm việc', icon: '🚚' },
    express: { name: 'Giao hàng nhanh', price: 50000, time: '1-2 ngày làm việc', icon: '⚡' },
    superExpress: { name: 'Giao hàng siêu tốc', price: 80000, time: 'Trong ngày', icon: '🚀' }
  };

  const PAYMENT_METHODS = [
    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: '💸', desc: 'Thanh toán bằng tiền mặt khi nhận hàng', requireQR: false },
    { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'Quét mã QR để chuyển khoản', requireQR: true },
    { id: 'momo', name: 'Ví MoMo', icon: '📱', desc: 'Quét mã QR từ ví điện tử MoMo', requireQR: true },
    { id: 'vnpay', name: 'VNPAY', icon: '💳', desc: 'Quét mã QR thanh toán qua VNPAY', requireQR: true }
  ];

  const VALID_PROMOS = {
    ANTA2024: { discount: 100000, type: 'fixed', description: 'Giảm 100.000₫', minOrder: 500000 },
    SALE10: { discount: 10, type: 'percent', description: 'Giảm 10%', minOrder: 0 },
    NEWUSER: { discount: 50000, type: 'fixed', description: 'Giảm 50.000₫ cho khách hàng mới', minOrder: 300000 },
    FREESHIP: { discount: 0, type: 'freeship', description: 'Miễn phí vận chuyển', minOrder: 0 }
  };

  const FREE_SHIPPING_THRESHOLD = 999000;

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'fixed') return Math.min(appliedPromo.discount, totalPrice);
    if (appliedPromo.type === 'percent') return Math.floor((totalPrice * appliedPromo.discount) / 100);
    return 0;
  };
  const calculateShipping = () => {
    if (items.length === 0) return 0;
    if (appliedPromo?.type === 'freeship' || totalPrice >= FREE_SHIPPING_THRESHOLD) return 0;
    return SHIPPING_METHODS[shippingMethod]?.price || 0;
  };

  const discount = calculateDiscount();
  const shipping = calculateShipping();
  const finalTotal = Math.max(0, totalPrice - discount + shipping);

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName': return value.trim().length < 3 ? 'Họ tên phải có ít nhất 3 ký tự' : '';
      case 'phone': return !/^[0-9]{10}$/.test(value.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : '';
      case 'email': return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email không hợp lệ' : '';
      case 'address': return value.trim().length < 10 ? 'Địa chỉ phải có ít nhất 10 ký tự' : '';
      case 'city': return !value ? 'Vui lòng chọn Tỉnh/Thành phố' : '';
      default: return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };
  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return alert('Vui lòng nhập mã giảm giá');
    const promo = VALID_PROMOS[code];
    if (!promo) return alert('Mã giảm giá không hợp lệ');
    if (totalPrice < promo.minOrder) return alert(`Đơn hàng tối thiểu ${promo.minOrder.toLocaleString()}₫ để áp dụng mã này`);
    setAppliedPromo({ code, ...promo });
    alert('Áp dụng mã giảm giá thành công!');
  };
  const handleRemovePromo = () => { setAppliedPromo(null); setPromoCode(''); };

  const handlePaymentMethodChange = (newMethod) => {
    const oldMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const newMethodObj = PAYMENT_METHODS.find(m => m.id === newMethod);
    setPaymentMethod(newMethod);
    if (oldMethod?.requireQR && !newMethodObj?.requireQR) {
      setQrData(null); setPaymentConfirmed(false); setShowQRCode(false);
    }
  };

  const validateStep1 = () => {
    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      phone: validateField('phone', formData.phone),
      email: validateField('email', formData.email),
      address: validateField('address', formData.address),
    };

    if (formData.city && formData.city !== '') {
      newErrors.city = validateField('city', formData.city);
    } else {
      newErrors.city = '';
    }

    setErrors(newErrors);

    const firstErrKey = Object.keys(newErrors).find(k => newErrors[k]);
    if (firstErrKey) {
      const el = document.querySelector(`[name="${firstErrKey}"]`);
      if (el) el.focus();
    }

    return !Object.values(newErrors).some(Boolean);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Vui lòng kiểm tra và sửa các trường thông tin giao hàng (các ô màu đỏ).');
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const handlePrevStep = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };

  const saveOrderToLocalStorage = (orderData) => {
    try {
      const userOrdersKey = 'anta_user_orders';
      const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
      const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      const isQRPayment = selectedMethod?.requireQR;
      const orderRecord = {
        id: orderData.orderNumber || orderData.id,
        orderNumber: orderData.orderNumber,
        date: orderData.date || new Date().toISOString(),
        createdAt: orderData.orderDate || new Date().toISOString(),
        status: 'Đang xử lý',
        paymentStatus: paymentMethod === 'cod' ? 'Chưa thanh toán' : (isQRPayment && paymentConfirmed ? 'Đã thanh toán' : 'Chờ xác nhận'),
        paymentMethod,
        paymentConfirmed,
        total: orderData.total,
        totalAmount: orderData.total,
        items: orderData.products?.length || orderData.items?.length,
        totalItems: orderData.products?.length || orderData.items?.length,
        image: orderData.items?.[0]?.image || orderData.products?.[0]?.image || 'https://via.placeholder.com/400',
        customer: orderData.customer,
        products: orderData.products || (orderData.items?.map(item => ({
          id: item.id, name: item.name, image: item.image, price: item.price, quantity: item.quantity, size: item.size, color: item.color
        })) || []),
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        shipping: orderData.shipping,
        promoCode: orderData.promoCode
      };
      userOrders.unshift(orderRecord);
      localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
      localStorage.setItem('latest_order', JSON.stringify(orderRecord));
      return true;
    } catch (e) { console.error('saveOrderToLocalStorage error', e); return false; }
  };

  // Generate QR (kept as-is mostly)
  // inside component
  // (inside CheckoutPage) - replace generateQRCodeForPayment with this version
  const generateQRCodeForPayment = async () => {
    const orderNumber = `ANT${Date.now().toString().slice(-8)}`;

    // 1) build normalized items
    const normalizedItems = items.map(it => ({
      productId: Number(it.productId ?? it.id ?? null),
      variantId: Number(it.variantId ?? it.variant?.id ?? null),
      quantity: Number(it.quantity ?? it.qty ?? 1),
      price: Number(it.price ?? 0)
    }));

    const shippingAddress = `${formData.address || ''}${formData.ward ? ', ' + formData.ward : ''}${formData.district ? ', ' + formData.district : ''}${formData.city ? ', ' + formData.city : ''}`;

    const orderPayload = {
      orderNumber,
      userId: (user && user.id) || (JSON.parse(localStorage.getItem('anta_user_profile') || 'null')?.id) || null,
      items: normalizedItems,
      shippingAddress,
      subtotal: totalPrice,
      discount,
      shipping,
      total: finalTotal,
      paymentMethod: 'MOMO', // cho order record
      shippingMethod,
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      }
    };

    setPaymentProgress({ status: 'creating-order' });

    // 2) create order on order-service (should persist to MySQL and return orderId)
    let orderResp;
    try {
      orderResp = await orderService.createOrder(orderPayload);
    } catch (err) {
      setPaymentProgress({ status: 'failed', message: 'Không tạo được đơn hàng: ' + (err?.message || err) });
      console.error('createOrder failed', err);
      return;
    }

    // Ensure orderResp contains orderId and total (adjust based on your order-service response shape)
    const orderId = orderResp?.orderId ?? orderResp?.id ?? orderResp?.data?.orderId;
    const serverTotal = orderResp?.total ?? orderResp?.data?.total ?? orderPayload.total;

    if (!orderId) {
      setPaymentProgress({ status: 'failed', message: 'Server không trả về orderId' });
      console.error('order creation response', orderResp);
      return;
    }

    setPaymentProgress({ status: 'created-order', orderId });

    // 3) call payment-service to create MoMo request with the real orderId and amount
    setPaymentProgress({ status: 'creating-payment' });
    const paymentReqPayload = { orderId, userId: orderPayload.userId, amount: serverTotal };

    const resp = await momoPaymentService.createPaymentRequest(paymentReqPayload);
    if (!resp.success) {
      setPaymentProgress({ status: 'failed', message: resp.error || 'Không tạo được yêu cầu thanh toán' });
      // Optionally update order status to FAILED/ CANCELLED via orderService if desired
      return;
    }

    const data = resp.data || {};

    // Build qrCodeUrl (choose whichever the backend returns)
    let qrCodeUrl = null;
    if (data.qrImageBase64) qrCodeUrl = `data:image/png;base64,${data.qrImageBase64}`;
    else if (data.qrCodeUrl) qrCodeUrl = data.qrCodeUrl;
    else if (data.deeplink) qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.deeplink)}`;
    else if (data.payUrl) qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.payUrl)}`;

    if (!qrCodeUrl) {
      setPaymentProgress({ status: 'failed', message: 'Provider không trả về QR hoặc payUrl' });
      return;
    }

    setQrData({
      transactionId: data.transactionId || data.requestId || data.orderId,
      requestId: data.requestId || null,
      orderId,
      qrCodeUrl,
      qrContent: data.deeplink || data.payUrl || null,
      amount: data.amount ?? serverTotal,
      orderNumber
    });

    setMomoTransactionId(data.requestId || data.transactionId || null);
    setShowQRCode(true);
    setPaymentProgress(null);

    // 4) optionally: start polling backend for order status (in Background)
    momoPaymentService.autoProcessPayment(data.requestId || data.transactionId || data.requestId || data.orderId, (p) => setPaymentProgress(p), { interval: 3000, timeout: 120000 })
      .then(result => {
        if (result.success) {
          setPaymentConfirmed(true);
          // finalize local UI and clear cart
          clearCart();
          navigate('/order-success', { state: { orderId, orderData: orderResp } });
        } else {
          // timeout or failed -> user will confirm manually or check order
          console.warn('momo auto poll ended', result);
        }
      }).catch(err => console.warn('autoProcessPayment error', err));
  };


  const startMoMoSimulation = async (transactionId) => {
    try {
      const result = await momoPaymentService.autoProcessPayment(transactionId, setPaymentProgress);
      if (result.success) {
        setTimeout(() => {
          setPaymentConfirmed(true);
          setPaymentProgress({ status: 'success', message: 'Thanh toán thành công!' });
          setTimeout(() => { setShowQRCode(false); processOrder(); }, 1500);
        }, 500);
      } else {
        setPaymentProgress({ status: 'failed', message: result.error || 'Thanh toán thất bại. Vui lòng thử lại.' });
      }
    } catch (err) {
      setPaymentProgress({ status: 'failed', message: err?.message || 'Lỗi thanh toán' });
    }
  };

  const handleConfirmPayment = async () => { setPaymentConfirmed(true); setShowQRCode(false); await processOrder(); };
  const handleCancelQR = () => {
    if (momoTransactionId && paymentMethod === 'momo') momoPaymentService.cancelPayment?.(momoTransactionId);
    if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
    setPaymentProgress(null); setShowQRCode(false);
  };

  // --- CHÍNH: processOrder dùng adminService.orders.createOrder và ensure mỗi item có image ---
  // NEW: processOrder thực tế -> gọi order-service, xử lý MoMo (mở payUrl) và poll trạng thái order
  const processOrder = async () => {
    setIsSubmitting(true);
    try {
      // xác định userId từ context / localStorage
      const storedUser = JSON.parse(localStorage.getItem('anta_user_profile') || 'null') || {};
      const userId = (user && user.id) || storedUser.id || null;

      // chuẩn hoá items theo backend: variantId bắt buộc
      const normalizedItems = await Promise.all(items.map(async (it) => {
        // backend expects: { productId, variantId, quantity, note? }
        // try find variantId from item.variantId or item.id if that's variant
        const variantId = it.variantId ?? it.id ?? it.variant?.id ?? null;
        const productId = it.productId ?? it.id ?? null;
        return {
          productId: productId ? Number(productId) : null,
          variantId: variantId ? Number(variantId) : null,
          quantity: Number(it.quantity || it.qty || 1),
          note: it.note || undefined,
        };
      }));

      // shippingAddress: compose string from form
      const shippingAddress = `${formData.address || ''}${formData.ward ? ', ' + formData.ward : ''}${formData.district ? ', ' + formData.district : ''}${formData.city ? ', ' + formData.city : ''}`;

      const payload = {
        userId: userId ? Number(userId) : null,
        items: normalizedItems,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod === 'momo' ? 'MOMO' : (paymentMethod === 'vnpay' ? 'VNPAY' : (paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'COD')),
      };

      // Call order-service (this will create order row in MySQL via backend)
      const resp = await orderService.createOrder(payload);
      // resp expected shape: { orderId, status, payUrl }
      // if resp contains payUrl (MoMo), open it in new tab for user
      if (resp && resp.payUrl) {
        // open payment link in new tab/window
        window.open(resp.payUrl, "_blank");
      }

      // poll order status until PAID/FAILED/CANCELLED (backend must persist and update when IPN)
      if (resp && resp.orderId) {
        const pollResult = await (async function pollOrderStatus(orderId) {
          let tries = 0;
          const maxTries = 60; // up to e.g. 2 minutes (60 * 2s)
          let delayMs = 2000;
          while (tries < maxTries) {
            try {
              const o = await orderService.getOrder(orderId);
              // o.status should be like 'PENDING_PAYMENT', 'PAID', 'FAILED' ...
              const s = (o?.status || '').toUpperCase();
              if (s === 'PAID' || s === 'DELIVERED' || s === 'CONFIRMED') {
                return { ok: true, order: o };
              }
              if (s === 'FAILED' || s === 'CANCELLED') {
                return { ok: false, order: o };
              }
            } catch (err) {
              // ignore read errors, continue polling
              console.warn('pollOrderStatus error', err);
            }
            // wait and retry
            await new Promise(r => setTimeout(r, delayMs));
            tries++;
            // backoff (but cap)
            if (delayMs < 10000) delayMs = Math.min(10000, delayMs + 1000);
          }
          return { ok: null, order: null };
        })(resp.orderId);

        // handle poll result
        if (pollResult.ok === true) {
          // paid
          saveOrderToLocalStorage(pollResult.order || resp);
          clearCart();
          navigate('/order-success', { state: { orderData: pollResult.order || resp } });
          return;
        } else if (pollResult.ok === false) {
          // payment failed/cancelled
          saveOrderToLocalStorage(pollResult.order || resp);
          alert('Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác.');
          navigate('/order-failed', { state: { orderData: pollResult.order || resp } });
          return;
        } else {
          // timed out
          saveOrderToLocalStorage(resp);
          alert('Đơn hàng đã được tạo. Vui lòng kiểm tra trạng thái đơn hàng sau hoặc liên hệ hỗ trợ.');
          navigate('/order-success', { state: { orderData: resp } });
          return;
        }
      } else {
        // no orderId returned -> treat as error
        throw new Error('Không nhận được orderId từ server');
      }
    } catch (err) {
      console.error('Error placing order (real):', err);
      alert('Có lỗi xảy ra khi đặt hàng: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateStep1()) { setCurrentStep(1); alert('Vui lòng kiểm tra lại thông tin giao hàng'); return; }
    if (!items || items.length === 0) { alert('Giỏ hàng trống'); return; }


    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    if (selectedMethod?.requireQR && !qrData) { generateQRCodeForPayment(); return; }
    if (selectedMethod?.requireQR && !paymentConfirmed) { alert('Vui lòng quét mã QR và xác nhận thanh toán trước khi hoàn tất đơn hàng'); setShowQRCode(true); return; }

    await processOrder();
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="checkout-page">
          <div className="container">
            <div className="empty-checkout">
              <div className="empty-icon">🛒</div>
              <h2>Giỏ hàng của bạn đang trống</h2>
              <p>Hãy thêm sản phẩm vào giỏ hàng để tiến hành thanh toán</p>
              <button className="btn-primary" onClick={() => navigate('/home')}>Tiếp tục mua sắm</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="checkout-page">
        <div className="checkout-breadcrumbs">
          <div className="container">
            <Link to="/home" className="breadcrumb-link">Trang chủ</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/cart" className="breadcrumb-link">Giỏ hàng</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Thanh toán</span>
          </div>
        </div>

        <div className="checkout-header">
          <div className="container">
            <h1>Thanh toán</h1>
            <div className="checkout-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">{currentStep > 1 ? <span className="check-icon">✓</span> : '1'}</div>
                <span className="step-label">Thông tin</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">{currentStep > 2 ? <span className="check-icon">✓</span> : '2'}</div>
                <span className="step-label">Vận chuyển</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <span className="step-label">Thanh toán</span>
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-content">
          <div className="container">
            <div className="checkout-layout">
              <div className="checkout-main">
                <form onSubmit={handlePlaceOrder}>
                  {currentStep === 1 && (
                    <div className="checkout-section active">
                      <h2 className="section-title">Thông tin giao hàng</h2>

                      <div className="selected-address-card">
                        <div className="sel-left">
                          <div className="sel-title">Địa chỉ nhận hàng</div>
                          {selectedAddress ? (
                            <>
                              <div className="sel-name">{selectedAddress.recipientName}</div>
                              <div className="sel-phone">{selectedAddress.phoneNumber || selectedAddress.phone}</div>
                              <div className="sel-addr">
                                {(selectedAddress.detailedAddress || selectedAddress.address)}
                                {selectedAddress.country ? `, ${selectedAddress.country}` : ''}
                              </div>
                              {selectedAddress.isDefault && <span className="badge-default">Mặc định</span>}
                            </>
                          ) : (
                            <div className="sel-empty">Bạn chưa có địa chỉ. Hãy thêm ở Sổ địa chỉ.</div>
                          )}
                        </div>
                        <div className="sel-right">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddressPicker(true)}>Thay đổi</button>
                          <button type="button" className="btn-link" onClick={() => navigate('/account/addresses')}>Quản lý sổ địa chỉ →</button>
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label htmlFor="fullName">Họ và tên <span className="required">*</span></label>
                          <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} onBlur={handleInputBlur} placeholder="Nhập họ và tên đầy đủ" className={errors.fullName ? 'error' : ''} />
                          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="phone">Số điện thoại <span className="required">*</span></label>
                          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} onBlur={handleInputBlur} placeholder="Nhập số điện thoại" className={errors.phone ? 'error' : ''} />
                          {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="email">Email</label>
                          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleInputBlur} placeholder="Nhập email (không bắt buộc)" className={errors.email ? 'error' : ''} />
                          {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="address">Địa chỉ <span className="required">*</span></label>
                          <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} onBlur={handleInputBlur} placeholder="Số nhà, tên đường..." className={errors.address ? 'error' : ''} />
                          {errors.address && <span className="error-message">{errors.address}</span>}
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="note">Ghi chú đơn hàng</label>
                          <textarea id="note" name="note" value={formData.note} onChange={handleInputChange} placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn..." rows="3" maxLength="500" />
                          <span className="char-count">{formData.note.length}/500</span>
                        </div>
                      </div>

                      <div className="step-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/cart')}>← Quay lại giỏ hàng</button>
                        <button type="button" className="btn-primary" onClick={handleNextStep}>Tiếp tục →</button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="checkout-section active">
                      <h2 className="section-title">Phương thức vận chuyển</h2>
                      <div className="shipping-options">
                        {Object.entries(SHIPPING_METHODS).map(([key, method]) => (
                          <label key={key} className={`option-card ${shippingMethod === key ? 'selected' : ''}`}>
                            <input type="radio" name="shipping" value={key} checked={shippingMethod === key} onChange={(e) => setShippingMethod(e.target.value)} />
                            <div className="option-content">
                              <div className="option-icon">{method.icon}</div>
                              <div className="option-info">
                                <div className="option-name">{method.name}</div>
                                <div className="option-desc">{method.time}</div>
                              </div>
                              <div className="option-price">
                                {totalPrice >= FREE_SHIPPING_THRESHOLD && key === 'standard' ? <span className="free-badge">Miễn phí</span> : `${method.price.toLocaleString()}₫`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {totalPrice < FREE_SHIPPING_THRESHOLD && (
                        <div className="shipping-notice">
                          <span className="notice-icon">💡</span>
                          <span>Mua thêm <strong>{(FREE_SHIPPING_THRESHOLD - totalPrice).toLocaleString()}₫</strong> để được miễn phí vận chuyển</span>
                        </div>
                      )}

                      <div className="step-actions">
                        <button type="button" className="btn-secondary" onClick={handlePrevStep}>← Quay lại</button>
                        <button type="button" className="btn-primary" onClick={handleNextStep}>Tiếp tục →</button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="checkout-section active">
                      <h2 className="section-title">Phương thức thanh toán</h2>

                      <div className="payment-options">
                        {PAYMENT_METHODS.map((method) => (
                          <label key={method.id} className={`option-card ${paymentMethod === method.id ? 'selected' : ''}`}>
                            <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => handlePaymentMethodChange(e.target.value)} />
                            <div className="option-content">
                              <div className="option-icon">{method.icon}</div>
                              <div className="option-info">
                                <div className="option-name">{method.name}</div>
                                <div className="option-desc">{method.desc}</div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="order-review">
                        <h3>Xác nhận đơn hàng</h3>
                        <div className="review-item"><span className="review-label">Người nhận:</span><span className="review-value">{formData.fullName}</span></div>
                        <div className="review-item"><span className="review-label">Số điện thoại:</span><span className="review-value">{formData.phone}</span></div>
                        <div className="review-item">
                          <span className="review-label">Địa chỉ:</span>
                          <span className="review-value">
                            {formData.address}, {formData.ward && `${formData.ward}, `}{formData.district && `${formData.district}, `}{formData.city}
                          </span>
                        </div>
                        <div className="review-item"><span className="review-label">Vận chuyển:</span><span className="review-value">{SHIPPING_METHODS[shippingMethod]?.name}</span></div>
                        <div className="review-item"><span className="review-label">Thanh toán:</span><span className="review-value">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}</span></div>
                      </div>

                      {qrData && PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requireQR && (
                        <div className="qr-payment-status">
                          {paymentConfirmed ? (
                            <div className="payment-confirmed-notice"><span className="confirmed-icon">✓</span><span>Đã xác nhận thanh toán</span></div>
                          ) : (
                            <div className="qr-reopen-section">
                              <div className="qr-pending-notice"><span className="pending-icon">⏳</span><span>Chưa xác nhận thanh toán</span></div>
                              <button type="button" className="btn-reopen-qr" onClick={() => setShowQRCode(true)}>Xem lại mã QR</button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="step-actions">
                        <button type="button" className="btn-secondary" onClick={handlePrevStep}>← Quay lại</button>
                        <button
                          type="submit"
                          className="btn-primary btn-place-order"
                          disabled={isSubmitting || (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requireQR && qrData && !paymentConfirmed)}
                        >
                          {isSubmitting ? 'Đang xử lý...' : (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requireQR ? (paymentConfirmed ? 'Hoàn tất đơn hàng' : 'Tiếp tục thanh toán') : 'Đặt hàng')}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="checkout-sidebar">
                <div className="order-summary">
                  <h3 className="summary-title">Đơn hàng của bạn</h3>

                  <div className="order-items">
                    {items.map((item, index) => (
                      <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="summary-item">
                        <div className="item-image-wrapper">
                          <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'} />
                          <span className="item-qty">{item.quantity}</span>
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          {(item.size || item.color) && (
                            <p className="item-variants">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Màu: ${item.color}`}
                            </p>
                          )}
                          <p className="item-price">{(item.price || 0).toLocaleString()}₫</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="promo-section">
                    {appliedPromo ? (
                      <div className="applied-promo">
                        <div className="promo-tag">
                          <span className="promo-icon">🎟️</span>
                          <div>
                            <div className="promo-code">{appliedPromo.code}</div>
                            <div className="promo-desc">{appliedPromo.description}</div>
                          </div>
                        </div>
                        <button type="button" className="btn-remove-promo" onClick={handleRemovePromo}>✕</button>
                      </div>
                    ) : (
                      <div className="promo-input-wrapper">
                        <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" className="promo-input" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())} />
                        <button type="button" onClick={handleApplyPromo} className="btn-apply-promo">Áp dụng</button>
                      </div>
                    )}
                  </div>

                  <div className="summary-totals">
                    <div className="total-row"><span>Tạm tính:</span><span>{totalPrice.toLocaleString()}₫</span></div>
                    {discount > 0 && (<div className="total-row discount"><span>Giảm giá:</span><span>-{discount.toLocaleString()}₫</span></div>)}
                    <div className="total-row"><span>Phí vận chuyển:</span><span>{shipping === 0 ? <span className="free-text">Miễn phí</span> : `${shipping.toLocaleString()}₫`}</span></div>
                    <div className="total-divider"></div>
                    <div className="total-row final"><span>Tổng cộng:</span><span className="final-price">{finalTotal.toLocaleString()}₫</span></div>
                  </div>

                  <div className="payment-secure"><span className="secure-icon">🔒</span><span>Thanh toán an toàn & bảo mật</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ QR Modal */}
        {showQRCode && qrData && (
          <div className="qr-modal-overlay" onClick={paymentMethod === 'momo' && paymentProgress ? null : handleCancelQR}>
            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
              <button className="qr-close-btn" onClick={handleCancelQR} disabled={paymentMethod === 'momo' && paymentProgress && paymentProgress.status !== 'failed'}>✕</button>
              <div className="qr-header">
                <h2>{paymentMethod === 'momo' ? 'Thanh toán MoMo' : 'Quét mã QR để thanh toán'}</h2>
                <p>{paymentMethod === 'momo' ? 'Quét mã QR bằng ứng dụng MoMo của bạn' : 'Vui lòng sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã'}</p>
              </div>

              <div className="qr-content">
                <div className="qr-code-wrapper">
                  <img src={qrData.qrCodeUrl} alt="QR Code" className="qr-code-image" />
                </div>

                <div className="payment-info">
                  <h3>Thông tin thanh toán</h3>
                  <div className="payment-detail-row"><span className="detail-label">Số tài khoản / SĐT:</span><span className="detail-value">{qrData.bankAccount || qrData.phoneNumber}</span></div>
                  <div className="payment-detail-row"><span className="detail-label">Ngân hàng:</span><span className="detail-value">{qrData.bankName || qrData.bankCode}</span></div>
                  <div className="payment-detail-row"><span className="detail-label">Chủ tài khoản:</span><span className="detail-value">{qrData.accountName}</span></div>
                  <div className="payment-detail-row"><span className="detail-label">Số tiền:</span><span className="detail-value amount">{qrData.amount.toLocaleString()}₫</span></div>
                  <div className="payment-detail-row"><span className="detail-label">Nội dung:</span><span className="detail-value">{qrData.note}</span></div>
                  {qrData.transactionId && (<div className="payment-detail-row"><span className="detail-label">Mã giao dịch:</span><span className="detail-value transaction-id">{qrData.transactionId}</span></div>)}
                </div>

                <div className="qr-notice"><span className="notice-icon">⚠️</span>
                  <p>Quét mã QR bằng app MoMo / ngân hàng. Sau khi chuyển tiền thành công, nhấn "Xác nhận đã thanh toán".</p>
                </div>

                <div className="qr-actions">
                  <button className="btn-secondary" onClick={handleCancelQR}>Hủy</button>
                  <button className="btn-primary" onClick={handleConfirmPayment} disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Address Picker Modal */}
        {showAddressPicker && (
          <div className="qr-modal-overlay" onClick={() => setShowAddressPicker(false)}>
            <div className="qr-modal address-picker-modal" onClick={(e) => e.stopPropagation()}>
              <button className="qr-close-btn" onClick={() => setShowAddressPicker(false)}>✕</button>
              <div className="qr-header">
                <h2>Chọn địa chỉ nhận hàng</h2>
                <p>Địa chỉ bạn chọn sẽ được điền vào thông tin giao hàng.</p>
              </div>

              <div className="address-picker-list">
                {addresses && addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`address-pick-item ${selectedAddress?.id === addr.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <div className="pick-main">
                        <div className="pick-name">{addr.recipientName}</div>
                        <div className="pick-phone">{addr.phoneNumber || addr.phone}</div>
                        <div className="pick-addr">
                          {(addr.detailedAddress || addr.address)}
                          {addr.country ? `, ${addr.country}` : ''}
                        </div>
                      </div>
                      {addr.isDefault && <span className="pick-default">Mặc định</span>}
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '12px 0' }}>Bạn chưa có địa chỉ nào</div>
                )}
              </div>

              <div className="qr-actions">
                <button className="btn-secondary" onClick={() => setShowAddressPicker(false)}>Hủy</button>
                <button
                  className="btn-primary"
                  onClick={() => { if (selectedAddress) applyAddressToForm(selectedAddress); setShowAddressPicker(false); }}
                >
                  Dùng địa chỉ này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
