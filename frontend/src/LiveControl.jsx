import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TRANSITION_EFFECTS = [
  { label: 'Fondu', value: 'fade' },
  { label: 'Glissement', value: 'slide' },
  { label: 'Échelle', value: 'scale' },
  { label: 'Retournement', value: 'flip' },
  { label: 'Aucun', value: 'none' }
];

const cardStyle = {
  background: 'var(--background-lighter)',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  color: 'var(--text)',
  fontSize: 14
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 4,
  background: 'var(--input-background)',
  color: 'var(--text)'
};

const buttonStyle = {
  width: '100%',
  marginTop: 16,
  padding: '10px',
  background: '#4F8CFF',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  ':hover': {
    background: '#3E7BFF'
  },
  ':disabled': {
    background: '#ccc',
    cursor: 'not-allowed'
  }
};

export default function LiveControl() {
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [mediaEffects, setMediaEffects] = useState({
    appearEffect: 'fade',
    disappearEffect: 'fade'
  });

  useEffect(() => {
    // Initialiser la connexion WebSocket
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    
    // Écouter les mises à jour des paramètres
    socket.on('settings:transitions:update', (data) => {
      setMediaEffects({
        appearEffect: data.appearEffect || 'fade',
        disappearEffect: data.disappearEffect || 'fade'
      });
    });

    // Charger les paramètres initiaux
    fetch('http://localhost:3001/api/scene')
      .then(res => res.json())
      .then(data => {
        setMediaEffects({
          appearEffect: data.appearEffect || 'fade',
          disappearEffect: data.disappearEffect || 'fade'
        });
      })
      .catch(console.error);

    return () => socket.disconnect();
  }, []);

  // Mise à jour des effets de transition
  const updateTransitionEffects = async () => {
    try {
      setLoading(true);
      setSuccess('');
      setError('');
      
      const res = await fetch('http://localhost:3001/api/scene', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mediaAppearEffect: mediaEffects.appearEffect,
          mediaDisappearEffect: mediaEffects.disappearEffect
        })
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour des effets');
      }

      setSuccess('Les effets ont été mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setSuccess('Erreur lors de la mise à jour des effets');
    } finally {
      setLoading(false);
    }
  };

  // Export de la configuration
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/settings/export');
      if (!response.ok) throw new Error('Erreur lors de l\'export');
      
      const jsonData = await response.json();
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fremen-config.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Configuration exportée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError('Erreur lors de l\'export de la configuration');
    } finally {
      setLoading(false);
    }
  };

  // Import de la configuration
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        setError('');
        const config = JSON.parse(e.target.result);
        const response = await fetch('http://localhost:3001/api/settings/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config)
        });

        if (!response.ok) throw new Error('Erreur lors de l\'import');

        setSuccess('Configuration importée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        // Recharger la page pour voir les changements
        window.location.reload();
      } catch (err) {
        console.error('Erreur lors de l\'import:', err);
        setError('Erreur lors de l\'import de la configuration');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{padding: '20px', maxWidth: 800, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16}}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: wsConnected ? '#4CAF50' : '#F44336'
        }} />
        <span style={{fontSize: 14, color: 'var(--text-light)'}}>
          {wsConnected ? 'Connecté au serveur' : 'Déconnecté du serveur'}
        </span>
      </div>

      <div style={{...cardStyle, marginBottom: 20}}>
        <h2 style={{marginTop: 0, marginBottom: 24, color: 'var(--text)'}}>Export/Import de la configuration</h2>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Export...' : 'Exporter la configuration'}
          </button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{display: 'none'}}
              id="import-config"
              disabled={loading}
            />
            <label
              htmlFor="import-config"
              style={{
                padding: '10px 20px',
                background: '#2196F3',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Import...' : 'Importer une configuration'}
            </label>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{marginTop: 0, marginBottom: 24, color: 'var(--text)'}}>Effets de transition</h2>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <label style={labelStyle}>Effet d'apparition</label>
            <select 
              value={mediaEffects.appearEffect}
              onChange={(e) => setMediaEffects(prev => ({ ...prev, appearEffect: e.target.value }))}
              style={inputStyle}
              disabled={loading}
            >
              {TRANSITION_EFFECTS.map(effect => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>

          <div style={{flex:1}}>
            <label style={labelStyle}>Effet de disparition</label>
            <select
              value={mediaEffects.disappearEffect}
              onChange={(e) => setMediaEffects(prev => ({ ...prev, disappearEffect: e.target.value }))}
              style={inputStyle}
              disabled={loading}
            >
              {TRANSITION_EFFECTS.map(effect => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={updateTransitionEffects}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Mise à jour...' : 'Appliquer les effets'}
        </button>
        
        {success && (
          <div style={{textAlign:'center', color:'#4CAF50', fontWeight:500, fontSize:14, marginTop:12}}>{success}</div>
        )}
      </div>
    </div>
  );
}
