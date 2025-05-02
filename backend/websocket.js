/**
 * Configuration et gestion des connexions WebSocket.
 * @module websocket
 */

const { Server } = require('socket.io');
const { wsConnectionsGauge } = require('./config/monitoring');
const logger = require('./config/logger');

let io = null;
const clients = new Map();

/**
 * Initialise le serveur WebSocket.
 * @param {Object} server - Instance du serveur HTTP
 */
function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  io.on('connection', socket => {
    logger.info(`Client WebSocket connecté: ${socket.id}`);
    wsConnectionsGauge.inc();

    /**
     * Configuration initiale du client.
     * @param {Object} data - Données d'enregistrement
     * @param {string} data.pathname - Chemin de la page
     * @param {string} data.type - Type de client (control, obs, etc)
     */
    socket.on('register', (data) => {
      const clientId = socket.id;
      clients.set(clientId, {
        id: clientId,
        type: getClientType(data.pathname),
        lastActive: Date.now()
      });

      // Envoyer l'état actuel au client
      socket.emit('hello', {
        clientId,
        activeClients: Array.from(clients.values())
      });

      // Notifier tous les clients de la mise à jour
      broadcastClientsUpdate();
    });

    /**
     * Mise à jour de l'affichage OBS.
     * @param {Object} data - Données de mise à jour
     */
    socket.on('obs:update', (data) => {
      // Ajouter l'ID du client source
      const updateData = {
        ...data,
        sourceClientId: socket.id,
        timestamp: Date.now()
      };

      // Logger la mise à jour
      logger.info('Mise à jour OBS:', updateData);

      // Broadcaster aux autres clients
      socket.broadcast.emit('obs:update', updateData);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      logger.info(`Client WebSocket déconnecté: ${socket.id}`);
      clients.delete(socket.id);
      wsConnectionsGauge.dec();
      broadcastClientsUpdate();
    });
  });
}

/**
 * Détermine le type de client basé sur le chemin.
 * @param {string} pathname - Chemin de la page
 * @returns {string} Type de client
 * @private
 */
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

/**
 * Notifie tous les clients de la mise à jour de la liste.
 * @private
 */
function broadcastClientsUpdate() {
  if (!io) return;
  io.emit('clients:update', {
    count: clients.size,
    clients: Array.from(clients.values())
  });
}

/**
 * Obtient l'instance Socket.IO.
 * @returns {Object|null} Instance Socket.IO
 */
function getIO() {
  return io;
}

module.exports = {
  initWebSocket,
  getIO
};
