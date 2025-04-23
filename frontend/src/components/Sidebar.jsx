import React, { useState } from 'react';

function DevMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Outils développeur"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span role="img" aria-label="Dev">🛠️</span>
        <span style={{ fontSize: 13 }}>Dev</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '100%',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: 6,
          zIndex: 10,
          minWidth: 170,
          marginTop: 4,
          padding: '8px 0',
        }}>
          <a href="/test-websocket" style={{ display: 'block', padding: '6px 20px', color: '#222', textDecoration: 'none', fontSize: 15 }}>🧪 WebSocket Test</a>
          <a href="/live-control" style={{ display: 'block', padding: '6px 20px', color: '#222', textDecoration: 'none', fontSize: 15 }}>🎛️ Live Control</a>
          <a href="/scene-test" style={{ display: 'block', padding: '6px 20px', color: '#222', textDecoration: 'none', fontSize: 15 }}>🧑‍💻 Test dev</a>
        </div>
      )}
    </div>
  );
}

import { FaBars, FaTimes } from 'react-icons/fa';
import defaultLogo from '../assets/default-logo.png';
import ObsFullIcon from '../icons/ObsFullIcon.jsx';
import ObsMediaIcon from '../icons/ObsMediaIcon.jsx';
import ObsTitrageIcon from '../icons/ObsTitrageIcon.jsx';

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

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '0px', marginBottom: 32 }}>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.1em' }}>🏠 Accueil</a>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📺 Programmes</a>
              
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 32, justifyContent: 'center' }}>
  <button title="Ouvrir OBS (media+titrage)" onClick={() => window.open('/obs', '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
    <ObsFullIcon style={{ width: 32, height: 32 }} />
  </button>
  <button title="Ouvrir OBS Media seul" onClick={() => window.open('/obs-media', '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
    <ObsMediaIcon style={{ width: 32, height: 32 }} />
  </button>
  <button title="Ouvrir OBS Titrage seul" onClick={() => window.open('/obs-titrage', '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
    <ObsTitrageIcon style={{ width: 32, height: 32 }} />
  </button>
</div>
<div style={{ marginTop: 16 }}>
  <DevMenu />
</div>
            </nav>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
