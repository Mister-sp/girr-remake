/**
 * Service de gestion des connexions WebSocket.
 * @module services/websocket
 */

import { io } from 'socket.io-client';

let socket;
let clientId = null;
const connectedClients = new Map();
let broadcastChannel;

/**
 * Établit une connexion WebSocket avec le serveur.
 * @returns {Object} Instance Socket.IO
 */
export function connectWebSocket() {
  if (!socket) {
    socket = io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      path: '/socket.io'
    });

    // Initialiser le BroadcastChannel une seule fois
    if (!broadcastChannel) {
      try {
        broadcastChannel = new BroadcastChannel('obs-sync');
      } catch (e) {
        console.warn('BroadcastChannel non supporté:', e);
      }
    }

    socket.on('connect', () => {
      console.log('Connecté au WebSocket, id:', socket.id);
      // Envoyer le type de client basé sur le pathname
      socket.emit('register', { 
        pathname: window.location.pathname,
        type: getClientType(window.location.pathname)
      });
    });

    socket.on('connect_error', (error) => {
      console.log('Erreur de connexion WebSocket:', error);
    });

    socket.on('hello', (data) => {
      console.log('Message du serveur WebSocket:', data);
      clientId = data.clientId;
      if (data.activeClients) {
        connectedClients.clear();
        data.activeClients.forEach(client => {
          connectedClients.set(client.id, client);
        });
      }
    });

    socket.on('clients:update', (data) => {
      console.log('Mise à jour des clients:', data);
      if (data.clients) {
        connectedClients.clear();
        data.clients.forEach(client => {
          connectedClients.set(client.id, client);
        });
      }
      // Déclencher un événement personnalisé pour informer l'interface
      window.dispatchEvent(new CustomEvent('clientsUpdate', { 
        detail: { 
          count: data.count || 0, 
          clients: Array.from(connectedClients.values()) 
        } 
      }));
    });

    socket.on('obs:status', (data) => {
      console.log('Mise à jour statut OBS:', data);
      window.dispatchEvent(new CustomEvent('obsStatusUpdate', { 
        detail: data 
      }));
    });

    socket.on('obs:update', (data) => {
      // Ignorer les mises à jour provenant de nous-mêmes
      if (data.sourceClientId === clientId) return;
      console.log('Mise à jour OBS reçue:', data);

      // Synchroniser avec les autres onglets via BroadcastChannel
      if (data.topic && broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: 'TOPIC_UPDATE',
            topic: {
              title: data.topic.title || data.title || '',
              programTitle: data.topic.programTitle || '',
              programLogo: data.topic.programLogo || data.logoUrl || '',
              episodeTitle: data.topic.episodeTitle || ''
            }
          });
        } catch (e) {
          console.warn('Erreur BroadcastChannel:', e);
        }
      }

      // Déclencher un événement personnalisé pour la mise à jour
      window.dispatchEvent(new CustomEvent('obsUpdate', { detail: data }));
    });

    socket.on('disconnect', () => {
      console.log('Déconnecté du WebSocket');
      // Nettoyer les clients lors de la déconnexion
      connectedClients.clear();
      window.dispatchEvent(new CustomEvent('clientsUpdate', { 
        detail: { count: 0, clients: [] } 
      }));
    });
  }
  return socket;
}

function getClientType(pathname) {
  switch (pathname) {
    case '/obs':
      return 'obs-full';
    case '/obs-media':
      return 'obs-media';
    case '/obs-titrage':
      return 'obs-titrage';
    default:
      return 'control';
  }
}

export function getSocket() {
  return socket;
}

/**
 * Obtient l'ID du client actuel.
 * @returns {string|null} ID du client
 */
export function getCurrentClientId() {
  return clientId;
}

/**
 * Obtient la liste des clients connectés.
 * @returns {Array} Liste des clients
 */
export function getConnectedClients() {
  return Array.from(connectedClients.values());
}

/**
 * Obtient le canal de broadcast pour la synchronisation multi-onglets.
 * @returns {BroadcastChannel|null} Canal de broadcast
 */
export function getBroadcastChannel() {
  return broadcastChannel;
}

/**
 * Nettoie les ressources WebSocket.
 * @returns {void}
 */
export function cleanup() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  connectedClients.clear();
  clientId = null;
}
