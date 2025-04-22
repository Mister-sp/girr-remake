import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000,
      background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, maxWidth: '90vw', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', position: 'relative',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#333' }}>×</button>
        {children}
      </div>
    </div>
  );
}
