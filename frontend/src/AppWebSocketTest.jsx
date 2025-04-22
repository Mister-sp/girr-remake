import React, { useEffect, useState } from 'react';
import { connectWebSocket } from './services/websocket';

export default function AppWebSocketTest() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const socket = connectWebSocket();
    socket.on('hello', (data) => {
      setMessage(data.msg);
    });
    return () => {
      socket.off('hello');
    };
  }, []);
  return (
    <div style={{padding:20, background:'#f3f3f3', borderRadius:8, margin:20}}>
      <h2>Test WebSocket</h2>
      <div>Message du serveur : <b>{message}</b></div>
      <div style={{fontSize:13, color:'#888', marginTop:10}}>
        Pour tester la synchro temps réel, <b>ouvre cette page dans plusieurs onglets ou navigateurs</b>.<br/>
        Toute notification ou action WebSocket apparaîtra ici instantanément.<br/>
        (Astuce : Clic droit sur "Test WebSocket" &rarr; Ouvrir dans un nouvel onglet)
      </div>
    </div>
  );
}
