// src/services/admin/productService.js
import { productApi } from '../api';

const USE_REAL_PRODUCT_API =
  Boolean(import.meta.env.VITE_API_URL) ||
  Boolean(import.meta.env.VITE_PRODUCT_SERVICE_URL);

const productBase = '/api/product';
const CLOUD_BASE_FALLBACK =
  import.meta.env.VITE_CLOUD_API_URL ||
  import.meta.env.VITE_CLOUD_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

const mockProducts = window.__ANTA_ADMIN_MOCK_PRODUCTS || [];

/** Helpers **/
const extractUrl = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return item.url || item.fileUrl || item.path || item.location || item.fullUrl || item.publicUrl || item.src || null;
  }
  return null;
};

const normalizeUrl = (src) => {
  if (!src) return null;
  if (typeof src !== 'string') return null;
  const t = src.trim();
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) return t;
  if (t.startsWith('/')) return CLOUD_BASE_FALLBACK.replace(/\/$/, '') + t;
  return CLOUD_BASE_FALLBACK.replace(/\/$/, '') + '/' + t.replace(/^\//, '');
};

const parsePriceValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return Number(val) || 0;
  let s = String(val).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, '');
  if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    const dotCount = (s.match(/\./g) || []).length;
    const commaCount = (s.match(/,/g) || []).length;
    if (dotCount > 1 && commaCount === 0) s = s.replace(/\./g, '');
    else if (commaCount > 0 && dotCount === 0) s = s.replace(',', '.');
    else {
      const parts = s.split('.');
      if (parts.length === 2 && parts[1].length === 3) s = parts.join('');
    }
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const parseIntSafe = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

/**
 * Normalize one product object from backend into stable shape:
 * {
 *  id, name, brand, description,
 *  images: [url..], thumbnail,
 *  price: numericComputed,
 *  category, createdAt, totalStock, rating, sales,
 *  variants: [{id, sku, price, stock, size, color, attributes}, ...]
 * }
 */
const normalizeFromBackend = (p = {}) => {
  // images parsing (array/string/object)
  let imagesArr = [];
  if (Array.isArray(p.images)) imagesArr = p.images;
  else if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images);
      imagesArr = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      imagesArr = p.images ? [p.images] : [];
    }
  } else if (p.image) imagesArr = [p.image];

  const safeImages = imagesArr
    .map(extractUrl)
    .map(normalizeUrl)
    .filter(Boolean);

  // thumbnail candidate
  let thumbCandidate = null;
  if (typeof p.thumbnail === 'string') thumbCandidate = p.thumbnail;
  else if (p.thumbnail && typeof p.thumbnail === 'object') thumbCandidate = extractUrl(p.thumbnail);
  const thumbnail = normalizeUrl(thumbCandidate) || (safeImages.length ? safeImages[0] : null);

  // variants normalization
  let variants = Array.isArray(p.variants) ? p.variants : [];
  variants = variants.map((v) => {
    const priceNum = parsePriceValue(v?.price);
    const stockNum = v?.stock !== undefined && v?.stock !== null ? parseIntSafe(v.stock) : (v?.quantity !== undefined && v?.quantity !== null ? parseIntSafe(v.quantity) : 0);
    return {
      id: v?.id ?? null,
      sku: v?.sku ?? v?.SKU ?? null,
      price: priceNum,
      stock: stockNum,
      size: v?.size ?? null,
      color: v?.color ?? null,
      attributes: v?.attributes ?? null,
      raw: v // keep raw for debugging if needed
    };
  });

  // compute display price: prefer product.price >0, otherwise min variant price >0
  const pPrice = parsePriceValue(p.price);
  let computedPrice = 0;
  if (pPrice > 0) computedPrice = pPrice;
  else {
    const vPrices = variants.map(v => v.price).filter(x => x > 0);
    computedPrice = vPrices.length ? Math.min(...vPrices) : 0;
  }

  // compute totalStock: prefer product.totalStock if provided, otherwise sum(variants.stock)
  const totalStock = (p.totalStock !== undefined && p.totalStock !== null)
    ? parseIntSafe(p.totalStock)
    : (Array.isArray(variants) && variants.length ? variants.reduce((s, v) => s + (Number(v.stock || 0)), 0) : (p.quantity ?? p.stock ?? 0));

  return {
    id: p.id,
    name: p.name,
    brand: p.brand || '',
    description: p.description || '',
    images: safeImages,
    thumbnail: thumbnail || '',
    price: computedPrice,
    category: p.category || (p.categories && p.categories[0]) || '',
    createdAt: p.createdAt,
    totalStock: totalStock ?? 0,
    rating: p.rating ?? 5,
    sales: p.sales ?? 0,
    variants: variants
  };
};

