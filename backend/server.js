const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Exposer les logos en statique
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));
const multer = require('multer');
const http = require('http');
const { initializeWebSocket } = require('./websocket');
const port = process.env.PORT || 3001;

// Importer les routes
const programRoutes = require('./routes/programs');
const episodeRoutes = require('./routes/episodes');
const topicRoutes = require('./routes/topics');
const mediaRoutes = require('./routes/media');
const sceneRoutes = require('./routes/scene');
const settingsRoutes = require('./routes/settings');

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('Backend Girr Remake Fonctionne !');
});

// Utiliser les routes de l'API
app.use('/api/programs', programRoutes);
app.use('/api/programs/:programId/episodes', episodeRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics', topicRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics/:topicId/media', mediaRoutes);
app.use('/api/scene', sceneRoutes);
app.use('/api/settings', settingsRoutes);

// Démarrage du serveur
const server = http.createServer(app);
initializeWebSocket(server);
server.listen(port, () => {
  console.log(`Serveur backend démarré sur http://localhost:${port}`);
  console.log(`WebSocket disponible sur le même port`);
});
