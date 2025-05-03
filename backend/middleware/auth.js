/**
 * Middleware d'authentification pour sécuriser les routes API.
 * @module middleware/auth
 * 
 * Ce module fournit les fonctions nécessaires pour:
 * - Vérifier les tokens JWT
 * - Générer de nouveaux tokens JWT
 * - Limiter les tentatives de connexion (rate limiting)
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authConfig = require('../config/auth');

/**
 * Limiteur de tentatives de connexion pour prévenir les attaques par force brute.
 * Bloque un client après 5 tentatives échouées pendant 15 minutes.
 * 
 * @type {Function} Middleware Express
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par fenêtre
    message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes' },
    standardHeaders: true, // Retourne les entêtes 'RateLimit-*'
    legacyHeaders: false, // Désactive les entêtes 'X-RateLimit-*'
});

/**
 * Middleware qui vérifie la validité du token JWT dans l'en-tête Authorization.
 * Format attendu: "Bearer [token]"
 * En cas d'échec: retourne une erreur 401 ou 403 selon le cas.
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Callback Express
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentification requise' });
    }

    jwt.verify(token, authConfig.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

/**
 * Génère un token JWT pour un utilisateur authentifié.
 * Le token contient l'ID, le nom d'utilisateur et le rôle de l'utilisateur.
 * 
 * @param {Object} user - Objet utilisateur
 * @param {number} user.id - ID de l'utilisateur
 * @param {string} user.username - Nom d'utilisateur
 * @param {string} user.role - Rôle de l'utilisateur
 * @returns {string} Token JWT signé
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiration }
    );
};

module.exports = {
    loginLimiter,
    authenticateToken,
    generateToken
};