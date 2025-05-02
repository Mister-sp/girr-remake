import React, { useState } from 'react';
import { FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
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
        className="sidebar-menu-item"
      >
        🛠️ Dev
      </button>
      {open && (
        <div>
          <a href="/test-websocket" className="sidebar-menu-item">🧪 WebSocket Test</a>
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
                <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1 }}>FREMEN</span>
                <span style={{ fontSize: 10, fontWeight: 400, lineHeight: 1, opacity: 0.7 }}>Tel Shai-Hulud, maîtrisez le stream</span>
              </div>
            </>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Réduire la barre latérale' : 'Ouvrir la barre latérale'}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        {open && (
          <div className="sidebar-content">
            <nav>
              <NavLink to="/" className="nav-link">
                🏠 Accueil
              </NavLink>
              
              <NavLink to="/control" className="nav-link">
                ⚙️ Paramètres
              </NavLink>

              <div className="nav-separator" />
              
              <div className="nav-section-title">Fenêtres OBS</div>
              <div className="nav-section">
                <button onClick={() => window.open('/obs', '_blank')} className="nav-link">
                  <ObsFullIcon style={{ width: 16, height: 16 }} />
                  <span>Média + Titrage</span>
                </button>
                <button onClick={() => window.open('/obs-media', '_blank')} className="nav-link">
                  <ObsMediaIcon style={{ width: 16, height: 16 }} />
                  <span>Média seul</span>
                </button>
                <button onClick={() => window.open('/obs-titrage', '_blank')} className="nav-link">
                  <ObsTitrageIcon style={{ width: 16, height: 16 }} />
                  <span>Titrage seul</span>
                </button>
              </div>

              <button onClick={onHelpClick} className="nav-link help-link">
                ❔ Aide & Raccourcis
              </button>

              <button
                onClick={toggleDarkMode}
                className="nav-link theme-toggle"
                title={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {darkMode ? (
                  <>
                    <FaSun style={{ fontSize: 16 }} />
                    <span>Mode clair</span>
                  </>
                ) : (
                  <>
                    <FaMoon style={{ fontSize: 16 }} />
                    <span>Mode sombre</span>
                  </>
                )}
              </button>
            </nav>

            <DevMenu />
          </div>
        )}
      </div>
    </>
  );
}
