const promClient = require('prom-client');
const logger = require('./logger');

// Création du registre Prometheus
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Métriques personnalisées
const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Durée des requêtes HTTP',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const wsConnectionsGauge = new promClient.Gauge({
    name: 'ws_connections_total',
    help: 'Nombre de connexions WebSocket actives'
});

const topicsCounter = new promClient.Counter({
    name: 'topics_created_total',
    help: 'Nombre total de sujets créés'
});

const mediaCounter = new promClient.Counter({
    name: 'media_items_total',
    help: 'Nombre total de médias gérés'
});

// Enregistrer les métriques
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(wsConnectionsGauge);
register.registerMetric(topicsCounter);
register.registerMetric(mediaCounter);

// Middleware pour mesurer la durée des requêtes
const measureRequestDuration = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationSeconds = duration[0] + duration[1] / 1e9;
        
        httpRequestDurationMicroseconds
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(durationSeconds);
    });
    
    next();
};

// Fonction pour collecter les métriques de mémoire
const collectMemoryMetrics = () => {
    const used = process.memoryUsage();
    logger.info('Métriques mémoire', {
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
        rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`
    });
};

// Démarrer la collecte périodique des métriques mémoire
setInterval(collectMemoryMetrics, 5 * 60 * 1000); // Toutes les 5 minutes

module.exports = {
    register,
    measureRequestDuration,
    wsConnectionsGauge,
    topicsCounter,
    mediaCounter
};