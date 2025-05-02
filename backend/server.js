/**
 * Serveur Express principal avec support WebSocket.
 * @module server
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const statusMonitor = require('express-status-monitor')();
const app = express();
const path = require('path');
const logger = require('./config/logger');
const monitoring = require('./config/monitoring');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const http = require('http');
const { initWebSocket } = require('./websocket');
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

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Exposer les logos en statique
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));

// Configuration express-status-monitor
app.use(statusMonitor);

// Morgan logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware de monitoring des requêtes
app.use(monitoring.measureRequestDuration);

// Route pour les métriques Prometheus
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

// Route pour le healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Middleware de logging pour toutes les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Middleware d'erreur
app.use((err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ error: 'Une erreur est survenue' });
});

// Middleware CORS et JSON
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('Backend Girr Remake Fonctionne !');
});

// Importer les routes
const programRoutes = require('./routes/programs');
const episodeRoutes = require('./routes/episodes');
const topicRoutes = require('./routes/topics');
const mediaRoutes = require('./routes/media');
const sceneRoutes = require('./routes/scene');
const settingsRoutes = require('./routes/settings');

// Utiliser les routes de l'API
app.use('/api/programs', programRoutes);
app.use('/api/programs/:programId/episodes', episodeRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics', topicRoutes);
app.use('/api/programs/:programId/episodes/:episodeId/topics/:topicId/media', mediaRoutes);
app.use('/api/scene', sceneRoutes);
app.use('/api/settings', settingsRoutes);

// Démarrage du serveur
const server = http.createServer(app);

// Dans la section WebSocket
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
