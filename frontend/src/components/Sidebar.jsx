import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Sidebar({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Réduire la barre latérale' : 'Ouvrir la barre latérale'}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
        {open && (
          <div className="sidebar-content">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
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
