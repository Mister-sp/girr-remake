// websocket.js
const http = require('http');
const socketio = require('socket.io');

let io;

function initWebSocket(server) {
  io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion WebSocket :', socket.id);
    socket.emit('hello', { msg: 'Connexion WebSocket réussie !' });
    // Ici, tu pourras ajouter d'autres events plus tard
    socket.on('disconnect', () => {
      console.log('Déconnexion WebSocket :', socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error('WebSocket non initialisé');
  return io;
}

module.exports = { initWebSocket, getIO };
