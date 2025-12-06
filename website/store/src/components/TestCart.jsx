import React from 'react';
import { useCart } from '../hooks/useCart';  // ← ĐỔI IMPORT

const TestCart = () => {
  // Đổi tên hàm: addItem thay vì addToCart
  const { addItem, cart, loading } = useCart();

  const testProducts = [
    {
      id: 1,
      name: 'ANTA KT8',
      price: 2490000,
      variantId: 1,  // ← THÊM variantId
      image: 'https://via.placeholder.com/200x200?text=ANTA+KT8'
    },
    {
      id: 2,
      name: 'ANTA KT7',
      price: 1990000,
      variantId: 2,
      image: 'https://via.placeholder.com/200x200?text=ANTA+KT7'
    },
    {
      id: 3,
      name: 'ANTA GH4',
      price: 1490000,
      variantId: 3,
      image: 'https://via.placeholder.com/200x200?text=ANTA+GH4'
    },
  ];

  // TestCart.jsx - Sửa handleAddToCart
  const handleAddToCart = async (product) => {
    console.log('🎯 Original product:', product);

    // Đảm bảo data đúng format
    const fixedProduct = {
      id: Number(product.id), // ✅ Convert to number
      name: product.name,
      price: Number(product.price), // ✅ Convert to number
      variantId: product.variantId ? Number(product.variantId) : null, // ✅ Convert or null
      image: product.image
    };

    console.log('🔧 Fixed product:', fixedProduct);

    try {
      const result = await addItem(fixedProduct);
      console.log('✅ Add cart success:', result);

      // Refresh cart sau 500ms để xem có update không
      setTimeout(() => {
        fetchCart();
      }, 500);
    } catch (error) {
      console.error('❌ Add cart error:', error);
      console.error('Full error:', error.response?.data || error.message);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f8f8f8', margin: '20px', borderRadius: '8px' }}>
      <h3>Test Cart Functionality (API)</h3>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Cart ID: {cart?.id || 'No cart'}</p>
      <p>Cart items: {cart?.items?.length || 0}</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {testProducts.map(product => (
          <button
            key={product.id}
            onClick={() => handleAddToCart(product)}
            style={{
              padding: '10px 15px',
              background: '#E53935',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add {product.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestCart;