// src/services/admin/productService.js
import { productApi } from '../api';

const USE_REAL_PRODUCT_API = !!import.meta.env.VITE_PRODUCT_SERVICE_URL;
const productBase = '/api/product'; // backend routes e.g. /api/product/add

// Mock fallback (simple)
const ADMIN_PRODUCTS_KEY = 'anta_admin_products_v2';
let mockProducts = [];
try {
  const stored = localStorage.getItem(ADMIN_PRODUCTS_KEY);
  mockProducts = stored ? JSON.parse(stored) : [];
} catch (e) {
  mockProducts = [];
}
const saveMock = () => localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(mockProducts));

const normalizeFromBackend = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand || '',
  description: p.description || '',
  images: p.images || (p.image ? [p.image] : []),
  thumbnail: p.thumbnail || (p.images && p.images[0]) || '',
  price: Number(p.price || 0),
  quantity: p.totalStock ?? p.quantity ?? 0,
  category: p.category || (p.categories && p.categories[0]) || '',
  rating: p.rating ?? 5,
  status: p.status || ((p.totalStock && p.totalStock <= 5) ? 'low-stock' : 'active'),
  sales: p.sales ?? 0,
  variants: Array.isArray(p.variants) ? p.variants : []
});

export const adminProductService = {
  getProducts: async (filters = {}) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${productBase}/all`, { params: filters });
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.items || data.data || []);
        return { success: true, data: list.map(normalizeFromBackend) };
      } catch (e) {
        console.warn('[productService] real API failed, use mock', e?.message);
      }
    }

    // mock fallback
    await new Promise(r => setTimeout(r, 300));
    return { success: true, data: mockProducts };
  },

  getProduct: async (id) => {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${productBase}/${id}`);
        return { success: true, data: normalizeFromBackend(res.data) };
      } catch (e) {
        console.warn('[productService] getProduct failed', e?.message);
      }
    }

    const p = mockProducts.find(x => String(x.id) === String(id));
    return p ? { success: true, data: p } : { success: false, error: 'Không tìm thấy sản phẩm' };
  },

  createProduct: async (productData) => {
    // prepare payload expected by BE: include brand, images[], variants[], totalStock
    const payload = {
      name: productData.name,
      brand: productData.brand || null,
      description: productData.description || '',
      price: productData.price ?? 0,
      categories: productData.category ? [productData.category] : (productData.categories || []),
      category: productData.category || undefined,
      images: productData.images || (productData.image ? [productData.image] : []),
      variants: Array.isArray(productData.variants) ? productData.variants.map(v => ({
        sku: v.sku,
        price: v.price ?? 0,
        stock: v.quantity ?? v.stock ?? 0,
        size: v.size ?? null,
        color: v.color ?? null,
        attributes: v.attributes ?? null // attributes should be object or null
      })) : undefined,
      totalStock: productData.quantity ?? undefined
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.post(`${productBase}/add`, payload);
        return { success: true, data: normalizeFromBackend(res.data), message: 'Thêm sản phẩm thành công' };
      } catch (err) {
        console.warn('[productService] createProduct failed', err?.message);
        return { success: false, error: err?.message || 'Lỗi khi gọi API' };
      }
    }

    // mock create
    await new Promise(r => setTimeout(r, 300));
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
        variants: variants.map((v, i) => ({ id: `${newId}-${i+1}`, ...v })),
        createdAt: new Date().toISOString()
      };
      mockProducts.unshift(newProduct);
      saveMock();
      return { success: true, data: newProduct, message: 'Thêm sản phẩm thành công (mock)' };
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
      images: productData.images || (productData.image ? [productData.image] : []),
      variants: productData.variants || [],
      totalStock: productData.quantity ?? undefined
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.put(`${productBase}/update/${id}`, payload);
        return { success: true, data: normalizeFromBackend(res.data), message: 'Cập nhật thành công' };
      } catch (err) {
        console.warn('[productService] updateProduct failed', err?.message);
        return { success: false, error: err?.message || 'Lỗi khi gọi API' };
      }
    }

    // mock update
    await new Promise(r => setTimeout(r, 300));
    const idx = mockProducts.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: 'Không tìm thấy sản phẩm' };
    const merged = { ...mockProducts[idx], ...productData };
    if (Array.isArray(productData.variants)) {
      merged.variants = productData.variants.map((v, i) => ({ id: v.id || `${merged.id}-${i+1}`, ...v }));
      merged.quantity = merged.variants.reduce((s, v) => s + (Number(v.quantity || v.stock) || 0), 0);
    } else {
      merged.quantity = Number(productData.quantity ?? merged.quantity ?? 0);
    }
    mockProducts[idx] = merged;
    saveMock();
    return { success: true, data: merged, message: 'Cập nhật thành công (mock)' };
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
    saveMock();
    return { success: true, message: 'Xóa thành công (mock)' };
  }
};

export default adminProductService;