/** Service export **/
export const adminProductService = {
  
  getProducts: async (filters = {}) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${productBase}/all`, { params: filters });
        const data = res.data;
        let list = [];
        // handle multiple possible shapes
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.items)) list = data.items;
        else if (data && Array.isArray(data.products)) list = data.products;
        else if (data && typeof data === 'object' && Object.keys(data).length && Array.isArray(data)) list = data; // fallback

        const normalized = list.map(normalizeFromBackend);
        return { success: true, data: normalized };
      } catch (err) {
        const errorMsg = err?.response?.data || err?.message || 'API error';
        console.warn('[productService] getProducts failed', errorMsg);
        return { success: false, error: errorMsg, status: err?.response?.status };
      }
    }

    // mock fallback
    await new Promise(r => setTimeout(r, 200));
    return { success: true, data: mockProducts.map(normalizeFromBackend) };
  },

  getProduct: async (id) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${productBase}/${id}`);
        const normalized = normalizeFromBackend(res.data);
        return { success: true, data: normalized };
      } catch (err) {
        console.error('[productService] getProduct failed', err?.response || err);
        return { success: false, error: err?.message || 'API error' };
      }
    }

    const p = mockProducts.find(x => String(x.id) === String(id));
    return p ? { success: true, data: normalizeFromBackend(p) } : { success: false, error: 'Không tìm thấy sản phẩm' };
  },
  syncProductImages: async (productId) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.put(`${productBase}/sync-images/${productId}`);
        return { success: true, data: normalizeFromBackend(res.data) };
      } catch (err) {
        console.warn('[productService] syncProductImages failed', err?.response || err);
        return { success: false, error: err?.message || 'API error' };
      }
    }
    return { success: false, error: 'Not supported in mock' };
  },

  createProduct: async (productData) => {
    const payload = {
      name: productData.name,
      brand: productData.brand || null,
      description: productData.description || '',
      price: productData.price ?? 0,
      categories: productData.category ? [productData.category] : (productData.categories || []),
      category: productData.category || undefined,
    //  images: productData.images || (productData.image ? [productData.image] : []),
      variants: Array.isArray(productData.variants) ? productData.variants.map(v => ({
        sku: v.sku,
        price: v.price ?? 0,
        stock: v.quantity ?? v.stock ?? 0,
        size: v.size ?? null,
        color: v.color ?? null,
        attributes: v.attributes ?? null
      })) : undefined,
      totalStock: productData.totalStock ?? productData.quantity ?? undefined
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.post(`${productBase}/add`, payload);
        return { success: true, data: normalizeFromBackend(res.data), message: 'Thêm sản phẩm thành công' };
      } catch (err) {
        console.error('[productService] createProduct failed', err?.response || err);
        const status = err?.response?.status;
        const data = err?.response?.data;
        const msg = data?.message || data?.error || err?.message || 'Lỗi khi gọi API';
        return { success: false, error: msg, status, details: data };
      }
    }

    // mock fallback
    await new Promise(r => setTimeout(r, 200));
    try {
      const newId = mockProducts.length ? Math.max(...mockProducts.map(p => p.id)) + 1 : 1;
      const variants = payload.variants || [];
      const totalQuantity = variants.length ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : (Number(payload.totalStock) || 0);
      const price = variants.length ? Math.min(...variants.map(v => Number(v.price) || Infinity)) : Number(payload.price) || 0;
      const newProduct = {
        id: newId,
        name: payload.name,
        brand: payload.brand || '',
        description: payload.description || '',
        images: payload.images || [],
        thumbnail: (payload.images && payload.images[0]) || '',
        price,
        quantity: totalQuantity,
        category: payload.category || '',
        variants: variants.map((v, i) => ({ id: `${newId}-${i + 1}`, ...v })),
        createdAt: new Date().toISOString()
      };
      mockProducts.unshift(newProduct);
      try { localStorage.setItem('anta_admin_products_v2', JSON.stringify(mockProducts)); } catch (e) {}
      return { success: true, data: normalizeFromBackend(newProduct), message: 'Thêm sản phẩm thành công (mock)' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  updateProduct: async (id, productData) => {
    const payload = {
      name: productData.name,
      brand: productData.brand || null,
      description: productData.description || '',
      price: productData.price ?? 0,
      categories: productData.category ? [productData.category] : (productData.categories || []),
     // images: productData.images || (productData.image ? [productData.image] : []),
      variants: productData.variants || [],
      totalStock: productData.totalStock ?? productData.quantity ?? undefined
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.put(`${productBase}/update/${id}`, payload);
        return { success: true, data: normalizeFromBackend(res.data), message: 'Cập nhật thành công' };
      } catch (err) {
        console.error('[productService] updateProduct failed', err?.response || err);
        return { success: false, error: err?.message || 'Lỗi khi gọi API' };
      }
    }

    // mock fallback update
    await new Promise(r => setTimeout(r, 200));
    const idx = mockProducts.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: 'Không tìm thấy sản phẩm' };
    const merged = { ...mockProducts[idx], ...productData };
    if (Array.isArray(productData.variants)) {
      merged.variants = productData.variants.map((v, i) => ({ id: v.id || `${merged.id}-${i + 1}`, ...v }));
      merged.quantity = merged.variants.reduce((s, v) => s + (Number(v.quantity || v.stock) || 0), 0);
    } else {
      merged.quantity = Number(productData.quantity ?? merged.quantity ?? 0);
    }
    mockProducts[idx] = merged;
    try { localStorage.setItem('anta_admin_products_v2', JSON.stringify(mockProducts)); } catch (e) {}
    return { success: true, data: normalizeFromBackend(merged), message: 'Cập nhật thành công (mock)' };
  },

  deleteProduct: async (id) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.delete(`${productBase}/delete/${id}`);
        return { success: true, data: res.data, message: 'Xóa thành công' };
      } catch (err) {
        console.warn('[productService] deleteProduct fail', err?.message);
        return { success: false, error: err?.message || 'Lỗi khi gọi API' };
      }
    }

    const idx = mockProducts.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: 'Không tìm thấy sản phẩm' };
    mockProducts.splice(idx, 1);
    try { localStorage.setItem('anta_admin_products_v2', JSON.stringify(mockProducts)); } catch (e) {}
    return { success: true, message: 'Xóa thành công (mock)' };
  }
  
};

export default adminProductService;
