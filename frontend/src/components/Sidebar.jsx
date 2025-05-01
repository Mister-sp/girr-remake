import React, { useState } from 'react';
import { FaBars, FaTimes, FaCog } from 'react-icons/fa';
import { FiHelpCircle } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import defaultLogo from '../assets/default-logo.png';
import ObsFullIcon from '../icons/ObsFullIcon.jsx';
import ObsMediaIcon from '../icons/ObsMediaIcon.jsx';
import ObsTitrageIcon from '../icons/ObsTitrageIcon.jsx';

function DevMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 'auto', paddingBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '8px 20px', border: 'none', background: 'none', color: '#666', fontSize: 15, textAlign: 'left', cursor: 'pointer' }}
      >
        🛠️ Dev
      </button>
      {open && (
        <div>
          <a href="/test-websocket" style={{ display: 'block', padding: '6px 20px', color: '#222', textDecoration: 'none', fontSize: 15 }}>🧪 WebSocket Test</a>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ darkMode, toggleDarkMode, onHelpClick }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 10px 0 10px' }}>
          {open && (
            <>
              <img src={defaultLogo} alt="Logo Girr Remake" style={{ height: 32, width: 'auto', marginRight: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#222', lineHeight: 1 }}>FREMEN</span>
                <span style={{ fontSize: 10, color: '#444', fontWeight: 400, lineHeight: 1 }}>Tel Shai-Hulud, maîtrisez le stream</span>
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
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', marginBottom: 32 }}>
              <a href="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.1em' }}>🏠 Accueil</a>
              
              <div>
                <NavLink to="/control" style={{ color: '#4F8CFF', textDecoration: 'none', fontSize: '1.1em', fontWeight: 500 }} className={({ isActive }) => isActive ? 'active' : ''}>
                  <FaCog style={{ fontSize: 18 }} />
                  <span>Paramètres</span>
                </NavLink>
              </div>

              <div style={{ height: 1, background: '#e1e1e1', margin: '8px 0' }} />
              <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📺 Programmes</a>

              <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8, paddingLeft: 20 }}>Fenêtres OBS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => window.open('/obs', '_blank')} 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 20px', color: '#222' }}>
                    <ObsFullIcon style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>Média + Titrage</span>
                  </button>
                  <button onClick={() => window.open('/obs-media', '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 20px', color: '#222' }}>
                    <ObsMediaIcon style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>Média seul</span>
                  </button>
                  <button onClick={() => window.open('/obs-titrage', '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 20px', color: '#222' }}>
                    <ObsTitrageIcon style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>Titrage seul</span>
                  </button>
                </div>
              </div>

              <button
                onClick={onHelpClick}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px 20px', 
                  color: '#222',
                  fontSize: '1.1em',
                  marginTop: 16
                }}
              >
                <FiHelpCircle style={{ fontSize: 18 }} />
                <span>Aide & Raccourcis</span>
              </button>

              <DevMenu />
            </nav>

            <div className="icon-group" style={{ marginBottom: 12 }}>
              <a href="/settings" title="Paramètres" className="icon-button">
                <span className="icon">⚙️</span>
                Paramètres
              </a>
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 12 }}>
              <button
                onClick={toggleDarkMode}
                style={{ width: '100%', padding: '8px 20px', border: 'none', background: 'none', color: '#666', fontSize: 15, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {darkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
              </button>
              <DevMenu />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
