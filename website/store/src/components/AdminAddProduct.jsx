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
    return () => {
      form.images?.forEach(img => {
        if (img.file) {
          try { URL.revokeObjectURL(img.src); } catch { }
        }
      });
    };
  }, []);

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
      const pending = form.images.filter(i => i.file);
      if (pending.length) {
        setGlobalLoadingText('Đang upload ảnh lên Cloud...');

        const files = pending.map(p => p.file);

        // uploaderId = user.id
        let uploaderId = 0;
        try {
          const user = JSON.parse(localStorage.getItem("anta_user") || "null");
          if (user?.id) uploaderId = Number(user.id);
        } catch { }

        const uploadedData = await uploadMultipleToCloud(files, { uploaderId });

        const uploadedArr = Array.isArray(uploadedData)
          ? uploadedData
          : uploadedData?.data || [];

        const imageIds = uploadedArr
          .map(u => u.id || u._id || u.fileId)
          .filter(Boolean);

        await cloudApi.put(`/api/cloud/update-product/${productId}`, imageIds);

        // request product-service to sync images from cloud and return product with images
        try {
          const sync = await adminProductService.syncProductImages(productId);
          if (sync?.success && sync.data) {
            onSaved(sync.data);
          } else {
            // fallback: fetch product directly
            const refreshed = await adminProductService.getProduct(productId);
            onSaved(refreshed.data);
          }
        } catch (e) {
          console.warn('sync images failed, fallback to getProduct', e);
          const refreshed = await adminProductService.getProduct(productId);
          onSaved(refreshed.data);
        }
      } else {
        onSaved(res.data);
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
    onKeyDown={(e) => { if (e.key === "Enter") { // Enter cũng thêm
        if (newCategory.trim() !== "") {
          setCategories((prev) => [...prev, newCategory.trim()]);
          setNewCategory("");
        }
      }}}
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