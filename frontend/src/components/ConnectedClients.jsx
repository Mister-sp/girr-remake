import React, { useState, useEffect } from 'react';
import { getConnectedClients, getCurrentClientId } from '../services/websocket';

export default function ConnectedClients() {
  const [clients, setClients] = useState(getConnectedClients());
  const currentClientId = getCurrentClientId();

  useEffect(() => {
    const handleClientsUpdate = (event) => {
      setClients(event.detail.clients);
    };

    window.addEventListener('clientsUpdate', handleClientsUpdate);
    return () => {
      window.removeEventListener('clientsUpdate', handleClientsUpdate);
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontSize: '12px',
      zIndex: 1000,
      display: 'none'  // On cache ce composant car il est remplacé par l'info dans le footer
    }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {clients.map(client => (
          <li key={client.id} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: client.id === currentClientId ? '#4CAF50' : '#2196F3',
              marginRight: '8px'
            }} />
            <span>
              {client.id === currentClientId ? 'Vous' : client.type || `Client ${client.id.slice(0, 6)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}