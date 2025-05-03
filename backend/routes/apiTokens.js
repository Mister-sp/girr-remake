/**
 * Routes de gestion des tokens API pour services externes.
 * @module routes/apiTokens
 * 
 * Ce module définit les routes API pour gérer les tokens d'authentification
 * pour les services externes (YouTube, Twitch, etc.)
 */

const express = require('express');
const router = express.Router();
const apiTokens = require('../models/apiTokens');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * Obtient la liste des services avec tokens API stockés.
 * 
 * @name GET /api/tokens
 * @function
 * @memberof module:routes/apiTokens
 * @returns {Array<Object>} Liste des services avec tokens
 */
router.get('/', async (req, res) => {
  try {
    const services = apiTokens.listApiTokenServices();
    res.json(services);
  } catch (error) {
    logger.error('Erreur lors de la récupération des services API:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des services API' });
  }
});

/**
 * Ajoute ou met à jour un token API pour un service spécifique.
 * 
 * @name POST /api/tokens/:service
 * @function
 * @memberof module:routes/apiTokens
 * @param {string} req.params.service - Nom du service (youtube, twitch, etc.)
 * @param {Object} req.body - Données du token
 * @returns {Object} Message de confirmation
 */
router.post('/:service', async (req, res) => {
  const { service } = req.params;
  const tokenData = req.body;
  
  if (!tokenData) {
    return res.status(400).json({ error: 'Données de token requises' });
  }
  
  try {
    await apiTokens.setApiToken(service, tokenData);
    res.status(201).json({ 
      message: `Token API pour ${service} sauvegardé avec succès`,
      service
    });
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde du token pour ${service}:`, error);
    res.status(500).json({ error: `Erreur lors de la sauvegarde du token pour ${service}` });
  }
});

/**
 * Vérifie si un token existe pour un service spécifique.
 * Ne retourne pas le token lui-même pour des raisons de sécurité.
 * 
 * @name GET /api/tokens/:service/status
 * @function
 * @memberof module:routes/apiTokens
 * @param {string} req.params.service - Nom du service (youtube, twitch, etc.)
 * @returns {Object} Statut du token
 */
router.get('/:service/status', async (req, res) => {
  const { service } = req.params;
  
  try {
    const token = apiTokens.getApiToken(service);
    res.json({
      exists: !!token,
      service,
      // Renvoyer uniquement des informations non sensibles si le token existe
      updatedAt: token ? new Date().toISOString() : null
    });
  } catch (error) {
    logger.error(`Erreur lors de la vérification du token pour ${service}:`, error);
    res.status(500).json({ error: `Erreur lors de la vérification du token pour ${service}` });
  }
});

/**
 * Supprime un token API pour un service spécifique.
 * 
 * @name DELETE /api/tokens/:service
 * @function
 * @memberof module:routes/apiTokens
 * @param {string} req.params.service - Nom du service (youtube, twitch, etc.)
 * @returns {Object} Message de confirmation
 */
router.delete('/:service', async (req, res) => {
  const { service } = req.params;
  
  try {
    const result = await apiTokens.removeApiToken(service);
    if (result) {
      res.json({ message: `Token API pour ${service} supprimé avec succès` });
    } else {
      res.status(404).json({ error: `Token API pour ${service} non trouvé` });
    }
  } catch (error) {
    logger.error(`Erreur lors de la suppression du token pour ${service}:`, error);
    res.status(500).json({ error: `Erreur lors de la suppression du token pour ${service}` });
  }
});

module.exports = router;