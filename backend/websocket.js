/**
 * Configuration et gestion des connexions WebSocket.
 * @module websocket
 */

const { Server } = require('socket.io');
const { wsConnectionsGauge } = require('./config/monitoring');
const logger = require('./config/logger');
const jwt = require('jsonwebtoken');
const authConfig = require('./config/auth');

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
    path: '/socket.io',
    perMessageDeflate: { // <-- Ajouté : Activer la compression
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024, // Size (in bytes) below which messages
                       // should not be compressed.
    }
  });

  // Middleware d'authentification WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentification requise'));
    }

    try {
      const user = jwt.verify(token, authConfig.jwtSecret);
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Token invalide'));
    }
  });

  io.on('connection', socket => {
    logger.info(`Client WebSocket connecté: ${socket.id} (User: ${socket.user.username})`);
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
        username: socket.user.username,
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
      // Ajouter l'ID du client source et les infos utilisateur
      const updateData = {
        ...data,
        sourceClientId: socket.id,
        username: socket.user.username,
        timestamp: Date.now()
      };

      // Logger la mise à jour
      logger.info('Mise à jour OBS:', updateData);

      // Broadcaster aux autres clients
      socket.broadcast.emit('obs:update', updateData);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      logger.info(`Client WebSocket déconnecté: ${socket.id} (User: ${socket.user.username})`);
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
