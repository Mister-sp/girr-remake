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

      <h2 style={{marginBottom:24,color:'var(--text)'}}>Effets de transition</h2>

      <div style={cardStyle}>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <label style={labelStyle}>Effet d'apparition</label>
            <select 
              value={mediaEffects.appearEffect}
              onChange={(e) => setMediaEffects(prev => ({ ...prev, appearEffect: e.target.value }))}
              style={inputStyle}
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
          <div style={{textAlign:'center',color:'#4F8CFF',fontWeight:500,fontSize:14,marginTop:12}}>{success}</div>
        )}
      </div>
    </div>
  );
}
