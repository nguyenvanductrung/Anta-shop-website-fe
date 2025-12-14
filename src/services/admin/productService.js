// src/services/admin/productService.js
import { productApi } from "../api";

/**
 * Admin Product Service (merged - clean)
 * - Gửi categoryId đúng chuẩn cho BE
 * - Chuẩn hóa dữ liệu trả về
 * - Có mock fallback khi không cấu hình API thật
 */

const USE_REAL_PRODUCT_API = Boolean(
  import.meta.env.VITE_PRODUCT_SERVICE_URL || import.meta.env.VITE_API_URL
);

const PRODUCT_BASE = "/api/product";

const CLOUD_BASE_FALLBACK =
  import.meta.env.VITE_CLOUD_API_URL ||
  import.meta.env.VITE_CLOUD_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

const mockProducts = window.__ANTA_ADMIN_MOCK_PRODUCTS || [];

/* ---------------- Helpers ---------------- */
const extractUrl = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return (
      item.url ||
      item.fileUrl ||
      item.path ||
      item.location ||
      item.fullUrl ||
      item.publicUrl ||
      item.src ||
      null
    );
  }
  return null;
};

const normalizeUrl = (src) => {
  if (!src || typeof src !== "string") return null;
  const t = src.trim();
  if (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("data:")
  )
    return t;
  if (t.startsWith("/")) return CLOUD_BASE_FALLBACK.replace(/\/$/, "") + t;
  return (
    CLOUD_BASE_FALLBACK.replace(/\/$/, "") + "/" + t.replace(/^\//, "")
  );
};

const parsePriceValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return Number(val) || 0;

  let s = String(val).trim();
  if (!s) return 0;

  s = s.replace(/[^\d.,-]/g, "");

  if (s.indexOf(".") !== -1 && s.indexOf(",") !== -1) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (s.match(/\./g) || []).length;
    const commaCount = (s.match(/,/g) || []).length;

    if (dotCount > 1 && commaCount === 0) s = s.replace(/\./g, "");
    else if (commaCount > 0 && dotCount === 0) s = s.replace(",", ".");
    else {
      const parts = s.split(".");
      if (parts.length === 2 && parts[1].length === 3) s = parts.join("");
    }
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const parseIntSafe = (v) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

const normalizeFromBackend = (p = {}) => {
  // images
  let imagesArr = [];
  if (Array.isArray(p.images)) imagesArr = p.images;
  else if (typeof p.images === "string") {
    try {
      const parsed = JSON.parse(p.images);
      imagesArr = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      imagesArr = p.images ? [p.images] : [];
    }
  } else if (p.image) imagesArr = [p.image];

  const safeImages = imagesArr
    .map(extractUrl)
    .map(normalizeUrl)
    .filter(Boolean);

  // thumbnail
  let thumbCandidate = null;
  if (typeof p.thumbnail === "string") thumbCandidate = p.thumbnail;
  else if (p.thumbnail && typeof p.thumbnail === "object")
    thumbCandidate = extractUrl(p.thumbnail);

  const thumbnail =
    normalizeUrl(thumbCandidate) || (safeImages.length ? safeImages[0] : null);

  // variants
  let variants = Array.isArray(p.variants) ? p.variants : [];
  variants = variants.map((v) => {
    const priceNum = parsePriceValue(v?.price);
    const stockNum =
      v?.stock !== undefined && v?.stock !== null
        ? parseIntSafe(v.stock)
        : v?.quantity !== undefined && v?.quantity !== null
        ? parseIntSafe(v.quantity)
        : 0;

    return {
      id: v?.id ?? null,
      sku: v?.sku ?? v?.SKU ?? null,
      price: priceNum,
      stock: stockNum,
      size: v?.size ?? null,
      color: v?.color ?? null,
      attributes: v?.attributes ?? null,
      raw: v,
    };
  });

  const pPrice = parsePriceValue(p.price);
  const vPrices = variants.map((v) => v.price).filter((x) => x > 0);
  const computedPrice = pPrice > 0 ? pPrice : vPrices.length ? Math.min(...vPrices) : 0;

  const totalStock =
    p.totalStock !== undefined && p.totalStock !== null
      ? parseIntSafe(p.totalStock)
      : variants.length
      ? variants.reduce((s, v) => s + Number(v.stock || 0), 0)
      : p.quantity ?? p.stock ?? 0;

  return {
    id: p.id,
    name: p.name,
    brand: p.brand || "",
    description: p.description || "",
    images: safeImages,
    thumbnail: thumbnail || "",
    price: computedPrice,
    categoryId: p.categoryId ?? null,                 // chỉ là ID (đúng theo BE)
    categoryName: p.categoryName || p.category || "", // nếu BE/FE có tên
    createdAt: p.createdAt,
    totalStock: totalStock ?? 0,
    rating: p.rating ?? 5,
    sales: p.sales ?? 0,
    variants,
    raw: p,
  };
};

/* ---------------- API ---------------- */
export const adminProductService = {
  async getProducts(filters = {}) {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${PRODUCT_BASE}/all`, { params: filters });
        const data = res.data;
        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.products)
            ? data.products
            : [];
        return { success: true, data: list.map(normalizeFromBackend) };
      } catch (err) {
        return { success: false, error: err?.response?.data || err.message };
      }
    }

    // mock
    await new Promise((r) => setTimeout(r, 150));
    return { success: true, data: mockProducts.map(normalizeFromBackend) };
  },

  async getProduct(id) {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.get(`${PRODUCT_BASE}/${id}`);
        return { success: true, data: normalizeFromBackend(res.data) };
      } catch (err) {
        return { success: false, error: err?.message || "API error" };
      }
    }

    const p = mockProducts.find((x) => String(x.id) === String(id));
    return p
      ? { success: true, data: normalizeFromBackend(p) }
      : { success: false, error: "Không tìm thấy sản phẩm" };
  },

  async syncProductImages(productId) {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.put(`${PRODUCT_BASE}/sync-images/${productId}`);
        return { success: true, data: normalizeFromBackend(res.data) };
      } catch (err) {
        return {
          success: false,
          error:
            err?.response?.data ||
            err?.message ||
            "syncProductImages API error",
        };
      }
    }

    // mock fallback
    return this.getProduct(productId);
  },

  async createProduct(productData) {
    // Payload cho BE: phải có categoryId nếu chọn
    const payload = {
      name: productData.name,
      brand: productData.brand || null,
      description: productData.description || "",
      price: productData.price ?? 0,
      categoryId:
        productData.categoryId ??
        productData.category?.id ??
        productData.categoryIdFromForm ??
        null,
      variants: Array.isArray(productData.variants)
        ? productData.variants.map((v) => ({
            sku: v.sku,
            price: v.price ?? 0,
            stock: v.quantity ?? v.stock ?? 0,
            size: v.size ?? null,
            color: v.color ?? null,
            attributes: v.attributes ?? null,
          }))
        : undefined,
      totalStock: productData.totalStock ?? productData.quantity ?? undefined,
      // NOTE: images/imageIds (nếu có) phải được flow upload cloud xử lý ở nơi khác
      // và BE hiện đang nhận imageIds trong ProductRequest (nếu FE có gửi).
      // File gốc không gửi imageIds ở đây, nên giữ nguyên.
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.post(`${PRODUCT_BASE}/add`, payload);
        return {
          success: true,
          data: normalizeFromBackend(res.data),
          message: "Thêm sản phẩm thành công",
        };
      } catch (err) {
        return { success: false, error: err?.response?.data || err.message };
      }
    }

    // mock
    await new Promise((r) => setTimeout(r, 200));
    const newId = mockProducts.length
      ? Math.max(...mockProducts.map((p) => p.id)) + 1
      : 1;

    const variants = payload.variants || [];
    const totalQuantity = variants.length
      ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : Number(payload.totalStock) || 0;

    const price = variants.length
      ? Math.min(...variants.map((v) => Number(v.price) || Infinity))
      : Number(payload.price) || 0;

    const newProduct = {
      id: newId,
      name: payload.name,
      brand: payload.brand || "",
      description: payload.description || "",
      images: payload.images || [],
      thumbnail: (payload.images && payload.images[0]) || "",
      price,
      quantity: totalQuantity,
      categoryId: payload.categoryId || null,
      variants: variants.map((v, i) => ({ id: `${newId}-${i + 1}`, ...v })),
      createdAt: new Date().toISOString(),
    };

    mockProducts.unshift(newProduct);
    try {
      localStorage.setItem("anta_admin_products_v2", JSON.stringify(mockProducts));
    } catch {}

    return {
      success: true,
      data: normalizeFromBackend(newProduct),
      message: "Thêm sản phẩm thành công (mock)",
    };
  },

  async updateProduct(id, productData) {
    const payload = {
      name: productData.name,
      brand: productData.brand || null,
      description: productData.description || "",
      price: productData.price ?? 0,
      categoryId:
        productData.categoryId ??
        productData.category?.id ??
        productData.categoryIdFromForm ??
        undefined,
      variants: Array.isArray(productData.variants)
        ? productData.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            price: v.price ?? 0,
            stock: v.quantity ?? v.stock ?? 0,
            size: v.size ?? null,
            color: v.color ?? null,
            attributes: v.attributes ?? null,
          }))
        : undefined,
      totalStock: productData.totalStock ?? productData.quantity ?? undefined,
    };

    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.put(`${PRODUCT_BASE}/update/${id}`, payload);
        return {
          success: true,
          data: normalizeFromBackend(res.data),
          message: "Cập nhật thành công",
        };
      } catch (err) {
        return { success: false, error: err?.response?.data || err.message };
      }
    }

    // mock
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockProducts.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: "Không tìm thấy sản phẩm" };

    const merged = { ...mockProducts[idx] };
    merged.name = payload.name;
    merged.brand = payload.brand || "";
    merged.description = payload.description || "";
    merged.categoryId = payload.categoryId ?? merged.categoryId ?? null;

    if (Array.isArray(payload.variants)) {
      merged.variants = payload.variants.map((v, i) => ({
        id: v.id || `${merged.id}-${i + 1}`,
        ...v,
      }));
      merged.quantity = merged.variants.reduce(
        (s, v) => s + (Number(v.quantity || v.stock) || 0),
        0
      );
    } else {
      merged.quantity = Number(payload.totalStock ?? merged.quantity ?? 0);
    }

    mockProducts[idx] = merged;
    try {
      localStorage.setItem("anta_admin_products_v2", JSON.stringify(mockProducts));
    } catch {}

    return {
      success: true,
      data: normalizeFromBackend(merged),
      message: "Cập nhật thành công (mock)",
    };
  },

  async deleteProduct(id) {
    if (USE_REAL_PRODUCT_API) {
      try {
        const res = await productApi.delete(`${PRODUCT_BASE}/delete/${id}`);
        return { success: true, data: res.data, message: "Xóa thành công" };
      } catch (err) {
        return { success: false, error: err?.response?.data || err.message };
      }
    }

    const idx = mockProducts.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: "Không tìm thấy sản phẩm" };

    mockProducts.splice(idx, 1);
    try {
      localStorage.setItem("anta_admin_products_v2", JSON.stringify(mockProducts));
    } catch {}

    return { success: true, message: "Xóa thành công (mock)" };
  },
};

export default adminProductService;
