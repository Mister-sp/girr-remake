import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SCENE_PRESETS = [
  { label: 'Début', color: '#4F8CFF' },
  { label: 'Pause', color: '#FFD166' },
  { label: 'Pub', color: '#EF476F' },
  { label: 'Fin', color: '#06D6A0' }
];

export default function LiveControlFooter() {
  // Canal de synchronisation multi-onglets OBS
  const obsSyncChannel = React.useRef(null);
  React.useEffect(() => {
    obsSyncChannel.current = new window.BroadcastChannel('obs-sync');
    return () => obsSyncChannel.current && obsSyncChannel.current.close();
  }, []);
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
      padding:'4px 10px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      gap:10,minHeight:44
    }}>
      {/* Colonne gauche : boutons OBS en colonne + statut WebSocket */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6}}>
        <button onClick={() => window.open('/obs', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Média + Titrage</button>
        <button onClick={() => window.open('/obs-media', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Média seul</button>
        <button onClick={() => window.open('/obs-titrage', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Titrage seul</button>
      </div>



      {/* Aperçu OBS intégré à droite du footer + statut WebSocket dessous */}
      <div style={{marginLeft: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <iframe
          src="/obs"
          title="Aperçu OBS"
          style={{
            width: 220,
            height: 124,
            border: '2px solid #3399ff',
            borderRadius: 10,
            background: '#222',
            marginLeft: 12,
            boxShadow: '0 2px 12px #0004',
            pointerEvents: 'none',
            aspectRatio: '16/9',
          }}
          allow="autoplay; encrypted-media"
        />
        <div style={{marginTop: 6, display: 'flex', alignItems: 'center', fontSize: 13, color: wsConnected ? '#3c3' : '#f44', fontWeight: 500}}>
          <span style={{width:12,height:12,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222',marginRight:7}} />
          <span>{wsConnected ? 'WebSocket OK' : 'WebSocket HS'}</span>
        </div>
      </div>
    </footer>
  );
}
