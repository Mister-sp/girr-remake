import React from 'react';

export default function LowerThird({ title, subtitle }) {
  if (!title && !subtitle) return null;
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      zIndex: 100,
      pointerEvents: 'none',
      margin: 0,
      padding: 0,
    }}>
      <div style={{
        background: 'rgba(24,24,24,0.97)',
        borderRadius: 0,
        width: '100%',
        height: 'auto',
        padding: '16px 48px',
        fontSize: 32, fontWeight: 700,
        color: '#fff', letterSpacing: 1.2,
        boxShadow: '0 2px 32px #000a',
        borderTop: '2px solid #fff',
        borderBottom: '2px solid #fff',
        borderLeft: 0,
        borderRight: 0,
        display: 'block',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        margin: 0,
        boxSizing: 'border-box',
      }}>
        {title && <div>{title}</div>}
        {subtitle && <div style={{ fontSize: 22, fontWeight: 400, color: '#FFD166', marginTop: 4 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
