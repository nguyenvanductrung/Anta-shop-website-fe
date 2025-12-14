//src/components/GlobalLoader.jsx
import React from 'react';

export default function GlobalLoader({ show, text = 'Đang xử lý...' }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', left:0, top:0, right:0, bottom:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.35)', zIndex: 9999
    }}>
      <div style={{padding:20, borderRadius:8, background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', minWidth:200}}>
        <div style={{width:48, height:48, border:'5px solid #eee', borderTop:'5px solid #e11', borderRadius:'50%', animation:'spin 1s linear infinite'}} />
        <div style={{marginTop:12, fontWeight:600}}>{text}</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
