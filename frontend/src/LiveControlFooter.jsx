import React, { useEffect, useState, useRef } from 'react';
import defaultLogo from './assets/default-logo.js';
import ObsPreview from './components/ObsPreview';
import { connectWebSocket, getConnectedClients, getBroadcastChannel, cleanup } from './services/websocket';

export default function LiveControlFooter() {
  const [currentInfo, setCurrentInfo] = useState({
    programTitle: '',
    programLogo: '',
    episodeTitle: '',
    topicTitle: ''
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState([]);
  const [obsStatuses, setObsStatuses] = useState({
    media: false,
    titrage: false
  });

  // Écoute des événements WebSocket et BroadcastChannel
  useEffect(() => {
    const socket = connectWebSocket();
    const channel = getBroadcastChannel();
    
    const handleConnect = () => {
      console.log('WebSocket connecté');
      setWsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('WebSocket déconnecté');
      setWsConnected(false);
      setConnectedClients([]);
    };
    
    const handleClientsUpdate = (data) => {
      console.log('Mise à jour clients:', data);
      if (data.clients) {
        setConnectedClients(data.clients);
      }
    };

    const handleObsStatus = (data) => {
      console.log('Mise à jour statut OBS:', data);
      setObsStatuses(data);
    };

    const handleTopicUpdate = (event) => {
      if (event.data?.type === 'TOPIC_UPDATE') {
        console.log('Mise à jour topic via BroadcastChannel:', event.data);
        setCurrentInfo({
          programTitle: event.data.topic.programTitle || '',
          programLogo: event.data.topic.programLogo || '',
          episodeTitle: event.data.topic.episodeTitle || '',
          topicTitle: event.data.topic.title || ''
        });
      }
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('clients:update', handleClientsUpdate);
    socket.on('obs:status', handleObsStatus);

    if (channel) {
      channel.addEventListener('message', handleTopicUpdate);
    }

    // Initialisation des clients connectés
    const initialClients = getConnectedClients();
    if (initialClients.length > 0) {
      setConnectedClients(initialClients);
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('clients:update', handleClientsUpdate);
      socket.off('obs:status', handleObsStatus);
      if (channel) {
        channel.removeEventListener('message', handleTopicUpdate);
      }
      cleanup();
    };
  }, []);

  // Comptage des clients par type
  const obsViewers = connectedClients.filter(c => c.type?.includes('obs')).length;
  const controlViewers = connectedClients.filter(c => c.type === 'control').length;

  // Ouvrir une fenêtre OBS
  const openObsWindow = (type) => {
    const width = 1920;
    const height = 1080;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      `/${type}`, 
      `OBS_${type}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
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
      {/* Colonne gauche : boutons OBS + statuts */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => openObsWindow('obs')} 
            style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>
            Média + Titrage
          </button>
          <span style={{
            width:8,
            height:8,
            borderRadius:'50%',
            background: obsStatuses.media && obsStatuses.titrage ? '#3c3' : '#666',
            marginLeft:4
          }} title="Statut de diffusion" />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => openObsWindow('obs-media')} 
            style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>
            Média seul
          </button>
          <span style={{
            width:8,
            height:8,
            borderRadius:'50%',
            background: obsStatuses.media ? '#3c3' : '#666',
            marginLeft:4
          }} title="Statut de diffusion" />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => openObsWindow('obs-titrage')} 
            style={{padding:'5px 8px',background:'#333',color:'#fff',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',width:120,textAlign:'left'}}>
            Titrage seul
          </button>
          <span style={{
            width:8,
            height:8,
            borderRadius:'50%',
            background: obsStatuses.titrage ? '#3c3' : '#666',
            marginLeft:4
          }} title="Statut de diffusion" />
        </div>
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

      {/* Droite : preview OBS + statut WebSocket + clients connectés */}
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
        <div style={{
          width: 160,
          height: 90,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ObsPreview 
            width={160} 
            height={90}
            current={{
              title: currentInfo.topicTitle || '',
              subtitle: currentInfo.programTitle || '',
              logoUrl: currentInfo.programLogo,
              program: currentInfo.programTitle,
              episode: currentInfo.episodeTitle
            }}
          />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,fontSize:13,color:'#bbb',minWidth:120,justifyContent:'flex-end'}}>
          <span style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12}}>🎥</span>
            <span>{obsViewers} OBS</span>
          </span>
          <span style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12}}>🎮</span>
            <span>{controlViewers} Control</span>
          </span>
          <span style={{width:12,height:12,borderRadius:'50%',background:wsConnected?'#3c3':'#f44',display:'inline-block',border:'1px solid #222'}} />
        </div>
      </div>
    </footer>
  );
}
