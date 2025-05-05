/**
 * Service de gestion des connexions WebSocket.
 * @module services/websocket
 */

import { io } from 'socket.io-client';
import AuthService from './auth';
import TokenRefresher from './tokenRefresher';

let socket;
let clientId = null;
const connectedClients = new Map();
let broadcastChannel;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Établit une connexion WebSocket avec le serveur.
 * @returns {Object} Instance Socket.IO
 */
export function connectWebSocket() {
  if (!socket) {
    const getAuthObject = () => ({
      // Récupérer le token à chaque tentative de connexion pour avoir le plus récent
      token: AuthService.getToken()
    });

    socket = io({
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      path: '/socket.io',
      // Utiliser une fonction au lieu d'un objet statique pour que le token soit évalué à chaque reconnexion
      auth: getAuthObject
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
      // Réinitialiser le compteur de tentatives après une connexion réussie
      reconnectAttempts = 0;
      
      // Envoyer le type de client basé sur le pathname
      socket.emit('register', { 
        pathname: window.location.pathname,
        type: getClientType(window.location.pathname)
      });
    });

    // Amélioration de la gestion des erreurs de connexion
    socket.on('connect_error', (error) => {
      console.log('Erreur de connexion WebSocket:', error);
      reconnectAttempts++;
      
      if (error.message === 'Token expiré') {
        // Tenter de rafraîchir le token immédiatement
        TokenRefresher.refreshToken().then(success => {
          if (!success && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            // Si le rafraîchissement échoue et qu'on a atteint le nombre max de tentatives
            window.dispatchEvent(new CustomEvent('websocket-error', {
              detail: { error: 'Session expirée. Impossible de maintenir la connexion en temps réel.' }
            }));
          }
        });
      } else if (error.message === 'Authentification requise' || error.message === 'Token invalide') {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          // Notifier l'utilisateur après plusieurs échecs
          window.dispatchEvent(new CustomEvent('websocket-error', {
            detail: { error: 'Problème d\'authentification avec la connexion en temps réel.' }
          }));
        }
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        // Autres erreurs après plusieurs tentatives
        window.dispatchEvent(new CustomEvent('websocket-error', {
          detail: { error: `La connexion en temps réel a échoué: ${error.message}` }
        }));
      }
    });

    // Gestionnaire de déconnexion non prévue
    socket.on('disconnect', (reason) => {
      console.log('Déconnecté du WebSocket, raison:', reason);
      
      // Nettoyer les clients lors de la déconnexion
      connectedClients.clear();
      window.dispatchEvent(new CustomEvent('clientsUpdate', { 
        detail: { count: 0, clients: [] } 
      }));
      
      // Notifier l'utilisateur seulement si la déconnexion n'est pas intentionnelle
      if (reason === 'io server disconnect' || reason === 'transport close') {
        window.dispatchEvent(new CustomEvent('websocket-error', {
          detail: { error: 'La connexion en temps réel a été perdue.' }
        }));
      }
    });

    // Écouter l'événement de reconnexion demandée par l'utilisateur
    window.addEventListener('websocket-reconnect', () => {
      console.log('Tentative de reconnexion WebSocket demandée par l\'utilisateur');
      reconnectAttempts = 0;
      if (socket) {
        socket.disconnect();
        socket.connect();
      }
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
  reconnectAttempts = 0;
}
