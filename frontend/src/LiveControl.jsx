import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SCENE_PRESETS = [
  { label: 'Début', color: '#4F8CFF' },
  { label: 'Pause', color: '#FFD166' },
  { label: 'Pub', color: '#EF476F' },
  { label: 'Fin', color: '#06D6A0' }
];

export default function LiveControl() {
  const [scene, setScene] = useState({ name: '', lastChanged: null });
  const [custom, setCustom] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Charger la scène courante au montage
  useEffect(() => {
    fetch('http://localhost:3001/api/scene')
      .then(r => r.json())
      .then(data => setScene(data));
  }, []);

  // Connexion WebSocket et synchro temps réel
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('scene:update', data => {
      setScene(data);
      setSuccess('Scène MAJ en temps réel !');
      setTimeout(() => setSuccess(''), 1200);
    });
    return () => socket.disconnect();
  }, []);

  // Changement de scène (preset ou custom)
  const changeScene = async (name) => {
    setLoading(true);
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3001/api/scene', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Erreur lors de la modification');
      // La synchro WebSocket mettra à jour l'affichage
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding:24, maxWidth:500, margin:'30px auto', background:'#232938', borderRadius:14, boxShadow:'0 2px 16px #0002'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222'}} />
        <span style={{fontSize:13,color:'#fff'}}>
          WebSocket&nbsp;: {wsConnected ? 'connecté' : 'déconnecté'}
        </span>
      </div>
      <h2 style={{color:'#fff',marginBottom:16}}>Contrôle en direct</h2>
      <div style={{marginBottom:18,background:'#1118',padding:16,borderRadius:10,textAlign:'center'}}>
        <div style={{fontSize:18,color:'#FFD166',fontWeight:600,marginBottom:4}}>Scène en cours</div>
        <div style={{fontSize:26,fontWeight:700,color:'#fff',marginBottom:6}}>{scene.name || <i style={{color:'#ccc'}}>(aucune)</i>}</div>
        <div style={{fontSize:13,color:'#bbb'}}>
          Dernier changement : {scene.lastChanged ? new Date(scene.lastChanged).toLocaleString() : 'jamais'}
        </div>
      </div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',marginBottom:14}}>
        {SCENE_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => changeScene(preset.label)}
            disabled={loading || scene.name === preset.label}
            style={{
              background:preset.color,
              color:'#222',
              fontWeight:600,
              fontSize:16,
              border:'none',
              borderRadius:8,
              padding:'12px 24px',
              cursor:loading||scene.name===preset.label?'not-allowed':'pointer',
              opacity:scene.name===preset.label?0.6:1,
              boxShadow:'0 1px 4px #0002'
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <form onSubmit={e => {e.preventDefault(); if(custom.trim()) changeScene(custom.trim());}} style={{display:'flex',gap:8,justifyContent:'center',marginBottom:8}}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Scène personnalisée"
          style={{flex:1,minWidth:120,maxWidth:200,padding:'10px 12px',borderRadius:7,border:'1px solid #bbb',fontSize:15}}
          disabled={loading}
        />
        <button type="submit" disabled={loading||!custom.trim()} style={{padding:'10px 18px',borderRadius:7,fontWeight:600,fontSize:15}}>
          {loading ? '...' : 'Changer'}
        </button>
      </form>
      {success && <div style={{color:'#3c3',fontWeight:500,fontSize:14,textAlign:'center'}}>{success}</div>}
    </div>
  );
}
