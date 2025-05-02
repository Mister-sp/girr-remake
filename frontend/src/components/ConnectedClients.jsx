/**
 * Composant affichant les clients connectés à l'application.
 * @module components/ConnectedClients
 */

import React, { useEffect, useState } from 'react';
import { getConnectedClients } from '../services/websocket';

/**
 * Affiche la liste des clients connectés avec leur statut.
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Classes CSS additionnelles
 * @param {boolean} [props.showDetails=false] - Afficher les détails des clients
 */
export default function ConnectedClients({ 
  className = '',
  showDetails = false 
}) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    // Initialiser avec les clients actuels
    setClients(getConnectedClients());

    // Écouter les mises à jour
    const handleClientsUpdate = (event) => {
      setClients(event.detail.clients || []);
    };

    window.addEventListener('clientsUpdate', handleClientsUpdate);
    return () => {
      window.removeEventListener('clientsUpdate', handleClientsUpdate);
    };
  }, []);

  // Compter les clients par type
  const obsCount = clients.filter(c => c.type?.includes('obs')).length;
  const controlCount = clients.filter(c => c.type === 'control').length;

  return (
    <div className={`connected-clients ${className}`}>
      <div className="client-counts">
        <span className="obs-count" title="Fenêtres OBS">
          🎥 {obsCount}
        </span>
        <span className="control-count" title="Interfaces de contrôle">
          🎮 {controlCount}
        </span>
      </div>

      {showDetails && clients.length > 0 && (
        <div className="client-details">
          <h4>Clients connectés :</h4>
          <ul>
            {clients.map(client => (
              <li key={client.id}>
                {client.type === 'control' ? '🎮' : '🎥'} {client.type}
                <span className="client-time">
                  {new Date(client.lastActive).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}