import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SCENE_PRESETS = [
  { label: 'Début', color: '#4F8CFF' },
  { label: 'Pause', color: '#FFD166' },
  { label: 'Pub', color: '#EF476F' },
  { label: 'Fin', color: '#06D6A0' }
];

export default function LiveControlFooter() {
  const [scene, setScene] = useState({ name: '', lastChanged: null });
  const [custom, setCustom] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/scene')
      .then(r => r.json())
      .then(data => setScene(data));
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer style={{
      position:'fixed',left:0,right:0,bottom:0,zIndex:1000,
      background:'#232938',color:'#fff',
      boxShadow:'0 -2px 16px #0002',
      padding:'10px 18px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      gap:18,minHeight:64
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222'}} />
        <span style={{fontSize:14}}>
          WebSocket&nbsp;: {wsConnected ? 'connecté' : 'déconnecté'}
        </span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        {SCENE_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => changeScene(preset.label)}
            disabled={loading || scene.name === preset.label}
            style={{
              background:preset.color,
              color:'#222',fontWeight:600,fontSize:15,border:'none',
              borderRadius:7,padding:'8px 16px',cursor:loading||scene.name===preset.label?'not-allowed':'pointer',
              opacity:scene.name===preset.label?0.6:1,boxShadow:'0 1px 4px #0002'
            }}
          >
            {preset.label}
          </button>
        ))}
        <form onSubmit={e => {e.preventDefault(); if(custom.trim()) changeScene(custom.trim());}} style={{display:'flex',gap:6}}>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Scène personnalisée"
            style={{minWidth:90,padding:'7px 10px',borderRadius:6,border:'1px solid #bbb',fontSize:14}}
            disabled={loading}
          />
          <button type="submit" disabled={loading||!custom.trim()} style={{padding:'7px 14px',borderRadius:6,fontWeight:600,fontSize:14}}>
            {loading ? '...' : 'OK'}
          </button>
        </form>
      </div>
      <div style={{fontSize:17,fontWeight:700,color:'#FFD166',textShadow:'0 1px 4px #0007'}}>
        {scene.name || <i style={{color:'#ccc'}}>(aucune scène)</i>}
        <span style={{fontSize:13,color:'#bbb',marginLeft:12}}>
          {scene.lastChanged ? new Date(scene.lastChanged).toLocaleTimeString() : ''}
        </span>
        {success && <span style={{color:'#3c3',fontWeight:500,fontSize:13,marginLeft:10}}>{success}</span>}
      </div>
    </footer>
  );
}
