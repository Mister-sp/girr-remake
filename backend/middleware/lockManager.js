/**
 * Système de gestion de verrous pour gérer les accès concurrents aux ressources
 * Utilise un mécanisme de verrouillage en mémoire avec expiration automatique
 */
const logger = require('../config/logger');

class LockManager {
  constructor() {
    // Map stockant tous les verrous actifs
    // Format: { resourceId: { owner: string, expiresAt: Date, type: 'read'|'write' } }
    this.locks = new Map();
    
    // Intervalle pour nettoyer les verrous expirés (toutes les 30 secondes)
    this.cleanupInterval = setInterval(() => this.cleanupExpiredLocks(), 30000);
  }

  /**
   * Acquiert un verrou sur une ressource
   * 
   * @param {string} resourceId - Identifiant de la ressource à verrouiller
   * @param {string} ownerId - Identifiant de l'entité demandant le verrou (session, utilisateur...)
   * @param {Object} options - Options de configuration
   * @param {string} options.type - Type de verrou ('read' ou 'write')
   * @param {number} options.ttl - Durée de vie du verrou en ms (30s par défaut)
   * @param {boolean} options.wait - Si true, attend si le verrou existe déjà
   * @param {number} options.waitTimeout - Temps max d'attente en ms si wait=true
   * @returns {Promise<boolean>} - true si le verrou a été acquis
   */
  async acquireLock(resourceId, ownerId, options = {}) {
    const {
      type = 'write',
      ttl = 30000, // 30 secondes par défaut
      wait = false,
      waitTimeout = 10000, // 10 secondes par défaut
    } = options;
    
    // Initialiser le temps d'attente
    const startTime = Date.now();
    let acquired = false;
    
    // Essayer d'acquérir le verrou immédiatement ou attendre
    while (!acquired) {
      acquired = this._tryAcquireLock(resourceId, ownerId, type, ttl);
      
      if (acquired) {
        logger.debug(`Verrou ${type} acquis sur ${resourceId} par ${ownerId}`);
        return true;
      }
      
      // Si on ne veut pas attendre ou si on a dépassé le timeout
      if (!wait || (Date.now() - startTime > waitTimeout)) {
        if (wait) {
          logger.warn(`Timeout lors de l'attente du verrou sur ${resourceId} par ${ownerId}`);
        }
        return false;
      }
      
      // Attente avant nouvel essai (avec backoff exponentiel)
      const attempts = Math.floor((Date.now() - startTime) / 500);
      const delay = Math.min(100 * Math.pow(1.5, attempts), 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Nettoyage des verrous expirés avant nouvel essai
      this.cleanupExpiredLocks();
    }
    
    return false;
  }
  
  /**
   * Tente d'acquérir un verrou immédiatement
   * 
   * @private
   */
  _tryAcquireLock(resourceId, ownerId, type, ttl) {
    const existingLock = this.locks.get(resourceId);
    
    // Si aucun verrou n'existe
    if (!existingLock) {
      this.locks.set(resourceId, {
        owner: ownerId,
        type,
        expiresAt: new Date(Date.now() + ttl)
      });
      return true;
    }
    
    // Si c'est le même propriétaire qui demande le verrou
    if (existingLock.owner === ownerId) {
      // Renouveler le TTL
      existingLock.expiresAt = new Date(Date.now() + ttl);
      
      // Si on a un verrou en lecture et qu'on veut un verrou en écriture, upgrader
      if (existingLock.type === 'read' && type === 'write') {
        existingLock.type = 'write';
      }
      
      return true;
    }
    
    // Si le verrou existant est en lecture et que notre demande est en lecture aussi
    if (existingLock.type === 'read' && type === 'read') {
      // On peut avoir plusieurs lecteurs simultanés
      this.locks.set(resourceId, {
        owner: ownerId,
        type,
        expiresAt: new Date(Date.now() + ttl),
        // Conserver une référence au verrou précédent (chaîne de lecteurs)
        previousOwner: existingLock
      });
      return true;
    }
    
    // Sinon, échec de l'acquisition
    return false;
  }
  
  /**
   * Libère un verrou
   * 
   * @param {string} resourceId - Identifiant de la ressource
   * @param {string} ownerId - Identifiant du propriétaire du verrou
   * @returns {boolean} - true si le verrou a été libéré
   */
  releaseLock(resourceId, ownerId) {
    const lock = this.locks.get(resourceId);
    
    // Si le verrou n'existe pas
    if (!lock) {
      return false;
    }
    
    // Si c'est bien le propriétaire qui libère le verrou
    if (lock.owner === ownerId) {
      if (lock.previousOwner) {
        // S'il y a un précédent propriétaire (chaîne de lecteurs), restaurer
        this.locks.set(resourceId, lock.previousOwner);
      } else {
        // Sinon supprimer le verrou
        this.locks.delete(resourceId);
      }
      
      logger.debug(`Verrou libéré sur ${resourceId} par ${ownerId}`);
      return true;
    }
    
    // Tentative de libération par quelqu'un d'autre que le propriétaire
    logger.warn(`Tentative de libération d'un verrou par un non-propriétaire: ${resourceId}, ${ownerId}`);
    return false;
  }
  
  /**
   * Force la libération d'un verrou (à utiliser avec précaution)
   * 
   * @param {string} resourceId - Identifiant de la ressource
   * @returns {boolean} - true si le verrou a été forcé
   */
  forceLock(resourceId) {
    const result = this.locks.delete(resourceId);
    if (result) {
      logger.warn(`Libération forcée du verrou sur ${resourceId}`);
    }
    return result;
  }
  
  /**
   * Vérifie si un verrou existe et est valide
   * 
   * @param {string} resourceId - Identifiant de la ressource
   * @returns {Object|null} - Informations sur le verrou ou null si pas de verrou
   */
  getLock(resourceId) {
    const lock = this.locks.get(resourceId);
    
    if (!lock) {
      return null;
    }
    
    // Vérifier si le verrou n'est pas expiré
    if (lock.expiresAt < new Date()) {
      this.locks.delete(resourceId);
      return null;
    }
    
    return {
      owner: lock.owner,
      type: lock.type,
      expiresIn: Math.max(0, lock.expiresAt - new Date()),
      hasMultipleReaders: !!lock.previousOwner
    };
  }
  
  /**
   * Nettoie les verrous expirés
   * 
   * @private
   */
  cleanupExpiredLocks() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [resourceId, lock] of this.locks.entries()) {
      if (lock.expiresAt < now) {
        this.locks.delete(resourceId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`${cleanedCount} verrous expirés ont été nettoyés`);
    }
  }
  
