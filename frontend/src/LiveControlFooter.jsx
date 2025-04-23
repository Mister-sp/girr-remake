import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SCENE_PRESETS = [
  { label: 'Début', color: '#4F8CFF' },
  { label: 'Pause', color: '#FFD166' },
  { label: 'Pub', color: '#EF476F' },
  { label: 'Fin', color: '#06D6A0' }
];

export default function LiveControlFooter() {
  const [obsPreviewUrl, setObsPreviewUrl] = useState('/obs');
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
      {/* Colonne OBS : boutons pour changer l'aperçu */}
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontWeight:600,marginRight:8}}>OBS :</span>
        <button onClick={() => setObsPreviewUrl('/obs')} style={{marginRight:4,padding:'7px 12px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:14,cursor:'pointer'}}>Média + Titrage</button>
        <button onClick={() => setObsPreviewUrl('/obs-media')} style={{marginRight:4,padding:'7px 12px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:14,cursor:'pointer'}}>Média seul</button>
        <button onClick={() => setObsPreviewUrl('/obs-titrage')} style={{padding:'7px 12px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:14,cursor:'pointer'}}>Titrage seul</button>
      </div>
      {/* Colonne 1 : état WebSocket */}
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222'}} />
        <span style={{fontSize:14}}>
          WebSocket&nbsp;: {wsConnected ? 'connecté' : 'déconnecté'}
        </span>
      </div>

      {/* Colonne 3 : nom de la scène */}
      <div style={{fontSize:17,fontWeight:700,color:'#FFD166',textShadow:'0 1px 4px #0007'}}>
        {scene.name || <i style={{color:'#ccc'}}>(aucune scène)</i>}
        <span style={{fontSize:13,color:'#bbb',marginLeft:12}}>
          {scene.lastChanged ? new Date(scene.lastChanged).toLocaleTimeString() : ''}
        </span>
        {success && <span style={{color:'#3c3',fontWeight:500,fontSize:13,marginLeft:10}}>{success}</span>}
      </div>
      {/* Aperçu OBS en bas à droite, hors du flux principal mais dans le footer */}
      <div style={{
        position: 'fixed',
        right: 24,
        bottom: 88,
        zIndex: 1200,
        boxShadow: '0 2px 12px #0008',
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #3399ff',
        width: 320,
        height: 180,
        aspectRatio: '16/9',
        background: '#222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <iframe
          src={obsPreviewUrl}
          title="Aperçu OBS"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#222',
            pointerEvents: 'none', // évite les clics dans l'aperçu
          }}
          allow="autoplay; encrypted-media"
        />
      </div>
    </footer>
  );
}
