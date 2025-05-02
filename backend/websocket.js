// websocket.js
const http = require('http');
const socketio = require('socket.io');
const { wsConnectionsGauge } = require('./config/monitoring');

let io;
const connectedClients = new Map();

function updateObsStatus() {
  const obsClients = Array.from(connectedClients.values()).filter(c => c.type?.includes('obs'));
  const mediaActive = obsClients.some(c => c.type === 'obs-media' || c.type === 'obs-full');
  const titrageActive = obsClients.some(c => c.type === 'obs-titrage' || c.type === 'obs-full');
  
  io.emit('obs:status', {
    media: mediaActive,
    titrage: titrageActive
  });
}

function initWebSocket(server) {
  io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion WebSocket :', socket.id);
    wsConnectionsGauge.inc(); // Incrémenter le compteur de connexions
    
    // Identifier le type de client basé sur le pathname
    socket.on('register', ({ pathname }) => {
      let type = 'control';
      if (pathname === '/obs') type = 'obs-full';
      else if (pathname === '/obs-media') type = 'obs-media';
      else if (pathname === '/obs-titrage') type = 'obs-titrage';
      
      // Ajouter le client à notre Map
      connectedClients.set(socket.id, {
        id: socket.id,
        type,
        lastActive: Date.now()
      });

      // Informer tous les clients des connexions
      io.emit('clients:update', {
        count: connectedClients.size,
        clients: Array.from(connectedClients.values())
      });

      // Mettre à jour le statut OBS
      updateObsStatus();
    });

    socket.emit('hello', { 
      msg: 'Connexion WebSocket réussie !',
      clientId: socket.id,
      activeClients: Array.from(connectedClients.values())
    });

    // RELAY obs:update avec timestamp
    socket.on('obs:update', (data) => {
      const timestamp = Date.now();
      const enhancedData = {
        ...data,
        timestamp,
        sourceClientId: socket.id
      };
      console.log('[SOCKET.IO] Reçu obs:update de', socket.id, enhancedData);
      io.emit('obs:update', enhancedData);
      
      // Mettre à jour le lastActive du client
      const client = connectedClients.get(socket.id);
      if (client) {
        client.lastActive = timestamp;
      }
    });

    // Gérer la déconnexion
    socket.on('disconnect', () => {
      console.log('Déconnexion WebSocket :', socket.id);
      wsConnectionsGauge.dec(); // Décrémenter le compteur de connexions
      connectedClients.delete(socket.id);
      io.emit('clients:update', {
        count: connectedClients.size,
        clients: Array.from(connectedClients.values())
      });
      updateObsStatus();
    });
  });
}

function getIO() {
  if (!io) throw new Error('WebSocket non initialisé');
  return io;
}

module.exports = { initWebSocket, getIO };