  /**
   * Arrête le gestionnaire de verrous et nettoie les ressources
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.locks.clear();
    logger.info("Gestionnaire de verrous arrêté");
  }
  
  /**
   * Middleware Express pour acquérir un verrou avant le traitement d'une requête
   * 
   * @param {Function} getResourceId - Fonction pour extraire l'ID de ressource de la requête
   * @param {Object} options - Options pour l'acquisition du verrou
   * @returns {Function} - Middleware Express
   */
  static middleware(getResourceId, options = {}) {
    return async (req, res, next) => {
      const resourceId = getResourceId(req);
      
      if (!resourceId) {
        return next();
      }
      
      const lockManager = getInstance();
      const ownerId = req.sessionID || req.ip || 'anonymous';
      
      const acquired = await lockManager.acquireLock(resourceId, ownerId, options);
      
      if (!acquired) {
        return res.status(423).json({
          error: 'Locked',
          message: 'La ressource est actuellement utilisée par un autre utilisateur'
        });
      }
      
      // Ajouter une fonction pour libérer le verrou à la fin de la requête
      res.on('finish', () => {
        lockManager.releaseLock(resourceId, ownerId);
      });
      
      next();
    };
  }
}

// Instance singleton
let instance = null;

/**
 * Obtient l'instance unique du gestionnaire de verrous
 */
const getInstance = () => {
  if (!instance) {
    instance = new LockManager();
  }
  return instance;
};

module.exports = {
  LockManager,
  getInstance
};