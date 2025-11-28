import React, { useState, useEffect, useRef } from 'react';
import { products as adminProductService } from '../services';
import './AdminAddProduct.css';

export default function AdminAddProduct({ editingProduct = null, onSaved = () => { }, onCancel = () => { } }) {
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

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const fileRef = useRef(null);

  const categories = [
    { id: 'giay-bong-ro', name: 'Giày Bóng Rổ' },
    { id: 'giay-chay-bo', name: 'Giày Chạy Bộ' },
    { id: 'giay-lifestyle', name: 'Giày Lifestyle' },
    { id: 'ao-thun', name: 'Áo Thun' },
    { id: 'ao-khoac', name: 'Áo Khoác' },
    { id: 'quan-short', name: 'Quần Short' },
    { id: 'quan-dai', name: 'Quần Dài' },
    { id: 'phu-kien', name: 'Phụ Kiện' }
  ];

  useEffect(() => {
    if (editingProduct) {
      const backendImgs = (editingProduct.images || []).map(s => ({ src: s, isMain: false }));
      if (backendImgs.length) {
        if (editingProduct.thumbnail) {
          backendImgs.forEach(i => { if (i.src === editingProduct.thumbnail) i.isMain = true; });
        } else {
          backendImgs[0].isMain = true;
        }
      }

      setForm({
        name: editingProduct.name || '',
        brand: editingProduct.brand || '',
        description: editingProduct.description || '',
        price: editingProduct.price ?? '',
        totalStock: editingProduct.totalStock ?? editingProduct.quantity ?? editingProduct.stock ?? '',
        category: editingProduct.category || '',
        images: backendImgs,
        thumbnail: editingProduct.thumbnail || (backendImgs[0] ? backendImgs[0].src : '')
      });

      const cat = categories.find(c => c.name === editingProduct.category);
      if (cat) setSelectedCategory(cat.id);

      setVariants(
        (editingProduct.variants || []).map(v => ({
          id: v.id || `v-${Date.now()}`,
          sku: v.sku || v.SKU || '',
          size: v.size || '',
          color: v.color || '',
          price: v.price ?? '',
          stock: v.stock ?? v.quantity ?? v.qty ?? '',
          attributes: v.attributes || {}
        }))
      );
    } else {
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
    }
  }, [editingProduct]);

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const triggerFile = () => fileRef.current?.click();

  const readFilesToBase64 = (fileList) => {
    const files = Array.from(fileList || []);
    const promises = files.map(f => new Promise((res, rej) => {
      if (!f.type.startsWith('image/')) return rej(new Error('Not image'));
      if (f.size > 5 * 1024 * 1024) return rej(new Error('Max 5MB'));
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(f);
    }));
    return Promise.all(promises);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const base64List = await readFilesToBase64(files);
      setForm(prev => {
        const hasMain = prev.images.some(i => i.isMain);
        const newImgs = base64List.map(src => ({ src, isMain: false }));
        if (!hasMain && newImgs.length) newImgs[0].isMain = true;
        return { ...prev, images: [...prev.images, ...newImgs] };
      });
      e.target.value = '';
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi khi đọc file ảnh');
    }
  };

  const setMainImage = (idx) => {
    setForm(prev => {
      const images = prev.images.map((img, i) => ({ ...img, isMain: i === idx }));
      return { ...prev, images };
    });
  };

  const removeImage = (idx) => {
    setForm(prev => {
      const images = prev.images.filter((_, i) => i !== idx);
      if (!images.some(i => i.isMain) && images.length) images[0].isMain = true;
      return { ...prev, images };
    });
  };

  const addVariant = () =>
    setVariants(prev => [...prev, { id: `v-${Date.now()}`, sku: '', size: '', color: '', price: '', stock: '', attributes: {} }]);

  const updateVariant = (i, field, value) =>
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));

  const updateVariantAttribute = (i, key, value) => {
    setVariants(prev => prev.map((v, idx) => {
      if (idx !== i) return v;
      const attrs = { ...(v.attributes || {}) };
      if (!value) delete attrs[key];
      else attrs[key] = value;
      return { ...v, attributes: attrs };
    }));
  };

  const removeVariant = (i) =>
    setVariants(prev => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    if (!form.name) { alert('Nhập tên sản phẩm'); return false; }
    if (!form.category) { alert('Chọn danh mục'); return false; }

    if (variants.length === 0) {
      if (!form.price) { alert('Nhập giá'); return false; }
      if (!form.totalStock) { alert('Nhập tổng kho'); return false; }
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.price) { alert(`Variant #${i + 1}: thiếu giá`); return false; }
      if (!v.stock) { alert(`Variant #${i + 1}: thiếu stock`); return false; }
    }

    return true;
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    const cat = categories.find(c => c.id === id);
    setForm(prev => ({ ...prev, category: cat?.name || '' }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const imagesArr = form.images.map(i => i.src);
    const thumbnail = (form.images.find(i => i.isMain) || {}).src || form.thumbnail || (imagesArr[0] || undefined);

    const payload = {
      name: form.name,
      brand: form.brand || null,
      description: form.description || '',
      category: form.category,
      images: imagesArr.length ? imagesArr : undefined,
      thumbnail: thumbnail || undefined,

      price: variants.length ? undefined : Number(form.price) || 0,
      totalStock: variants.length ? undefined : Number(form.totalStock) || 0,

      variants: variants.length
        ? variants.map(v => ({
          sku: v.sku || undefined,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          size: v.size || null,
          color: v.color || null,
          attributes: Object.keys(v.attributes || {}).length ? v.attributes : null
        }))
        : undefined
    };

    try {
      const res = editingProduct
        ? await adminProductService.updateProduct(editingProduct.id, payload)
        : await adminProductService.createProduct(payload);

      if (res?.success) {
        alert(res.message || 'Lưu thành công');
        onSaved(res.data);
      } else alert(res?.error || 'Lỗi');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-component">

      {/* HEADER */}
      <div className="page-header-section">
        <div className="header-left">
          <h1 className="page-main-title">{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h1>
          <p className="page-subtitle">Điền thông tin sản phẩm của bạn</p>
        </div>
        <button className="cancel-add-btn" onClick={onCancel}>← Quay lại</button>
      </div>

      {/* GRID */}
      <div className="add-product-grid">

        {/* LEFT COLUMN */}
        <div className="product-info-section">
          <div className="section-card">
            <h3 className="section-card-title">Thông Tin Cơ Bản</h3>

            {/* NAME */}
            <div className="form-input-group">
              <label className="input-label required">Tên Sản Phẩm</label>
              <input className="form-text-input" value={form.name} onChange={e => onChange('name', e.target.value)} />
            </div>

            {/* BRAND */}
            <div className="form-input-group">
              <label className="input-label">Thương hiệu</label>
              <input className="form-text-input" value={form.brand} onChange={e => onChange('brand', e.target.value)} />
            </div>

            {/* DESCRIPTION */}
            <div className="form-input-group">
              <label className="input-label">Mô tả sản phẩm</label>
              <textarea className="form-textarea-input" value={form.description} onChange={e => onChange('description', e.target.value)} />
            </div>

            {/* PRICE + STOCK WHEN NO VARIANT */}
            {variants.length === 0 && (
              <div className="form-row-grid">
                <div className="form-input-group">
                  <label className="input-label required">Giá bán (VNĐ)</label>
                  <input className="form-text-input" type="number" value={form.price} onChange={e => onChange('price', e.target.value)} />
                </div>

                <div className="form-input-group">
                  <label className="input-label required">Tổng kho (totalStock)</label>
                  <input className="form-text-input" type="number" value={form.totalStock} onChange={e => onChange('totalStock', e.target.value)} />
                </div>
              </div>
            )}

            {/* IMAGE UPLOAD */}
            <div className="form-input-group">
              <label className="input-label">Hình ảnh sản phẩm</label>
              <div className="image-drop" onClick={triggerFile}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
                <div className="placeholder">
                  <div className="camera">📷</div>
                  <div>CHỌN ẢNH TỪ MÁY (Max 5MB) — bạn có thể chọn nhiều ảnh</div>
                </div>
              </div>

              {/* images grid */}
              {form.images && form.images.length > 0 && (
                <div className="images-grid" style={{ marginTop: 12 }}>
                  {form.images.map((img, idx) => (
                    <div className="image-card-wrapper" key={idx}>
                      {/* IMAGE BOX */}
                      <div className="image-card">
                        <img src={img.src} alt={`img-${idx}`} />
                        {img.isMain && <div className="image-main-badge">MAIN</div>}
                      </div>

                      {/* ACTIONS: bên phải ảnh trên desktop, bên dưới trên mobile */}
                      <div className="image-card-actions" role="group" aria-label={`actions-for-image-${idx}`}>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeImage(idx)}
                          title="Xóa ảnh"
                        >
                            Xóa
                        </button>

                        {!img.isMain && (
                          <button
                            type="button"
                            className={`set-main-btn ${img.isMain ? 'main' : ''}`}
                            onClick={() => setMainImage(idx)}
                            title="Đặt làm ảnh chính"
                          >
                             Đặt ảnh chính
                          </button>
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

            <button className="add-variant-btn" onClick={addVariant}> + Chi tiết sản phẩm (Product Variant)</button>

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

        {/* RIGHT SIDEBAR */}
        <div className="category-section-sidebar">

          <div className="section-card">
            <h3 className="section-card-title">Danh Mục</h3>

            <div className="form-input-group">
              <label className="input-label required">Chọn danh mục</label>
              <input className="form-text-input" readOnly value={form.category} placeholder="Chọn danh mục bên dưới…" />
            </div>

            <div className="category-selection-list">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-selection-item ${selectedCategory === c.id ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(c.id)}
                >
                  <span className="category-item-icon">{selectedCategory === c.id ? '✓' : '○'}</span>
                  <span className="category-item-name">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="submit-actions-card">
            <button className="submit-product-btn" disabled={loading} onClick={handleSubmit}>
              {loading ? '⏳ Đang lưu...' : (editingProduct ? '✓ Cập Nhật Sản Phẩm' : '✓ Thêm Sản Phẩm')}
            </button>
            <button className="cancel-product-btn" disabled={loading} onClick={onCancel}>✕ Hủy Bỏ</button>
          </div>

        </div>

      </div>
    </div>
  );
}