import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function SceneTest() {
  const [scene, setScene] = useState({ name: '', lastChanged: null });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  // Charger la scène courante au montage
  useEffect(() => {
    fetch('http://localhost:3001/api/scene')
      .then(r => r.json())
      .then(data => {
        setScene(data);
        setInput(data.name || '');
      });
  }, []);

  // Connexion WebSocket et écoute des updates (connexion propre par onglet)
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('scene:update', (data) => {
      setScene(data);
      setInput(data.name || '');
      setSuccess('Scène MAJ en temps réel !');
      setTimeout(() => setSuccess(''), 1500);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Modifier la scène
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3001/api/scene', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input })
      });
      if (!res.ok) throw new Error('Erreur lors de la modification');
      const data = await res.json();
      setScene(data);
      setSuccess('Scène modifiée !');
    } catch (err) {
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding:24, maxWidth:400, margin:'30px auto', background:'#f3f3f3', borderRadius:10}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222'}} />
        <span style={{fontSize:13,color:'#222'}}>
          WebSocket&nbsp;: {wsConnected ? 'connecté' : 'déconnecté'}
        </span>
      </div>
      <h2>Test API Scène</h2>
      <form onSubmit={handleSubmit} style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nom de la scène"
          style={{flex:1,padding:'8px 12px',borderRadius:6,border:'1px solid #bbb'}}
        />
        <button type="submit" disabled={loading} style={{padding:'8px 16px',borderRadius:6}}>
          {loading ? '...' : 'Changer'}
        </button>
      </form>
      <div style={{fontSize:14,color:'#333'}}>Scène actuelle : <b>{scene.name || <i>(aucune)</i>}</b></div>
      <div style={{fontSize:12,color:'#888',marginBottom:6}}>
        Dernier changement : {scene.lastChanged ? new Date(scene.lastChanged).toLocaleString() : 'jamais'}
      </div>
      {error && <div style={{color:'red',fontSize:13}}>{error}</div>}
      {success && <div style={{color:'green',fontSize:13}}>{success}</div>}
    </div>
  );
}
