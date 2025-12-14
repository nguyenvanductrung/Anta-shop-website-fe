// src/components/AdminAddProduct.jsx
import React, { useState, useEffect, useRef } from "react";
import cloudApi, { uploadMultipleToCloud } from "../services/cloud";
import adminProductService from "../services/admin/productService";

import GlobalLoader from "./GlobalLoader";
import "./AdminAddProduct.css";
import {
  listCategories,
  createCategory as apiCreateCategory,
} from "../services/categories";
import { slugify } from "../utils/slugify";

const CANON_TITLES = [
  { key: "men", label: "Nam" },
  { key: "women", label: "Nữ" },
  { key: "accessories", label: "Phụ kiện" },
  { key: "kids", label: "Kids" },
];

const toUpper = (s) => (s || "").toUpperCase();
const toCap = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

export default function AdminAddProduct({
  editingProduct = null,
  onSaved = () => {},
  onCancel = () => {},
}) {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    totalStock: "",
    category: null, // object {id,name,slug,title}
    images: [],
    thumbnail: "",
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalLoadingText, setGlobalLoadingText] = useState(null);
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]); // [{id,name,slug,title}]
  const [titleFilter, setTitleFilter] = useState("men");
  const [newCategory, setNewCategory] = useState("");

  // ---------- LOAD CATEGORIES ----------
  useEffect(() => {
    (async () => {
      try {
        const page = await listCategories({ page: 0, size: 500 });
        setCategories(Array.isArray(page?.content) ? page.content : []);
      } catch (e) {
        console.warn("load categories failed", e);
      }
    })();
  }, []);

  // ---------- MAP CATEGORY KHI EDIT ----------
  useEffect(() => {
    if (!editingProduct) return;
    if (!categories.length) return;

    const byId = editingProduct.categoryId
      ? categories.find((c) => Number(c.id) === Number(editingProduct.categoryId))
      : null;
    const bySlug =
      !byId && editingProduct.categorySlug
        ? categories.find((c) => c.slug === editingProduct.categorySlug)
        : null;
    const byName =
      !byId && !bySlug && editingProduct.category
        ? categories.find((c) => c.name === editingProduct.category)
        : null;

    const found = byId || bySlug || byName || null;
    if (found) {
      onChange("category", found);
      const t = String(found.title || "").toLowerCase();
      if (t && CANON_TITLES.some((x) => x.key === t)) setTitleFilter(t);
    }
  }, [editingProduct, categories]);

  // ---------- RESET / MAP EDIT ----------
  useEffect(() => {
    if (!editingProduct) {
      setForm({
        name: "",
        brand: "",
        description: "",
        price: "",
        totalStock: "",
        category: null,
        images: [],
        thumbnail: "",
      });
      setVariants([]);
      return;
    }

    try {
      const imgs = Array.isArray(editingProduct.images)
        ? editingProduct.images
        : editingProduct.images
        ? [editingProduct.images]
        : [];

      const mappedImages = imgs.map((url, idx) => ({
        src:
          typeof url === "string"
            ? url
            : url?.url || url?.fileUrl || url?.path || "",
        file: null,
        id:
          typeof url === "object" && (url.id || url._id)
            ? url.id || url._id
            : null,
        isMain: Boolean(
          editingProduct.thumbnail
            ? String(url) === String(editingProduct.thumbnail)
            : idx === 0
        ),
      }));

      setForm((prev) => ({
        ...prev,
        name: editingProduct.name || prev.name,
        brand: editingProduct.brand || prev.brand,
        description: editingProduct.description || prev.description,
        price:
          editingProduct.price !== undefined && editingProduct.price !== null
            ? String(editingProduct.price)
            : prev.price,
        totalStock:
          editingProduct.totalStock !== undefined &&
          editingProduct.totalStock !== null
            ? String(editingProduct.totalStock)
            : prev.totalStock,
        images: mappedImages,
        thumbnail:
          editingProduct.thumbnail || mappedImages[0]?.src || prev.thumbnail || "",
      }));

      // merge cloud metadata (id/isMain) when editing
      (async () => {
        try {
          const resp = await cloudApi.get(`/api/cloud/product/${editingProduct.id}`);
          const files = Array.isArray(resp?.data) ? resp.data : [];
          if (!files.length) return;

          const urlMap = new Map(files.map((f) => [String(f.url), f]));
          const filenameMap = new Map();
          files.forEach((f) => {
            const parts = String(f.url || "").split("/");
            const tail = parts[parts.length - 1];
            if (tail) filenameMap.set(tail, f);
          });

          setForm((prev) => {
            const base = Array.isArray(prev.images) ? prev.images.slice() : [];
            const merged = base.map((img) => {
              if (!img) return img;
              const exact = urlMap.get(String(img.src));
              if (exact)
                return {
                  ...img,
                  id: exact.id ?? exact._id ?? img.id,
                  isMain: Boolean(exact.isMain) ?? img.isMain,
                };
              const tail = String(img.src || "").split("/").pop();
              const fb = filenameMap.get(tail);
              if (fb)
                return {
                  ...img,
                  id: fb.id ?? fb._id ?? img.id,
                  isMain: Boolean(fb.isMain) ?? img.isMain,
                };
              return img;
            });

            if (!merged.some((m) => m && m.isMain) && merged.length) merged[0].isMain = true;
            const mainImg = merged.find((m) => m && m.isMain);
            const thumbnail = mainImg?.src || prev.thumbnail || "";
            return { ...prev, images: merged, thumbnail };
          });
        } catch {}
      })();

      const mappedVariants = Array.isArray(editingProduct.variants)
        ? editingProduct.variants.map((v) => ({
            id: v.id ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sku: v.sku ?? v.SKU ?? "",
            size: v.size ?? (v.attributes && v.attributes.size) ?? "",
            color: v.color ?? (v.attributes && v.attributes.color) ?? "",
            price:
              v.price !== undefined && v.price !== null ? String(v.price) : "",
            stock:
              (v.stock ?? v.quantity ?? 0) !== undefined
                ? String(v.stock ?? v.quantity ?? 0)
                : "",
            attributes: v.attributes ? { ...v.attributes } : {},
          }))
        : [];
      setVariants(mappedVariants);
    } catch (e) {
      console.warn("Error mapping editingProduct into form", e);
    }
  }, [editingProduct]);

  // ---------- HELPERS ----------
  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const triggerFile = () => fileRef.current?.click();

  const handleImageUpload = (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const previews = files.map((f) => ({
      src: URL.createObjectURL(f),
      file: f,
      id: null,
      isMain: false,
    }));

    setForm((prev) => {
      if (!prev.images.some((i) => i.isMain) && previews.length) previews[0].isMain = true;
      return { ...prev, images: [...prev.images, ...previews] };
    });

    e.target.value = "";
  };

  const setMainImage = (index) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isMain: i === index })),
    }));

  const removeImage = (index) =>
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      if (!images.some((i) => i.isMain) && images.length) images[0].isMain = true;
      return { ...prev, images };
    });

  // ---------- VARIANTS ----------
  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      { id: `v-${Date.now()}`, sku: "", size: "", color: "", price: "", stock: "", attributes: {} },
    ]);

  const updateVariant = (i, key, v) =>
    setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  const updateVariantAttribute = (i, key, v) =>
    setVariants((prev) =>
      prev.map((row, idx) =>
        idx !== i ? row : { ...row, attributes: { ...row.attributes, [key]: v || undefined } }
      )
    );

  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  // ---------- VALIDATION ----------
  const validate = () => {
    if (!form.name) return alert("Nhập tên sản phẩm");
    if (!form.category) return alert("Chọn danh mục");

    if (variants.length === 0) {
      if (!form.price) return alert("Nhập giá");
      if (!form.totalStock) return alert("Nhập tổng kho");
    }

    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].price) return alert(`Variant #${i + 1}: thiếu giá`);
      if (!variants[i].stock) return alert(`Variant #${i + 1}: thiếu stock`);
    }
    return true;
  };

  // ---------- CREATE CATEGORY SMART (retry theo casing) ----------
  const createCategorySmart = async (name) => {
    const slug = slugify(name);
    const tries = [titleFilter, toUpper(titleFilter), toCap(titleFilter)];
    let lastErr;
    for (const t of tries) {
      try {
        const created = await apiCreateCategory({ name, slug, title: t, description: "" });
        return created;
      } catch (err) {
        lastErr = err;
      }
    }
    const msg =
      lastErr?.response?.data?.message || lastErr?.message || "Tạo danh mục thất bại";
    throw new Error(msg);
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setGlobalLoadingText(editingProduct ? "Đang cập nhật sản phẩm..." : "Đang tạo sản phẩm...");

    try {
      const payloadVariants = (variants || []).map((v) => {
        const s = String(v?.id ?? "");
        const idToSend = /^\d+$/.test(s) ? Number(s) : undefined;
        return {
          ...(idToSend !== undefined ? { id: idToSend } : {}),
          sku: v.sku || undefined,
          price: Number(v.price ?? 0),
          stock: Number(v.stock ?? 0),
          size: v.size || null,
          color: v.color || null,
          attributes: Object.keys(v.attributes || {}).length ? v.attributes : null,
        };
      });

      const payload = {
        name: form.name,
        brand: form.brand || null,
        description: form.description || "",
        price: variants.length ? undefined : Number(form.price),
        categoryId: form.category?.id || undefined,
        variants: payloadVariants,
        totalStock: variants.length ? undefined : Number(form.totalStock),
      };

      const res = editingProduct
        ? await adminProductService.updateProduct(editingProduct.id, payload)
        : await adminProductService.createProduct(payload);

      if (!res?.success) throw new Error(res?.error || "Save product failed");
      const productId = res.data?.id;
      if (!productId) throw new Error("Product ID not returned");

      // ---------- UPLOAD IMAGES ----------
      const imagesSnapshot = Array.isArray(form.images) ? [...form.images] : [];
      const pendingIndexed = imagesSnapshot
        .map((img, idx) => ({ img, idx }))
        .filter((x) => x.img && x.img.file)
        .map((x) => ({ file: x.img.file, formIndex: x.idx, isMain: !!x.img.isMain }));

      const syncAndReturn = async () => {
        try {
          const sync = await adminProductService.syncProductImages(productId);
          if (sync?.success && sync.data) {
            onSaved(sync.data);
            alert("Lưu thành công");
            return true;
          }
        } catch {}
        try {
          const refreshed = await adminProductService.getProduct(productId);
          if (refreshed?.success && refreshed.data) {
            onSaved(refreshed.data);
            alert("Lưu thành công");
            return true;
          }
        } catch {}
        return false;
      };

      if (pendingIndexed.length) {
        setGlobalLoadingText("Đang upload ảnh lên Cloud...");

        const filesToUpload = pendingIndexed.map((p) => p.file);

        let uploaderId = 0;
        try {
          const user = JSON.parse(localStorage.getItem("anta_user") || "null");
          if (user?.id) uploaderId = Number(user.id);
        } catch {}

        const uploadedData = await uploadMultipleToCloud(filesToUpload, { uploaderId });
        const uploadedArr = Array.isArray(uploadedData) ? uploadedData : uploadedData?.data || [];

        const normalizedUploaded = uploadedArr.map((u) => ({
          id: u?.id ?? u?._id ?? u?.fileId ?? null,
          url: u?.url ?? u?.secure_url ?? u?.fileUrl ?? u?.path ?? null,
        }));

        const newImages = imagesSnapshot.slice();
        normalizedUploaded.forEach((up, i) => {
          const mapping = pendingIndexed[i];
          if (!mapping) return;
          const idx = mapping.formIndex;
          const existing = newImages[idx] || {};
          newImages[idx] = {
            ...existing,
            src: up.url || existing.src,
            id: up.id || existing.id || null,
            file: null,
            isMain: existing.isMain || mapping.isMain,
          };
        });

        const finalIds = newImages.map((img) => img && img.id).filter(Boolean);

        let mainId = null;
        const mainIndexInNew = newImages.findIndex((img) => img && img.isMain);
        if (mainIndexInNew !== -1 && newImages[mainIndexInNew]?.id) {
          mainId = newImages[mainIndexInNew].id;
        }
        if (!mainId && finalIds.length) mainId = finalIds[0];

        setForm((prev) => ({ ...prev, images: newImages }));

        try {
          await cloudApi.put(`/api/cloud/update-product/${productId}`, { ids: finalIds, mainId });
        } catch (e) {
          console.warn("cloud update-product failed", e);
        }

        const ok = await syncAndReturn();
        if (!ok) {
          onSaved(res.data);
          alert("Lưu thành công (hình ảnh có thể chưa xuất hiện ngay)");
        }
        return;
      } else {
        // no new files, but may change isMain
        const finalIds = form.images.map((img) => img && img.id).filter(Boolean);

        let mainId = null;
        const mainIndex = form.images.findIndex((img) => img && img.isMain);
        if (mainIndex !== -1 && form.images[mainIndex]?.id) mainId = form.images[mainIndex].id;
        if (!mainId && finalIds.length) mainId = finalIds[0];

        if (finalIds.length) {
          try {
            await cloudApi.put(`/api/cloud/update-product/${productId}`, { ids: finalIds, mainId });
          } catch (e) {
            console.warn("cloud update-product failed", e);
          }

          const ok = await syncAndReturn();
          if (!ok) {
            onSaved(res.data);
            alert("Lưu thành công");
          }
          return;
        }

        onSaved(res.data);
        alert("Lưu thành công");
        return;
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + (err?.response?.data?.message || err?.message || err));
    } finally {
      setLoading(false);
      setGlobalLoadingText(null);
    }
  };

  // ---------- VIEW ----------
  const filteredCategories = categories.filter(
    (c) => String(c.title || "").toLowerCase() === titleFilter
  );

  return (
    <div className="add-product-component">
      <GlobalLoader show={!!globalLoadingText} text={globalLoadingText || "Đang xử lý..."} />

      {/* HEADER */}
      <div className="page-header-section">
        <div className="header-left">
          <h1 className="page-main-title">
            {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          <p className="page-subtitle">Điền thông tin sản phẩm</p>
        </div>
        <button className="cancel-add-btn" onClick={onCancel} disabled={loading}>
          ← Quay lại
        </button>
      </div>

      <div className="add-product-grid">
        {/* LEFT */}
        <div className="product-info-section">
          <div className="section-card">
            <h3 className="section-card-title">Thông Tin Cơ Bản</h3>

            <div className="form-input-group">
              <label className="input-label required">Tên Sản Phẩm</label>
              <input
                className="form-text-input"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </div>

            <div className="form-input-group">
              <label className="input-label">Thương hiệu</label>
              <input
                className="form-text-input"
                value={form.brand}
                onChange={(e) => onChange("brand", e.target.value)}
              />
            </div>

            <div className="form-input-group">
              <label className="input-label">Mô tả</label>
              <textarea
                className="form-textarea-input"
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </div>

            {variants.length === 0 && (
              <div className="form-row-grid">
                <div className="form-input-group">
                  <label className="input-label required">Giá bán (VNĐ)</label>
                  <input
                    className="form-text-input"
                    type="number"
                    value={form.price}
                    onChange={(e) => onChange("price", e.target.value)}
                  />
                </div>
                <div className="form-input-group">
                  <label className="input-label required">Tổng kho</label>
                  <input
                    className="form-text-input"
                    type="number"
                    value={form.totalStock}
                    onChange={(e) => onChange("totalStock", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-input-group">
              <label className="input-label">Hình ảnh sản phẩm</label>
              <div className="image-drop" onClick={triggerFile}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <div className="placeholder">
                  <div className="camera">📷</div>
                  <div>Chọn ảnh từ máy (nhiều ảnh + max 5MB)</div>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="images-grid" style={{ marginTop: 12 }}>
                  {form.images.map((img, idx) => (
                    <div className="image-card-wrapper" key={idx}>
                      <div className="image-card">
                        <img src={img.src} alt={`img-${idx}`} />
                        {img.isMain && <div className="image-main-badge">MAIN</div>}
                      </div>

                      <div className="image-card-actions">
                        <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>
                          Xóa
                        </button>
                        {!img.isMain && (
                          <button type="button" className="set-main-btn" onClick={() => setMainImage(idx)}>
                            Đặt ảnh chính
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-divider" />
            <h4>Variants (Size / Màu / SKU)</h4>
            <button className="add-variant-btn" onClick={addVariant}>
              + Thêm Variant
            </button>

            {variants.map((v, i) => (
              <div key={v.id} className="variant-card">
                <div className="variant-row">
                  <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} />
                  <input placeholder="Size" value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} />
                  <input placeholder="Màu" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} />
                </div>
                <div className="variant-row">
                  <input
                    placeholder="Giá"
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                  />
                  <button className="variant-remove-btn" onClick={() => removeVariant(i)}>
                    Xóa
                  </button>
                </div>
                <div className="variant-row">
                  <input
                    placeholder="material (leather…)"
                    value={v.attributes?.material || ""}
                    onChange={(e) => updateVariantAttribute(i, "material", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="category-section-sidebar">
          <div className="section-card">
            <h3 className="section-card-title">Nhóm (title) & Danh mục</h3>

            <div className="form-input-group">
              <label className="input-label">Chọn nhóm (title)</label>
              <select
                className="form-text-input"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
              >
                {CANON_TITLES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-input-group">
              <label className="input-label">Tạo danh mục mới (thuộc nhóm đang chọn)</label>
              <div className="add-category-row">
                <input
                  type="text"
                  className="form-text-input"
                  placeholder={`Nhập danh mục mới cho ${
                    CANON_TITLES.find((x) => x.key === titleFilter)?.label || titleFilter
                  }…`}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return;
                    const name = newCategory.trim();
                    if (!name) return;
                    try {
                      const created = await createCategorySmart(name);
                      setCategories((prev) => [created, ...prev]);
                      onChange("category", created);
                      setNewCategory("");
                      try {
                        localStorage.setItem("anta_categories_version", String(Date.now()));
                      } catch {}
                    } catch (err) {
                      alert(err.message || "Tạo danh mục thất bại");
                    }
                  }}
                />
                <button
                  type="button"
                  className="add-category-btn"
                  onClick={async () => {
                    const name = newCategory.trim();
                    if (!name) return;
                    try {
                      const created = await createCategorySmart(name);
                      setCategories((prev) => [created, ...prev]);
                      onChange("category", created);
                      setNewCategory("");
                      try {
                        localStorage.setItem("anta_categories_version", String(Date.now()));
                      } catch {}
                    } catch (err) {
                      alert(err.message || "Tạo danh mục thất bại");
                    }
                  }}
                >
                  + Thêm
                </button>
              </div>
            </div>

            <div className="form-input-group">
              <label className="input-label">Danh mục theo nhóm đang chọn</label>
              <input
                className="form-text-input"
                readOnly
                value={form.category?.name || ""}
                placeholder="Chưa chọn danh mục"
              />
            </div>

            <div className="category-selection-list">
              {filteredCategories.length === 0 && (
                <div style={{ padding: 8, opacity: 0.7 }}>Chưa có danh mục cho nhóm này.</div>
              )}

              {filteredCategories.map((cat) => (
                <div
                  className="category-selection-item"
                  key={cat.id ?? cat.slug}
                  onClick={() => onChange("category", cat)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="category-item-icon">
                    {form.category?.slug === cat.slug ? "●" : "○"}
                  </span>
                  <span className="category-item-name">{cat.name}</span>

                  <button
                    type="button"
                    className="delete-category-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategories((prev) =>
                        prev.filter((c) => (c.id ?? c.slug) !== (cat.id ?? cat.slug))
                      );
                      if (form.category?.slug === cat.slug) onChange("category", null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="submit-actions-card">
            <button className="submit-product-btn" disabled={loading} onClick={handleSubmit}>
              {loading ? "⏳ Đang lưu..." : editingProduct ? "✓ Cập Nhật Sản Phẩm" : "✓ Thêm Sản Phẩm"}
            </button>
            <button className="cancel-product-btn" disabled={loading} onClick={onCancel}>
              ✕ Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
