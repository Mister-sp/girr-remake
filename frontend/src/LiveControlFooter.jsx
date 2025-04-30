import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import defaultLogo from './assets/default-logo.js';
import ObsPreview from './components/ObsPreview';

export default function LiveControlFooter() {
  // Canal de synchronisation multi-onglets OBS
  const obsSyncChannel = React.useRef(null);
  React.useEffect(() => {
    obsSyncChannel.current = new window.BroadcastChannel('obs-sync');
    return () => obsSyncChannel.current && obsSyncChannel.current.close();
  }, []);

  // Nouvel état pour le topic et le programme courant (reçus via BroadcastChannel)
  const [currentInfo, setCurrentInfo] = useState({
    programTitle: '',
    programLogo: '',
    episodeTitle: '',
    topicTitle: ''
  });
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!obsSyncChannel.current) return;
    const handler = (event) => {
      if (event.data && event.data.type === 'TOPIC_UPDATE') {
        setCurrentInfo({
          programTitle: event.data.topic.programTitle || '',
          programLogo: event.data.topic.programLogo || '',
          episodeTitle: event.data.topic.episodeTitle || '',
          topicTitle: event.data.topic.title || ''
        });
      }
    };
    obsSyncChannel.current.addEventListener('message', handler);
    return () => obsSyncChannel.current.removeEventListener('message', handler);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    return () => socket.disconnect();
  }, []);

  return (
    <footer style={{
      position:'fixed',left:0,right:0,bottom:0,zIndex:1000,
      background:'#232938',color:'#fff',
      boxShadow:'0 -2px 16px #0002',
      padding:'4px 10px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      gap:10,minHeight:44
    }}>
      {/* Colonne gauche : boutons OBS */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6}}>
        <button onClick={() => window.open('/obs', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Média + Titrage</button>
        <button onClick={() => window.open('/obs-media', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Média seul</button>
        <button onClick={() => window.open('/obs-titrage', '_blank')} style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>Titrage seul</button>
      </div>

      {/* Centre : logo + nom programme + topic */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:16,minWidth:0}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:0}}>
          <img
            src={currentInfo.programLogo ? (currentInfo.programLogo.startsWith('http') ? currentInfo.programLogo : `http://localhost:3001${currentInfo.programLogo}`) : defaultLogo}
            alt="Logo programme"
            style={{width:36,height:36,objectFit:'contain',marginBottom:4,borderRadius:6}}
          />
          <div style={{color:'#aaa',fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:200,textAlign:'center'}}>
            {currentInfo.programTitle || 'Aucun programme'}
          </div>
        </div>
        {currentInfo.topicTitle && (
          <div style={{fontSize:15,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:400,textAlign:'center'}}>
            {currentInfo.topicTitle}
          </div>
        )}
      </div>

      {/* Droite : preview OBS + statut WebSocket */}
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
        <div style={{width:160,height:90,borderRadius:6,overflow:'hidden',backgroundColor:'#000'}}>
          <ObsPreview width={160} height={90} />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#bbb',minWidth:120,justifyContent:'flex-end'}}>
          <span style={{width:12,height:12,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222',marginRight:7}} />
          <span>{wsConnected ? 'WebSocket OK' : 'WebSocket HS'}</span>
        </div>
      </div>
    </footer>
  );
}
