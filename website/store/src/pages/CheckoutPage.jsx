// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components';
import { useCart, useAuth, useDataSync, useUserData } from '../contexts';
import { momoPaymentService } from '../services';
import { productService, orderService } from '../services/api';
import './CheckoutPage.css';

const getStoredProfile = () => {
  try {
    const raw = localStorage.getItem('anta_user_profile');
    if (!raw) return null;
    return JSON.parse(raw);
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
  const { profile: ctxProfile, addresses: ctxAddresses } = useUserData ? useUserData() : { profile: null, addresses: [] };

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

  // QR / Payment UI state
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(null);

  // waiting modal + pending ids for background check
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingRequestId, setPendingRequestId] = useState(null);

  // variant details / addresses
  const [variantDetails] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 999000;

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

  // --- helper: get userId same cách as processOrder ---
  const getUserId = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('anta_user_profile') || 'null') || {};
      return (user && (user.id ?? user.userId)) || storedUser.id || storedUser.userId || null;
    } catch {
      return null;
    }
  };

  // small utility: unwrap axios-like responses
  const unwrap = (resp) => (resp && resp.data) ? resp.data : resp;

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'fixed') return Math.min(appliedPromo.discount, totalPrice);
    if (appliedPromo.type === 'percent') return Math.floor((totalPrice * appliedPromo.discount) / 100);
    return 0;
  };
  const calculateShipping = () => {
    if (!items || items.length === 0) return 0;
    if (appliedPromo?.type === 'freeship' || totalPrice >= FREE_SHIPPING_THRESHOLD) return 0;
    return SHIPPING_METHODS[shippingMethod]?.price || 0;
  };

  const discount = calculateDiscount();
  const shipping = calculateShipping();
  const finalTotal = Math.max(0, totalPrice - discount + shipping);

  // --- load profile / addresses early ---
  useEffect(() => {
    try {
      const p = getStoredProfile();
      setFormData(prev => ({
        ...prev,
        fullName: (p?.fullName ?? ctxProfile?.fullName ?? prev.fullName) || '',
        email: (p?.email ?? ctxProfile?.email ?? user?.email) || prev.email,
        phone: (p?.phoneNumber ?? ctxProfile?.phone ?? prev.phone) || prev.phone
      }));

      let list = getStoredAddresses();
      if ((!list || list.length === 0) && ctxAddresses?.length) {
        list = ctxAddresses.map(normalizeAddr);
      }
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0] || null;
      if (def) {
        setSelectedAddress(def);
        const full = def.detailedAddress || def.address || '';
        setFormData(prev => ({ ...prev, address: full, fullName: def.recipientName || prev.fullName, phone: def.phoneNumber || prev.phone }));
      }
    } catch (e) {
      console.error('load profile/addresses error', e);
    }
  }, [user?.email, ctxProfile, ctxAddresses]);

  // --- validations ---
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
    if (newMethod === 'bank' || newMethod === 'vnpay') {
      alert('Phương thức đang bảo trì, vui lòng chọn phương thức khác.');
      return;
    }
    setPaymentMethod(newMethod);
    if (newMethod !== 'momo') {
      setShowQRCode(false);
      setQrData(null);
      setPaymentProgress(null);
    }
  };

  const saveOrderToLocalStorage = (orderData) => {
    try {
      const userOrdersKey = 'anta_user_orders';
      const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
      const orderRecord = {
        id: orderData.orderNumber || orderData.id || orderData.orderId,
        orderNumber: orderData.orderNumber || orderData.orderId || orderData.code || null,
        date: orderData.date || new Date().toISOString(),
        status: orderData.status || 'Đang xử lý',
        paymentMethod,
        total: orderData.total ?? orderData.amount ?? finalTotal,
        products: orderData.items || orderData.products || [],
      };
      userOrders.unshift(orderRecord);
      localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
      localStorage.setItem('latest_order', JSON.stringify(orderRecord));
      return true;
    } catch (e) { console.error('saveOrderToLocalStorage error', e); return false; }
  };

  // --- wait for order-service to report PAID (poll) ---
  const waitForOrderPaid = async (orderId, timeoutMs = 60000) => {
    if (!orderId) return false;
    const start = Date.now();
    const checkInterval = 2000;
    while (Date.now() - start < timeoutMs) {
      try {
        const oResp = await orderService.getOrder(orderId);
        const o = unwrap(oResp);
        const s = (o?.status || '').toString().toUpperCase();
        if (['PAID', 'COMPLETED', 'CONFIRMED'].includes(s)) {
          return true;
        }
      } catch (e) {
        // ignore and retry
      }
      // wait
      await new Promise(r => setTimeout(r, checkInterval));
    }
    return false;
  };

  // --- Create QR / start MoMo flow ---
  const generateQRCodeForPayment = async () => {
    setIsSubmitting(true);
    setPaymentProgress({ status: 'creating-order' });
    try {
      const orderNumber = `ANT${Date.now().toString().slice(-8)}`;
      const normalizedItems = items.map(it => ({
        productId: it.productId ?? it.product,
        variantId: it.variantId ?? null,
        quantity: Number(it.quantity ?? it.qty ?? 1),
        price: Number(it.price ?? 0)
      }));

      // include userId when creating order so backend saves user_id (important)
      const userId = getUserId();

      const orderPayload = {
        orderNumber,
        items: normalizedItems,
        total: Math.round(finalTotal),
        paymentMethod: 'MOMO',
        userId: userId ? Number(userId) : null, // << add userId here
        customer: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        }
      };

      const orderRespRaw = await orderService.createOrder(orderPayload);
      const orderResp = unwrap(orderRespRaw);
      const orderId = orderResp?.orderId ?? orderResp?.id ?? orderResp?.order_id ?? null;
      const serverTotal = orderResp?.total ?? orderResp?.amount ?? Math.round(finalTotal);

      if (!orderId) {
        throw new Error('Không nhận được orderId từ order-service');
      }

      saveOrderToLocalStorage(orderResp);
      setPaymentProgress({ status: 'creating-payment' });

      // ensure numeric amount
      let amountToSend = Number(serverTotal ?? Math.round(finalTotal));
      if (!amountToSend || Number.isNaN(amountToSend)) amountToSend = Math.round(finalTotal);

      const paymentReqPayload = {
        orderId,
        amount: amountToSend,
        userId: userId ?? undefined,
        orderNumber
      };

      const paymentResp = await momoPaymentService.createPaymentRequest(paymentReqPayload);

      if (!paymentResp || paymentResp.success === false) {
        console.error('createPaymentRequest failed', paymentResp);
        const backendMsg = (paymentResp && (paymentResp.error || paymentResp.raw)) || 'Unknown error';
        throw new Error(String(backendMsg));
      }

      const data = paymentResp.data || {};
      // if backend returned payUrl -> open tab and show waiting modal
      if (data.payUrl) {
        setQrData({ payUrl: data.payUrl, requestId: data.requestId || null, amount: amountToSend, orderId });
        setPendingOrderId(orderId);
        setPendingRequestId(data.requestId || null);
        setShowWaitingModal(true);
        // open payment in new tab
        window.open(data.payUrl, '_blank');
        setPaymentProgress({ status: 'waiting-payment', orderId });
        // start background check: wait for order-service to mark paid before navigate
        momoPaymentService.autoProcessPayment(data.requestId, orderId, (p) => setPaymentProgress(p), { timeout: 120000 })
          .then(async (r) => {
            // even if r.success, confirm by polling order-service
            const paid = await waitForOrderPaid(orderId, 60000);
            if (paid) {
              setPaymentConfirmed(true);
              clearCart();
              const oResp = unwrap(await orderService.getOrder(orderId));
              navigate('/order-success', { state: { orderData: oResp, paymentConfirmed: true } });
            } else {
              // not yet paid — keep waiting modal open and show message
              setPaymentProgress({ status: 'pending', message: 'Chờ hệ thống cập nhật trạng thái đơn' });
            }
          }).catch(err => {
            console.warn('autoProcessPayment error', err);
            setPaymentProgress({ status: 'pending', message: 'Chờ hệ thống cập nhật trạng thái đơn' });
          }).finally(() => setIsSubmitting(false));
        return;
      }

      // if backend returned only requestId -> show waiting and poll
      if (data.requestId) {
        setQrData({ payUrl: null, requestId: data.requestId, amount: amountToSend, orderId });
        setPendingOrderId(orderId);
        setPendingRequestId(data.requestId);
        setShowWaitingModal(true);
        // background poll then confirm order-service
        momoPaymentService.autoProcessPayment(data.requestId, orderId, (p) => setPaymentProgress(p), { timeout: 120000 })
          .then(async (r) => {
            const paid = await waitForOrderPaid(orderId, 60000);
            if (paid) {
              setPaymentConfirmed(true);
              clearCart();
              const oResp = unwrap(await orderService.getOrder(orderId));
              navigate('/order-success', { state: { orderData: oResp, paymentConfirmed: true } });
            } else {
              setPaymentProgress({ status: 'pending', message: 'Chờ cập nhật' });
            }
          }).catch(err => {
            console.warn('autoProcessPayment error', err);
            setPaymentProgress({ status: 'pending', message: 'Chờ cập nhật' });
          }).finally(() => setIsSubmitting(false));
        return;
      }

      throw new Error('Payment service không trả payUrl hay requestId');
    } catch (err) {
      console.error('generateQRCodeForPayment error', err);
      alert('Không thể khởi tạo thanh toán MoMo: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- When user manually clicks "Xác nhận đã thanh toán" in QR modal ---
  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      if (!qrData?.requestId && !pendingRequestId) {
        alert('Không có requestId để kiểm tra. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
        setIsSubmitting(false);
        return;
      }
      const rid = qrData?.requestId || pendingRequestId;
      const res = await momoPaymentService.getPaymentDetails(rid);
      const data = res?.data || {};
      const rawStatus = (data.status || data.result || data.paymentStatus || data.resultCode || '').toString().toUpperCase();
      const isSuccess = res?.success && (['SUCCESS', 'PAID', 'COMPLETED', '0'].includes(rawStatus) || (data.resultCode !== undefined && Number(data.resultCode) === 0));
      if (isSuccess) {
        // confirm with order-service
        const paid = await waitForOrderPaid(pendingOrderId, 60000);
        if (paid) {
          setPaymentConfirmed(true);
          clearCart();
          const oResp = unwrap(await orderService.getOrder(pendingOrderId));
          navigate('/order-success', { state: { orderData: oResp, paymentConfirmed: true } });
        } else {
          alert('Thanh toán đã được ghi nhận ở payment-service nhưng đơn hàng chưa được cập nhật. Vui lòng chờ hoặc liên hệ hỗ trợ.');
        }
      } else {
        alert('Thanh toán chưa xác thực. Vui lòng thử lại hoặc chờ hệ thống cập nhật.');
      }
    } catch (err) {
      console.warn('Manual MoMo payment check failed', err);
      alert('Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- create order for COD ---
  const createOrderForCOD = async () => {
    setIsSubmitting(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('anta_user_profile') || 'null') || {};
      const userId = (user && (user.id ?? user.userId)) || storedUser.id || null;

      const normalizedItems = items.map(it => ({
        productId: it.productId ?? it.product,
        variantId: it.variantId ?? null,
        quantity: Number(it.quantity ?? it.qty ?? 1),
        size: it.size ?? null,
        color: it.color ?? null,
      }));

      const shippingAddress = `${formData.address || ''}${formData.ward ? ', ' + formData.ward : ''}${formData.district ? ', ' + formData.district : ''}${formData.city ? ', ' + formData.city : ''}`;

      const payload = {
        userId: userId ? Number(userId) : null,
        items: normalizedItems,
        shippingAddress,
        paymentMethod: 'COD',
      };

      const respRaw = await orderService.createOrder(payload);
      const resp = unwrap(respRaw);
      saveOrderToLocalStorage(resp);
      clearCart();
      navigate('/order-success', { state: { orderData: resp } });
    } catch (err) {
      console.error('createOrderForCOD error', err);
      alert('Không thể tạo đơn COD. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- submit handler ---
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    // validate
    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      phone: validateField('phone', formData.phone),
      email: validateField('email', formData.email),
      address: validateField('address', formData.address),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      setCurrentStep(1);
      alert('Vui lòng kiểm tra lại thông tin giao hàng');
      return;
    }
    if (!items || items.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }

    // determine selected method (also handle DOM case where state lag)
    const domChecked = (document.querySelector('input[name="payment"]:checked') || {});
    const selectedMethodId = domChecked.value || paymentMethod;
    if (selectedMethodId === 'bank' || selectedMethodId === 'vnpay') {
      alert('Phương thức đang bảo trì, vui lòng chọn phương thức khác.');
      return;
    }

    // COD => create order and go to success immediately
    if (selectedMethodId === 'cod') {
      await createOrderForCOD();
      return;
    }

    // QR methods
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId);
    if (selectedMethod?.requireQR) {
      await generateQRCodeForPayment();
      return;
    }

    // fallback
    await createOrderForCOD();
  };

  // --- When user returns to this tab (focus or visibility change), check pending payment if any ---
  useEffect(() => {
    let mounted = true;
    const checkPending = async () => {
      try {
        if (!mounted) return;
        const rid = pendingRequestId;
        if (!rid) return;
        const res = await momoPaymentService.getPaymentStatus(rid);
        if (res && res.success && res.data) {
          const statusRaw = (res.data.status || res.data.result || res.data.resultCode || '').toString().toUpperCase();
          if (['SUCCESS', 'PAID', 'COMPLETED', '0'].includes(statusRaw) || (res.data.resultCode !== undefined && Number(res.data.resultCode) === 0)) {
            // confirm via order-service
            const paid = await waitForOrderPaid(pendingOrderId, 60000);
            if (paid) {
              try { if (pendingOrderId) await orderService.updatePayment(pendingOrderId, 'SUCCESS'); } catch (_) { /* ignore */ }
              clearCart();
              const oResp = unwrap(await orderService.getOrder(pendingOrderId));
              navigate('/order-success', { state: { orderData: oResp, paymentConfirmed: true } });
            } else {
              setPaymentProgress({ status: 'pending', raw: res.data });
            }
          }
        }
      } catch (err) {
        console.warn('checkPending error', err);
      }
    };

    const onFocus = () => {
      checkPending();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkPending(); });

    return () => { mounted = false; window.removeEventListener('focus', onFocus); };
  }, [pendingRequestId, pendingOrderId, navigate, clearCart]);

  // --- message listener (from momo-return page) ---
  useEffect(() => {
    const handler = async (e) => {
      try {
        if (e.origin !== window.location.origin) {
          // dev envs might differ - relax if needed
        }
      } catch (err) { /* ignore */ }
      const d = e.data || {};
      if (d && d.type === 'MOMO_REDIRECT') {
        const { orderId, requestId, resultCode } = d;
        setShowWaitingModal(false);
        setQrData(null);
        setPaymentProgress({ status: 'redirect_received', orderId, requestId, resultCode });

        const successValues = ['0', 0, 'SUCCESS', 'PAID', 'COMPLETED'];
        if (successValues.includes(resultCode)) {
          try {
            // wait for order-service to confirm
            const paid = await waitForOrderPaid(orderId ?? pendingOrderId, 60000);
            if (paid) {
              try { if (orderId) await orderService.updatePayment(orderId, 'SUCCESS'); } catch (_) {}
              const o = unwrap(await orderService.getOrder(orderId ?? pendingOrderId));
              clearCart();
              navigate('/order-success', { state: { orderData: o, paymentConfirmed: true } });
              return;
            } else {
              alert('Thanh toán thành công ở payment-service nhưng đơn hàng chưa cập nhật. Hệ thống sẽ tiếp tục kiểm tra. Nếu lâu bạn hãy liên hệ hỗ trợ.');
              setShowWaitingModal(true);
              setPendingOrderId(orderId ?? pendingOrderId);
              setPendingRequestId(requestId ?? pendingRequestId);
              setPaymentProgress({ status: 'waiting_for_order_update' });
              return;
            }
          } catch (err) {
            console.error('Failed to mark order paid after redirect', err);
            alert('Thanh toán có vẻ thành công nhưng hệ thống chưa cập nhật được. Vui lòng kiểm tra đơn hàng hoặc liên hệ hỗ trợ.');
            return;
          }
        } else {
          alert('Thanh toán không thành công (MoMo trả về). Vui lòng thử lại hoặc chọn cách thanh toán khác.');
        }
      }
    };

    window.addEventListener('message', handler);

    const storageHandler = (e) => {
      if (e.key === 'MOMO_REDIRECT_RESULT') {
        try {
          const d = JSON.parse(localStorage.getItem('MOMO_REDIRECT_RESULT'));
          window.postMessage(d, window.location.origin);
          localStorage.removeItem('MOMO_REDIRECT_RESULT');
        } catch { }
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [pendingOrderId, pendingRequestId, clearCart, navigate]);

  // UI helpers
  const validateStep1 = () => {
    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      phone: validateField('phone', formData.phone),
      email: validateField('email', formData.email),
      address: validateField('address', formData.address),
    };
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

  const handleCancelQR = useCallback(() => {
    setShowQRCode(false);
    // keep pendingRequestId so user can confirm later
  }, []);

  if (!items || items.length === 0) {
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

  // --- JSX (kept your original layout) ---
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

        {/* Waiting Modal */}
               {/* Waiting Modal */}
        {showWaitingModal && (
          <div className="qr-modal-overlay waiting-overlay" onClick={() => { /* prevent close */ }}>
            <div className="qr-modal waiting-modal" onClick={(e) => e.stopPropagation()}>
              <div className="waiting-inner">
                <div className="waiting-spinner" role="status" aria-label="Đang chờ thanh toán"></div>
                <h3 style={{ marginTop: 16 }}>Đang chờ thanh toán</h3>
                <p style={{ marginTop: 8, color: '#666' }}>Vui lòng hoàn tất thanh toán trong trang đã mở. Sau khi hoàn tất, quay lại tab này để hệ thống xác nhận đơn.</p>

                <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={() => { if (qrData?.payUrl) window.open(qrData.payUrl, '_blank'); }}>Mở lại trang thanh toán</button>
                  <button className="btn-link" onClick={() => { setShowWaitingModal(false); setShowQRCode(true); }}>Đã thanh toán? Kiểm tra</button>
                </div>

                <div style={{ marginTop: 14, fontSize: 13, color: '#888' }}>
                  <div>Mã đơn: <strong style={{ color: '#222' }}>{pendingOrderId}</strong></div>
                  <div style={{ marginTop: 6 }}>Trạng thái: <strong style={{ color: '#222' }}>{paymentProgress?.status || 'Chờ thanh toán'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}


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
                              <div className="sel-addr">{(selectedAddress.detailedAddress || selectedAddress.address)}{selectedAddress.country ? `, ${selectedAddress.country}` : ''}</div>
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
                          <textarea id="note" name="note" value={formData.note} onChange={handleInputChange} placeholder="Ghi chú về đơn hàng..." rows="3" maxLength="500" />
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
                          <span className="review-value">{formData.address}{formData.ward ? `, ${formData.ward}` : ''}{formData.district ? `, ${formData.district}` : ''}{formData.city ? `, ${formData.city}` : ''}</span>
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
                        <button type="submit" className="btn-primary btn-place-order" disabled={isSubmitting}>
                          {isSubmitting ? 'Đang xử lý...' : (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requireQR ? 'Tiếp tục thanh toán' : 'Đặt hàng')}
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
                    {items.map((item, index) => {
                      const vid = item.variantId ?? null;
                      const vinfo = vid ? variantDetails[Number(vid)] : null;
                      const displaySize = item.size || (vinfo && vinfo.size) || null;
                      const displayColor = item.color || (vinfo && vinfo.color) || null;
                      return (
                        <div key={`${item.id}-${index}`} className="summary-item">
                          <div className="item-image-wrapper">
                            <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'} />
                            <span className="item-qty">{item.quantity}</span>
                          </div>
                          <div className="item-details">
                            <h4>{item.name}</h4>
                            {(displaySize || displayColor) ? (
                              <p className="item-variants">{displaySize && `Size: ${displaySize}`}{displaySize && displayColor && ' | '}{displayColor && `Màu: ${displayColor}`}</p>
                            ) : (<p className="item-variants muted">Không có chọn lựa biến thể</p>)}
                            <p className="item-price">{(item.price || 0).toLocaleString()}₫</p>
                          </div>
                        </div>
                      );
                    })}
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

        {/* QR Modal */}
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
                  <img src={qrData.qrCodeUrl || qrData.payUrl || ''} alt="QR Code" className="qr-code-image" />
                </div>

                <div className="payment-info">
                  <h3>Thông tin thanh toán</h3>
                  <div className="payment-detail-row"><span className="detail-label">Số tiền:</span><span className="detail-value amount">{(qrData.amount || 0).toLocaleString()}₫</span></div>
                  <div className="payment-detail-row"><span className="detail-label">Nội dung:</span><span className="detail-value">{qrData.note || ''}</span></div>
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

        {/* Address Picker Modal */}
        {showAddressPicker && (
          <div className="qr-modal-overlay" onClick={() => setShowAddressPicker(false)}>
            <div className="qr-modal address-picker-modal" onClick={(e) => e.stopPropagation()}>
              <button className="qr-close-btn" onClick={() => setShowAddressPicker(false)}>✕</button>
              <div className="qr-header"><h2>Chọn địa chỉ nhận hàng</h2><p>Địa chỉ bạn chọn sẽ được điền vào thông tin giao hàng.</p></div>
              <div className="address-picker-list">
                {addresses && addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <div key={addr.id} className={`address-pick-item ${selectedAddress?.id === addr.id ? 'is-selected' : ''}`} onClick={() => setSelectedAddress(addr)}>
                      <div className="pick-main">
                        <div className="pick-name">{addr.recipientName}</div>
                        <div className="pick-phone">{addr.phoneNumber || addr.phone}</div>
                        <div className="pick-addr">{(addr.detailedAddress || addr.address)}{addr.country ? `, ${addr.country}` : ''}</div>
                      </div>
                      {addr.isDefault && <span className="pick-default">Mặc định</span>}
                    </div>
                  ))
                ) : (<div className="empty-state" style={{ padding: '12px 0' }}>Bạn chưa có địa chỉ nào</div>)}
              </div>
              <div className="qr-actions">
                <button className="btn-secondary" onClick={() => setShowAddressPicker(false)}>Hủy</button>
                <button className="btn-primary" onClick={() => { if (selectedAddress) { setFormData(prev => ({ ...prev, address: selectedAddress.detailedAddress || selectedAddress.address || prev.address, fullName: selectedAddress.recipientName || prev.fullName, phone: selectedAddress.phoneNumber || prev.phone })); } setShowAddressPicker(false); }}>Dùng địa chỉ này</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
