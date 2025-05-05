/**
 * Routes d'authentification.
 * @module routes/auth
 * 
 * Ce module définit les routes API pour l'authentification:
 * - /api/auth/login : Connexion et génération de token JWT
 * - /api/auth/change-password : Modification du mot de passe
 */

const express = require('express');
const router = express.Router();
const { validateCredentials, changePassword } = require('../models/users');
const { loginLimiter, generateToken, authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const { jwtSecret, tokenExpiresIn } = require('../config/auth');

/**
 * Route de connexion utilisateur.
 * Protégée par rate limiting pour éviter les attaques par force brute.
 * Retourne un token JWT en cas de succès.
 * 
 * @name POST /api/auth/login
 * @function
 * @memberof module:routes/auth
 * @param {Object} req.body - Corps de la requête
 * @param {string} req.body.username - Nom d'utilisateur
 * @param {string} req.body.password - Mot de passe
 * @returns {Object} Données utilisateur et token JWT
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
        }

        const user = await validateCredentials(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const token = generateToken(user);
        
        logger.info(`Connexion réussie pour l'utilisateur: ${username}`);
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            } 
        });
    } catch (err) {
        logger.error('Erreur lors de la connexion:', err);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

/**
 * Route de modification du mot de passe.
 * Nécessite un token JWT valide.
 * 
 * @name POST /api/auth/change-password
 * @function
 * @memberof module:routes/auth
 * @param {Object} req.body - Corps de la requête
 * @param {number} req.body.userId - ID de l'utilisateur
 * @param {string} req.body.currentPassword - Mot de passe actuel
 * @param {string} req.body.newPassword - Nouveau mot de passe
 * @returns {Object} Message de confirmation
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // Vérifier que l'utilisateur ne modifie que son propre mot de passe
        if (userId !== req.user.id) {
            return res.status(403).json({ error: 'Non autorisé à modifier ce mot de passe' });
        }

        // Vérifier l'ancien mot de passe
        const user = await validateCredentials(req.user.username, currentPassword);
        if (!user) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        // Changer le mot de passe
        const success = await changePassword(userId, newPassword);
        if (!success) {
            return res.status(400).json({ error: 'Impossible de changer le mot de passe' });
        }

        logger.info(`Mot de passe modifié pour l'utilisateur: ${user.username}`);
        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (err) {
        logger.error('Erreur lors du changement de mot de passe:', err);
        res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
});

/**
 * @route POST /api/auth/refresh-token
 * @desc Rafraîchit un token JWT avant qu'il n'expire
 * @access Protégé
 */
router.post('/refresh-token', authenticateToken, (req, res) => {
  try {
    // L'utilisateur est déjà authentifié grâce au middleware
    const user = req.user;

    // Générer un nouveau token avec une nouvelle date d'expiration
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role || 'user' 
      },
      jwtSecret,
      { expiresIn: tokenExpiresIn }
    );

    logger.info(`Token rafraîchi pour l'utilisateur ${user.username}`);

    // Renvoyer le nouveau token
    res.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
    res.status(500).json({ success: false, message: "Erreur lors du rafraîchissement du token" });
  }
});

module.exports = router;