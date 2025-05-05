/**
 * Middleware pour standardiser les réponses d'API.
 * @module middleware/responseFormatter
 */

const { paginateData, calculatePagination } = require('../config/pagination');
const logger = require('../config/logger');

/**
 * Enrichit l'objet response avec des méthodes pour standardiser le format des réponses.
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction next d'Express
 */
function responseFormatter(req, res, next) {
  /**
   * Envoie une réponse réussie avec un format standardisé.
   * @param {*} data - Données à renvoyer
   * @param {Object} options - Options additionnelles
   */
  res.sendSuccess = function(data, options = {}) {
    // Format de base de la réponse
    const response = {
      success: true,
      data
    };

    // Ajouter des métadonnées si spécifiées
    if (options.meta) {
      response.meta = options.meta;
    }

    // Ajouter un message si spécifié
    if (options.message) {
      response.message = options.message;
    }

    // Envoyer la réponse avec le code statut spécifié ou 200
    return res.status(options.status || 200).json(response);
  };

  /**
   * Envoie une réponse paginée avec un format standardisé.
   * @param {Array} data - Tableau de données à paginer
   * @param {Object} options - Options de pagination
   */
  res.sendPaginated = function(data, options = {}) {
    try {
      // Extraire les paramètres de pagination de la requête
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || undefined;
      const sortBy = req.query.sortBy;
      const sortDirection = req.query.sortDirection;

      // Fusionner avec les options passées à la méthode
      const paginationOptions = {
        page,
        pageSize,
        sortBy,
        sortDirection,
        ...options
      };

      // Paginer les données
      const paginatedResult = paginateData(data, paginationOptions);

      // Envoyer les données paginées
      return res.sendSuccess(paginatedResult.items, { 
        meta: paginatedResult.meta,
        status: options.status || 200,
        message: options.message
      });
    } catch (error) {
      logger.error('Erreur lors de la pagination des données:', error);
      // En cas d'erreur, retourner les données brutes
      return res.sendSuccess(data);
    }
  };

  /**
   * Envoie une réponse d'erreur avec un format standardisé.
   * @param {string} message - Message d'erreur
   * @param {Object} options - Options additionnelles
   */
  res.sendError = function(message, options = {}) {
    // Format de base de la réponse d'erreur
    const response = {
      success: false,
      error: message
    };

    // Ajouter des détails si spécifiés
    if (options.details) {
      response.details = options.details;
    }

    // Ajouter un code d'erreur si spécifié
    if (options.code) {
      response.code = options.code;
    }

    // Journaliser l'erreur si elle est sérieuse (5xx)
    if (options.status >= 500) {
      logger.error(`Erreur API [${req.method} ${req.originalUrl}]: ${message}`, options.details || '');
    } else if (options.status >= 400) {
      logger.warn(`Erreur client [${req.method} ${req.originalUrl}]: ${message}`);
    }

    // Envoyer la réponse avec le code statut spécifié ou 400
    return res.status(options.status || 400).json(response);
  };

  next();
}

module.exports = responseFormatter;