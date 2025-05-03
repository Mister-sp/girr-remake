/**
 * Gestion des tokens API et des secrets pour services externes.
 * @module models/apiTokens
 * 
 * Ce module gère le stockage sécurisé des tokens API et autres secrets
 * pour les services externes comme YouTube, Twitch, etc.
 */

const { store, saveStore } = require('../data/store');
const logger = require('../config/logger');
const encryption = require('../config/encryption');

// Initialiser la section des tokens API si nécessaire
if (!store.apiTokens) {
    store.apiTokens = {};
}

/**
 * Définit un token d'API pour un service spécifique.
 * Le token est automatiquement chiffré avant stockage.
 * 
 * @async
 * @param {string} serviceName - Nom du service (youtube, twitch, etc.)
 * @param {Object} tokenData - Données du token
 * @returns {Promise<boolean>} - True si le token a été sauvegardé avec succès
 */
async function setApiToken(serviceName, tokenData) {
    if (!serviceName) {
        throw new Error('Nom de service requis');
    }

    try {
        // Chiffrer les données du token
        const encryptedToken = encryption.encrypt(tokenData);
        
        // Stocker avec métadonnées mais sans données sensibles en clair
        store.apiTokens[serviceName] = {
            encryptedToken,
            updatedAt: new Date().toISOString(),
            service: serviceName
        };
        
        await saveStore();
        logger.info(`Token API mis à jour pour le service: ${serviceName}`);
        return true;
    } catch (error) {
        logger.error(`Erreur lors de la sauvegarde du token API pour ${serviceName}:`, error);
        return false;
    }
}

/**
 * Récupère un token d'API pour un service spécifique.
 * Le token est automatiquement déchiffré.
 * 
 * @param {string} serviceName - Nom du service (youtube, twitch, etc.)
 * @returns {Object|null} - Données du token déchiffrées ou null si non trouvé
 */
function getApiToken(serviceName) {
    try {
        const tokenEntry = store.apiTokens[serviceName];
        if (!tokenEntry || !tokenEntry.encryptedToken) {
            return null;
        }
        
        // Déchiffrer le token
        return encryption.decrypt(tokenEntry.encryptedToken);
    } catch (error) {
        logger.error(`Erreur lors de la récupération du token API pour ${serviceName}:`, error);
        return null;
    }
}

/**
 * Supprime un token d'API pour un service spécifique.
 * 
 * @async
 * @param {string} serviceName - Nom du service (youtube, twitch, etc.)
 * @returns {Promise<boolean>} - True si le token a été supprimé avec succès
 */
async function removeApiToken(serviceName) {
    try {
        if (store.apiTokens[serviceName]) {
            delete store.apiTokens[serviceName];
            await saveStore();
            logger.info(`Token API supprimé pour le service: ${serviceName}`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`Erreur lors de la suppression du token API pour ${serviceName}:`, error);
        return false;
    }
}

/**
 * Liste tous les services qui ont des tokens stockés.
 * Ne retourne pas les tokens eux-mêmes pour des raisons de sécurité.
 * 
 * @returns {Array<Object>} - Liste des services avec métadonnées
 */
function listApiTokenServices() {
    try {
        return Object.keys(store.apiTokens).map(service => ({
            service,
            updatedAt: store.apiTokens[service].updatedAt
        }));
    } catch (error) {
        logger.error('Erreur lors de la liste des services avec tokens API:', error);
        return [];
    }
}

module.exports = {
    setApiToken,
    getApiToken,
    removeApiToken,
    listApiTokenServices
};