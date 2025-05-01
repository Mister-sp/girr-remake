const winston = require('winston');
const path = require('path');

// Configuration des formats
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Configuration du logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Console logs
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            level: 'info'
        }),
        // Fichier séparé pour les erreurs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
        })
    ]
});

module.exports = logger;