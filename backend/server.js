const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const multer = require('multer');
const port = process.env.PORT || 3001;

// Importer les routes
const programRoutes = require('./routes/programs');
// Importer les autres niveaux de routes
const episodeRoutes = require('./routes/episodes');
const topicRoutes = require('./routes/topics');
const mediaRoutes = require('./routes/media');

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('Backend Girr Remake Fonctionne !');
});

// Utiliser les routes de l'API

// Monter chaque routeur directement sur l'app avec le chemin complet
app.use('/api/programs', programRoutes);
app.use('/api/programs/:programId/episodes', episodeRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics', topicRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics/:topicId/media', mediaRoutes);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend démarré sur http://localhost:${port}`);
});
