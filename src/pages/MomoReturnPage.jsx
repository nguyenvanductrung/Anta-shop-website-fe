// src/pages/MomoReturnPage.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function MomoReturnPage() {
  const q = useQuery();
  const orderId = q.get('orderId');

  useEffect(() => {
    // simulate success after 2.5s
    const t = setTimeout(() => {
      try {
        // notify opener (the checkout page)
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'MOMO_SUCCESS', orderId }, '*');
        }
      } catch (e) {
        // ignore
      }
      // close this tab after another short delay
      setTimeout(() => {
        try { window.close(); } catch (e) {}
      }, 700);
    }, 2500);

    return () => clearTimeout(t);
  }, [orderId]);

  return (
    <div style={{padding:20,fontFamily:'Arial, sans-serif'}}>
      <h2>Momo payment (simulated)</h2>
      <p>OrderId: {orderId}</p>
      <p>Đang giả lập hoàn tất thanh toán… tab này sẽ tự đóng trong vài giây.</p>
      <p>Nếu không tự động, bấm <button onClick={()=>{
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type:'MOMO_SUCCESS', orderId }, '*');
          }
          window.close();
        } catch(e){}
      }}>Simulate success</button></p>
    </div>
  );
}
