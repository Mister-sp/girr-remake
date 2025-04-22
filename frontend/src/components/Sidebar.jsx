import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import defaultLogo from '../assets/default-logo.png';

export default function Sidebar({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 10px 0 10px' }}>
          {open && (
            <>
              <img src={defaultLogo} alt="Logo Girr Remake" style={{ height: 32, width: 'auto', marginRight: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#222', lineHeight: 1 }}>Girr Remake</span>
                <span style={{ fontSize: 10, color: '#444', fontWeight: 400, lineHeight: 1 }}>la régie refaite par Mister_SP</span>
              </div>
            </>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Réduire la barre latérale' : 'Ouvrir la barre latérale'}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#222', padding: 0, marginLeft: 'auto' }}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        {open && (
          <div className="sidebar-content">

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '0px' }}>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.1em' }}>🏠 Accueil</a>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📺 Programmes</a>
              <a href="/test-websocket" style={{ color: 'inherit', textDecoration: 'none' }}>🧪 WebSocket Test</a>
              <a href="/live-control" style={{ color: 'inherit', textDecoration: 'none' }}>🎛️ Live Control</a>
              <a href="/scene-test" style={{ color: 'inherit', textDecoration: 'none' }}>🧑‍💻 Test dev</a>
            </nav>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
