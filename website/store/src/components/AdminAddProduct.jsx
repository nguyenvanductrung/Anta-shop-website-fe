//src/components/AdminAddProduct.jsx
import React, { useState, useEffect, useRef } from 'react';
import cloudApi, { uploadMultipleToCloud } from '../services/cloud';
import { products as adminProductService } from '../services';
import GlobalLoader from './GlobalLoader';
import './AdminAddProduct.css';

export default function AdminAddProduct({ editingProduct = null, onSaved = () => { }, onCancel = () => { } }) {
  // const [categories, setCategories] = useState([
  //   "Giày Bóng Rổ",
  //   "Giày Chạy Bộ",
  //   "Giày Lifestyle",
  //   "Áo Thun",
  //   "Áo Khoác",
  //   "Quần Short",
  //   "Quần Dài",
  //   "Phụ Kiện"
  // ]);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    totalStock: '',
    category: '',
    images: [],
    thumbnail: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalLoadingText, setGlobalLoadingText] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([
    'Giày Bóng Rổ',
    'Giày Chạy Bộ',
    'Giày Lifestyle',
    'Áo Thun',
    'Áo Khoác',
    'Quần Short',
    'Quần Dài',
    'Phụ Kiện'
  ]);
  // --------------------- HANDLE EDITING PRODUCT ---------------------
  useEffect(() => {
    if (editingProduct) {
      // ... code khác ...

      const cat = categories.find(c => c === editingProduct.category); // ✅ So sánh STRING
      if (cat) setSelectedCategory(cat);

      // ...
    }
  }, [editingProduct]);

  // --------------------- CLEANUP FILE PREVIEWS ---------------------
  useEffect(() => {
    if (!editingProduct) {
      // reset form khi không còn editingProduct
      setForm({
        name: '',
        brand: '',
        description: '',
        price: '',
        totalStock: '',
        category: '',
        images: [],
        thumbnail: ''
      });
      setVariants([]);
      setSelectedCategory('');
      return;
    }

    // Nếu có editingProduct -> gán vào form, variants, images
    try {
      // categories: nếu category từ product chưa có trong danh sách thì thêm vào đầu
      if (editingProduct.category && !categories.includes(editingProduct.category)) {
        setCategories(prev => [editingProduct.category, ...prev]);
      }

      // map images (backend thường trả mảng url)
      // map images (backend thường trả mảng url)
      const imgs = Array.isArray(editingProduct.images) ? editingProduct.images : (editingProduct.images ? [editingProduct.images] : []);
      const mappedImages = imgs.map((url, idx) => ({
        src: typeof url === 'string' ? url : (url?.url || url?.fileUrl || url?.path || ''),
        file: null,          // không phải file local, do backend trả sẵn
        id: typeof url === 'object' && (url.id || url._id) ? (url.id || url._id) : null,
        isMain: Boolean(editingProduct.thumbnail ? (String(url) === String(editingProduct.thumbnail)) : (idx === 0))
      }));

      // set preliminary form so UI khoẻ khi mở edit
      setForm(prev => ({
        ...prev,
        name: editingProduct.name || prev.name,
        brand: editingProduct.brand || prev.brand,
        description: editingProduct.description || prev.description,
        price: editingProduct.price !== undefined && editingProduct.price !== null ? String(editingProduct.price) : prev.price,
        totalStock: editingProduct.totalStock !== undefined && editingProduct.totalStock !== null ? String(editingProduct.totalStock) : prev.totalStock,
        category: editingProduct.category || prev.category,
        images: mappedImages,
        thumbnail: editingProduct.thumbnail || (mappedImages[0]?.src || prev.thumbnail || '')
      }));

      // Try to fetch file metadata from cloud and merge ids/isMain (so we have DB file ids for later update)
      (async () => {
        try {
          // call cloud service to get FileMetadata[] for this product
          const resp = await cloudApi.get(`/api/cloud/product/${editingProduct.id}`);
          const files = Array.isArray(resp?.data) ? resp.data : [];
          if (!files.length) return;

          // build lookup by exact url
          const urlMap = new Map(files.map(f => [String(f.url), f]));

          // also try lookup by filename tail as fallback (some urls might be normalized differently)
          const filenameMap = new Map();
          files.forEach(f => {
            try {
              const url = String(f.url || '');
              const parts = url.split('/');
              const tail = parts[parts.length - 1];
              if (tail) filenameMap.set(tail, f);
            } catch (e) { /* ignore */ }
          });

          // merge into current mappedImages
          setForm(prev => {
            const base = Array.isArray(prev.images) ? prev.images.slice() : [];
            const merged = base.map(img => {
              if (!img) return img;
              const exact = urlMap.get(String(img.src));
              if (exact) {
                return { ...img, id: exact.id ?? exact._id ?? img.id, isMain: Boolean(exact.isMain) ?? img.isMain };
              }
              // fallback: try match by filename tail
              const tail = String(img.src || '').split('/').pop();
              const fallbackMeta = filenameMap.get(tail);
              if (fallbackMeta) {
                return { ...img, id: fallbackMeta.id ?? fallbackMeta._id ?? img.id, isMain: Boolean(fallbackMeta.isMain) ?? img.isMain };
              }
              return img;
            });

            // ensure exactly one isMain (prefer existing main)
            if (!merged.some(m => m && m.isMain) && merged.length) merged[0].isMain = true;

            // update thumbnail consistent with isMain
            const mainImg = merged.find(m => m && m.isMain);
            const thumbnail = mainImg?.src || prev.thumbnail || '';

            return { ...prev, images: merged, thumbnail };
          });

        } catch (e) {
          console.warn('Không thể lấy file metadata từ cloud để merge ids:', e);
        }
      })();


      // map variants -> dùng chuỗi cho input values
      const mappedVariants = Array.isArray(editingProduct.variants) ? editingProduct.variants.map((v) => ({
        id: v.id ?? (`v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        sku: v.sku ?? v.SKU ?? '',
        size: v.size ?? (v.attributes && v.attributes.size) ?? '',
        color: v.color ?? (v.attributes && v.attributes.color) ?? '',
        price: v.price !== undefined && v.price !== null ? String(v.price) : '',
        stock: (v.stock ?? v.quantity ?? 0) !== undefined ? String(v.stock ?? v.quantity ?? 0) : '',
        attributes: v.attributes ? { ...v.attributes } : {}
      })) : [];

      setVariants(mappedVariants);
      setSelectedCategory(editingProduct.category || '');
    } catch (e) {
      console.warn('Error mapping editingProduct into form', e);
    }
  }, [editingProduct]);

  // --------------------- FORM HELPERS ---------------------
  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const triggerFile = () => fileRef.current?.click();

  const handleImageUpload = e => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const previews = files.map(f => ({
      src: URL.createObjectURL(f),
      file: f,
      id: null,
      isMain: false
    }));

    setForm(prev => {
      if (!prev.images.some(i => i.isMain) && previews.length)
        previews[0].isMain = true;

      return { ...prev, images: [...prev.images, ...previews] };
    });

    e.target.value = '';
  };

  const setMainImage = index =>
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isMain: i === index }))
    }));

  const removeImage = index =>
    setForm(prev => {
      const images = prev.images.filter((_, i) => i !== index);
      if (!images.some(i => i.isMain) && images.length) images[0].isMain = true;
      return { ...prev, images };
    });

  // --------------------- VARIANTS ---------------------
  const addVariant = () =>
    setVariants(prev => [...prev, { id: `v-${Date.now()}`, sku: '', size: '', color: '', price: '', stock: '', attributes: {} }]);

  const updateVariant = (i, key, v) =>
    setVariants(prev => prev.map((row, idx) => idx === i ? { ...row, [key]: v } : row));

  const updateVariantAttribute = (i, key, v) =>
    setVariants(prev => prev.map((row, idx) =>
      idx !== i ? row : { ...row, attributes: { ...row.attributes, [key]: v || undefined } }
    ));

  const removeVariant = i =>
    setVariants(prev => prev.filter((_, idx) => idx !== i));

  // --------------------- VALIDATION ---------------------
  const validate = () => {
    if (!form.name) return alert('Nhập tên sản phẩm');
    if (!form.category) return alert('Chọn danh mục');

    if (variants.length === 0) {
      if (!form.price) return alert('Nhập giá');
      if (!form.totalStock) return alert('Nhập tổng kho');
    }

    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].price) return alert(`Variant #${i + 1}: thiếu giá`);
      if (!variants[i].stock) return alert(`Variant #${i + 1}: thiếu stock`);
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setGlobalLoadingText('Đang tạo sản phẩm...');

    try {
      const totalStock = variants.length ? undefined : Number(form.totalStock);

      const payload = {
        name: form.name,
        brand: form.brand,
        description: form.description,
        category: form.category,
        price: variants.length ? undefined : Number(form.price),
        totalStock,
        variants: variants.length
          ? variants.map(v => ({
            sku: v.sku || undefined,
            price: Number(v.price),
            stock: Number(v.stock),
            size: v.size || null,
            color: v.color || null,
            attributes: Object.keys(v.attributes).length ? v.attributes : null
          }))
          : undefined
      };

      // create/update product
      const res = editingProduct
        ? await adminProductService.updateProduct(editingProduct.id, payload)
        : await adminProductService.createProduct(payload);

      if (!res?.success) throw new Error(res?.error || "Save product failed");
      const productId = res.data?.id;
      if (!productId) throw new Error("Product ID not returned");

      // -------------------- UPLOAD IMAGES --------------------
      // -------------------- UPLOAD IMAGES --------------------
      const imagesSnapshot = Array.isArray(form.images) ? [...form.images] : [];

      const pendingIndexed = imagesSnapshot
        .map((img, idx) => ({ img, idx }))
        .filter(x => x.img && x.img.file)
        .map(x => ({ file: x.img.file, formIndex: x.idx, isMain: !!x.img.isMain }));

      if (pendingIndexed.length) {
        setGlobalLoadingText('Đang upload ảnh lên Cloud...');

        // Prepare files preserving the form order for mapping back
        const filesToUpload = pendingIndexed.map(p => p.file);

        // uploaderId = user.id
        let uploaderId = 0;
        try {
          const user = JSON.parse(localStorage.getItem("anta_user") || "null");
          if (user?.id) uploaderId = Number(user.id);
        } catch { }

        const uploadedData = await uploadMultipleToCloud(filesToUpload, { uploaderId });
        const uploadedArr = Array.isArray(uploadedData) ? uploadedData : (uploadedData?.data || []);

        // normalize uploaded metadata -> id + url
        const normalizedUploaded = uploadedArr.map(u => ({
          id: u?.id ?? u?._id ?? u?.fileId ?? null,
          url: u?.url ?? u?.secure_url ?? u?.fileUrl ?? u?.path ?? null,
          raw: u
        }));

        // 1) map uploaded results back into imagesSnapshot by formIndex
        const newImages = imagesSnapshot.slice(); // copy
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
            isMain: existing.isMain || mapping.isMain
          };
        });

        // 2) collect finalIds from newImages (include existing ids and newly uploaded ids)
        const finalIds = newImages.map(img => img && img.id).filter(Boolean);

        // 3) determine mainId robustly
        let mainId = null;
        const mainIndexInNew = newImages.findIndex(img => img && img.isMain);
        if (mainIndexInNew !== -1 && newImages[mainIndexInNew]?.id) {
          mainId = newImages[mainIndexInNew].id;
        } else {
          // if main is one of newly uploaded and assigned above, pick it
          for (let i = 0; i < pendingIndexed.length; i++) {
            if (pendingIndexed[i].isMain) {
              const formIdx = pendingIndexed[i].formIndex;
              const uploadedMeta = normalizedUploaded[i];
              if (uploadedMeta && uploadedMeta.id) {
                mainId = uploadedMeta.id;
                break;
              } else if (newImages[formIdx] && newImages[formIdx].id) {
                mainId = newImages[formIdx].id;
                break;
              }
            }
          }
        }
        if (!mainId && finalIds.length) mainId = finalIds[0];

        // 4) update local form state with newImages (so UI shows uploaded images immediately)
        setForm(prev => ({ ...prev, images: newImages }));

        // 5) call cloud update with full ids + mainId (object payload)
        try {
          await cloudApi.put(`/api/cloud/update-product/${productId}`, { ids: finalIds, mainId });
        } catch (e) {
          console.warn('update-product failed', e);
          // continue to attempt sync/fetch
        }

        // 6) request product-service to sync images (preferred) or fallback to getProduct
        try {
          const sync = await adminProductService.syncProductImages(productId);
          if (sync?.success && sync.data) {
            onSaved(sync.data);
          } else {
            const refreshed = await adminProductService.getProduct(productId);
            onSaved(refreshed.data);
          }
        } catch (e) {
          console.warn('sync images failed, fallback to getProduct', e);
          const refreshed = await adminProductService.getProduct(productId);
          onSaved(refreshed.data);
        }

      } else {
        // No newly uploaded files. But user may have changed which image is main.
        const finalIds = form.images.map(img => img && img.id).filter(Boolean);
        let mainId = null;
        const mainIndex = form.images.findIndex(img => img && img.isMain);
        if (mainIndex !== -1 && form.images[mainIndex]?.id) mainId = form.images[mainIndex].id;
        if (!mainId && finalIds.length) mainId = finalIds[0];

        if (finalIds.length) {
          try {
            await cloudApi.put(`/api/cloud/update-product/${productId}`, { ids: finalIds, mainId });
            const sync = await adminProductService.syncProductImages(productId);
            if (sync?.success && sync.data) {
              onSaved(sync.data);
            } else {
              const refreshed = await adminProductService.getProduct(productId);
              onSaved(refreshed.data);
            }
          } catch (e) {
            console.warn('update-product for existing images failed', e);
            const refreshed = await adminProductService.getProduct(productId);
            onSaved(refreshed.data);
          }
        } else {
          // nothing to sync (no images)
          onSaved(res.data);
        }
      }


      alert("Lưu thành công");
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + (err?.message || err));
    } finally {
      setLoading(false);
      setGlobalLoadingText(null);
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="add-product-component">
      <GlobalLoader show={!!globalLoadingText} text={globalLoadingText || "Đang xử lý..."} />

      {/* HEADER */}
      <div className="page-header-section">
        <div className="header-left">
          <h1 className="page-main-title">{editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h1>
          <p className="page-subtitle">Điền thông tin sản phẩm</p>
        </div>
        <button className="cancel-add-btn" onClick={onCancel} disabled={loading}>← Quay lại</button>
      </div>

      {/* GRID */}
      <div className="add-product-grid">
        {/* LEFT */}
        <div className="product-info-section">
          <div className="section-card">
            <h3 className="section-card-title">Thông Tin Cơ Bản</h3>

            {/* TITLE */}
            <div className="form-input-group">
              <label className="input-label required">Tên Sản Phẩm</label>
              <input className="form-text-input" value={form.name} onChange={e => onChange("name", e.target.value)} />
            </div>

            {/* BRAND */}
            <div className="form-input-group">
              <label className="input-label">Thương hiệu</label>
              <input className="form-text-input" value={form.brand} onChange={e => onChange("brand", e.target.value)} />
            </div>

            {/* DESCRIPTION */}
            <div className="form-input-group">
              <label className="input-label">Mô tả</label>
              <textarea className="form-textarea-input" value={form.description} onChange={e => onChange("description", e.target.value)} />
            </div>

            {/* PRICE + STOCK */}
            {variants.length === 0 && (
              <div className="form-row-grid">
                <div className="form-input-group">
                  <label className="input-label required">Giá bán (VNĐ)</label>
                  <input className="form-text-input" type="number" value={form.price} onChange={e => onChange("price", e.target.value)} />
                </div>

                <div className="form-input-group">
                  <label className="input-label required">Tổng kho</label>
                  <input className="form-text-input" type="number" value={form.totalStock} onChange={e => onChange("totalStock", e.target.value)} />
                </div>
              </div>
            )}

            {/* IMAGES */}
            <div className="form-input-group">
              <label className="input-label">Hình ảnh sản phẩm</label>
              <div className="image-drop" onClick={triggerFile}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
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
                        <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>Xóa</button>
                        {!img.isMain && (
                          <button type="button" className="set-main-btn" onClick={() => setMainImage(idx)}>Đặt ảnh chính</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VARIANTS */}
            <div className="section-divider" />
            <h4>Variants (Size / Màu / SKU)</h4>

            <button className="add-variant-btn" onClick={addVariant}>+ Thêm Variant</button>

            {variants.map((v, i) => (
              <div key={v.id} className="variant-card">
                <div className="variant-row">
                  <input placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} />
                  <input placeholder="Size" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} />
                  <input placeholder="Màu" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} />
                </div>

                <div className="variant-row">
                  <input placeholder="Giá" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                  <input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                  <button className="variant-remove-btn" onClick={() => removeVariant(i)}>Xóa</button>
                </div>

                <div className="variant-row">
                  <input placeholder="material (leather…)" value={v.attributes?.material || ''} onChange={e => updateVariantAttribute(i, 'material', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY RIGHT SIDE */}
        <div className="category-section-sidebar">
          <div className="section-card">
            <h3 className="section-card-title">Danh Mục</h3>

            <div className="form-input-group">
              <label className="input-label">Danh mục đã chọn</label>
              <div className="add-category-row">
                <input
                  type="text"
                  className="form-text-input"
                  placeholder="Nhập danh mục mới…"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { // Enter cũng thêm
                      if (newCategory.trim() !== "") {
                        setCategories((prev) => [...prev, newCategory.trim()]);
                        setNewCategory("");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="add-category-btn"
                  onClick={() => {
                    if (newCategory.trim() !== "") {
                      setCategories((prev) => [...prev, newCategory.trim()]);
                      setNewCategory("");
                    }
                  }}
                >
                  + Thêm
                </button>
              </div>
              <input className="form-text-input" readOnly value={form.category} placeholder="Chọn danh mục bên dưới…" />
            </div>

            <div className="category-selection-list">
              {categories.map((cat, idx) => (
                <div
                  className="category-selection-item"
                  key={idx}
                  onClick={() => onChange('category', cat)} // ✅ Thêm onClick để chọn
                  style={{ cursor: 'pointer' }}
                >
                  <span className="category-item-icon">
                    {form.category === cat ? '●' : '○'}
                  </span>
                  <span className="category-item-name">{cat}</span>

                  <button
                    type="button"
                    className="delete-category-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ Ngăn trigger onClick của parent
                      setCategories((prev) => prev.filter((c) => c !== cat));
                      if (form.category === cat) onChange('category', ''); // ✅ Clear nếu đang chọn
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

            <button className="cancel-product-btn" disabled={loading} onClick={onCancel}>✕ Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}