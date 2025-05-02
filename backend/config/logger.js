/**
 * Configuration du système de logging.
 * @module config/logger
 */

const winston = require('winston');
const path = require('path');

/**
 * Configuration des niveaux de log personnalisés.
 * @type {Object}
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Configuration des couleurs par niveau.
 * @type {Object}
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Ajouter les couleurs à Winston
winston.addColors(logColors);

/**
 * Format personnalisé pour les logs.
 * @type {winston.Logform.Format}
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Format personnalisé pour la console.
 * @type {winston.Logform.Format}
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

/**
 * Instance du logger Winston.
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Logs d'erreur
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),
    // Tous les logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log')
    })
  ]
});

// Ajouter la sortie console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true
  }));
}

/**
 * Middleware de logging HTTP.
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const httpLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
};

/**
 * Handler d'erreurs non capturées.
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason
  });
});

// Nettoyer les logs au démarrage si trop volumineux
async function cleanOldLogs() {
  const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
  const logFiles = ['error.log', 'combined.log'];

  for (const file of logFiles) {
    const logPath = path.join(__dirname, '../logs', file);
    try {
      const stats = await fs.promises.stat(logPath);
      if (stats.size > MAX_LOG_SIZE) {
        await fs.promises.truncate(logPath, 0);
        logger.info(`Log file ${file} cleaned (exceeded ${MAX_LOG_SIZE} bytes)`);
      }
    } catch (err) {
      // Ignorer si le fichier n'existe pas
      if (err.code !== 'ENOENT') {
        logger.error(`Error cleaning log file ${file}:`, err);
      }
    }
  }
}

// Nettoyer les logs au démarrage
cleanOldLogs();

module.exports = logger;