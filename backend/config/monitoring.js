/**
 * Configuration du monitoring et métriques Prometheus.
 * @module config/monitoring
 */

const promClient = require('prom-client');
const logger = require('./logger');

// Activation de la collecte des métriques par défaut de Node.js
promClient.collectDefaultMetrics();

/**
 * Registre des métriques Prometheus.
 * @type {Registry}
 */
const register = new promClient.Registry();

/**
 * Jauge pour le nombre de connexions WebSocket.
 * @type {Gauge}
 */
const wsConnectionsGauge = new promClient.Gauge({
  name: 'ws_connections_total',
  help: 'Nombre total de connexions WebSocket actives',
  registers: [register]
});

/**
 * Compteur pour le nombre de sujets.
 * @type {Counter}
 */
const topicsCounter = new promClient.Counter({
  name: 'topics_total',
  help: 'Nombre total de sujets créés',
  registers: [register]
});

/**
 * Compteur pour le nombre de médias.
 * @type {Counter}
 */
const mediaCounter = new promClient.Counter({
  name: 'media_total',
  help: 'Nombre total de médias ajoutés',
  registers: [register]
});

/**
 * Histogramme pour la durée des requêtes HTTP.
 * @type {Histogram}
 */
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
  registers: [register]
});

/**
 * Jauge pour l'utilisation mémoire.
 * @type {Gauge}
 */
const memoryUsageGauge = new promClient.Gauge({
  name: 'app_memory_usage_bytes',
  help: 'Utilisation mémoire de l\'application en bytes',
  registers: [register],
  collect() {
    const usage = process.memoryUsage();
    this.set(usage.heapUsed);
  }
});

/**
 * Middleware pour mesurer la durée des requêtes.
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
function measureRequestDuration(req, res, next) {
  const start = Date.now();
  
  // Capturer le status code à la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    // Logger les requêtes lentes (>500ms)
    if (duration > 500) {
      logger.warn('Requête lente détectée', {
        method: req.method,
        route,
        duration,
        statusCode: res.statusCode
      });
    }
  });

  next();
}

module.exports = {
  register,
  wsConnectionsGauge,
  topicsCounter,
  mediaCounter,
  httpRequestDuration,
  memoryUsageGauge,
  measureRequestDuration
};