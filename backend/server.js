/**
 * Serveur Express principal avec support WebSocket.
 * @module server
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const statusMonitor = require('express-status-monitor')();
const compression = require('compression'); // <-- Ajouté
const NodeCache = require('node-cache'); // <-- Ajouté
const app = express();
const path = require('path');
const logger = require('./config/logger');
const monitoring = require('./config/monitoring');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const http = require('http');
const { initWebSocket } = require('./websocket');
const { authenticateToken } = require('./middleware/auth');
const { initializeDefaultUser } = require('./models/users');
const port = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FREMEN API Documentation',
      version: '1.0.0',
      description: 'Documentation API pour FREMEN (Flow de Régie d\'Écrans, de Médias, d\'Événements et de News)',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-production-url' : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

// Initialiser l'utilisateur par défaut
initializeDefaultUser().catch(err => {
  logger.error('Erreur lors de l\'initialisation de l\'utilisateur par défaut:', err);
});

// Initialiser le cache (TTL de 5 minutes par défaut)
const cache = new NodeCache({ stdTTL: 300 }); // <-- Ajouté

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Exposer les logos en statique
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));
app.use('/media', express.static(path.join(__dirname, 'public/media')));

// Configuration express-status-monitor
app.use(statusMonitor);

// Morgan logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware de monitoring des requêtes
app.use(monitoring.measureRequestDuration);

// Middleware CORS et JSON
app.use(cors());
app.use(express.json());
app.use(compression()); // <-- Ajouté : Activer la compression pour toutes les routes

// Route de test
app.get('/', (req, res) => {
  res.send('Backend Girr Remake Fonctionne !');
});

// Route pour les métriques Prometheus (non protégée car utilisée par Prometheus)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', monitoring.register.contentType);
    const metrics = await monitoring.register.metrics();
    res.end(metrics);
  } catch (err) {
    logger.error('Erreur lors de la génération des métriques:', err);
    res.status(500).send(err.message);
  }
});

// Route pour le healthcheck (non protégée car utilisée pour les vérifications de santé)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Importer les routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const episodeRoutes = require('./routes/episodes');
const topicRoutes = require('./routes/topics');
const mediaRoutes = require('./routes/media');
const sceneRoutes = require('./routes/scene');
const settingsRoutes = require('./routes/settings');
const apiTokensRoutes = require('./routes/apiTokens');

// Routes d'authentification (non protégées)
app.use('/api/auth', authRoutes);

// Toutes les autres routes API nécessitent une authentification

// Middleware de cache pour /api/programs
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);
  if (cachedResponse) {
    logger.info(`Cache hit for ${key}`);
    return res.json(cachedResponse);
  } else {
    logger.info(`Cache miss for ${key}`);
    // Remplacer res.json pour mettre en cache la réponse avant de l'envoyer
    const originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body);
      originalJson.call(res, body);
    };
    next();
  }
}; // <-- Ajouté

app.use('/api/programs', authenticateToken, cacheMiddleware, programRoutes); // <-- Modifié: Ajout du middleware de cache
app.use('/api/programs/:programId/episodes', authenticateToken, episodeRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics', authenticateToken, topicRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics/:topicId/media', authenticateToken, mediaRoutes);
app.use('/api/scene', authenticateToken, sceneRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/tokens', apiTokensRoutes); // Route pour la gestion des tokens API externes

// Middleware d'erreur
app.use((err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ error: 'Une erreur est survenue' });
});

// Démarrage du serveur
const server = http.createServer(app);

// Initialisation WebSocket
initWebSocket(server);

// Collecter les métriques initiales
monitoring.wsConnectionsGauge.set(0);
monitoring.topicsCounter.inc(0);
monitoring.mediaCounter.inc(0);

server.listen(port, () => {
  console.log(`Serveur backend démarré sur http://localhost:${port}`);
  console.log(`WebSocket disponible sur le même port`);
  console.log(`Monitoring disponible sur:`);
  console.log(`- Status: http://localhost:${port}/status`);
  console.log(`- Metrics: http://localhost:${port}/metrics`);
  console.log(`- Health: http://localhost:${port}/health`);
});
