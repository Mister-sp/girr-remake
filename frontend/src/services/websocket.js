// src/services/websocket.js
import { io } from 'socket.io-client';

let socket;

export function connectWebSocket() {
  if (!socket) {
    socket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });
    socket.on('connect', () => {
      console.log('Connecté au WebSocket, id:', socket.id);
    });
    socket.on('hello', (data) => {
      console.log('Message du serveur WebSocket:', data);
    });
    socket.on('disconnect', () => {
      console.log('Déconnecté du WebSocket');
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}
