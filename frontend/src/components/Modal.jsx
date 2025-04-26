import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000,
      background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 48, minWidth: 520, maxWidth: '98vw', minHeight: 480, maxHeight: '96vh', boxShadow: '0 4px 32px rgba(0,0,0,0.22)', position: 'relative',
        overflowY: 'auto', overflowX: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', color: '#333', zIndex: 2 }}>×</button>
        <div style={{flex:1, minWidth:360}}>
          {children}
        </div>
      </div>
    </div>
  );
}
