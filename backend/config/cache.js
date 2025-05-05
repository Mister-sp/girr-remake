/**
 * Module de mise en cache avancé pour l'optimisation des performances
 * @module config/cache
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('./logger');

// Cache principal avec TTL par défaut de 5 minutes
const mainCache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60,
  useClones: false
});

// Cache pour les réponses HTTP avec TTL plus court
const responseCache = new NodeCache({ 
  stdTTL: 60, 
  checkperiod: 30,
  useClones: false
});

// Cache pour les données agrégées avec TTL plus long
const aggregationCache = new NodeCache({ 
  stdTTL: 900, // 15 minutes
  checkperiod: 120,
  useClones: false
});

// Statistiques du cache pour le monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0,
  byNamespace: {}
};

/**
 * Types de cache disponibles
 * @enum {string}
 */
const CACHE_TYPES = {
  MAIN: 'main',
  RESPONSE: 'response',
  AGGREGATION: 'aggregation'
};

/**
 * Obtient le cache approprié selon le type
 * @param {string} cacheType - Type de cache à utiliser
 * @returns {NodeCache} Instance de cache
 */
function getCacheInstance(cacheType = CACHE_TYPES.MAIN) {
  switch (cacheType) {
    case CACHE_TYPES.RESPONSE:
      return responseCache;
    case CACHE_TYPES.AGGREGATION:
      return aggregationCache;
    case CACHE_TYPES.MAIN:
    default:
      return mainCache;
  }
}

/**
 * Génère une clé de cache basée sur les paramètres
 * @param {string} namespace - Espace de noms du cache
 * @param {object} params - Paramètres à inclure dans la clé
 * @returns {string} Clé de cache
 */
function generateCacheKey(namespace, params = {}) {
  // Si la clé est déjà une chaîne, l'utiliser directement
  if (typeof namespace === 'string' && Object.keys(params).length === 0) {
    return namespace;
  }

  // Créer une clé basée sur le namespace et les paramètres
  const sortedParams = {};
  Object.keys(params).sort().forEach(key => {
    sortedParams[key] = params[key];
  });

  const stringToHash = `${namespace}:${JSON.stringify(sortedParams)}`;
  return crypto.createHash('md5').update(stringToHash).digest('hex');
}

/**
 * Récupère une valeur du cache
 * @param {string} key - Clé de cache
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à utiliser
 * @returns {*} Valeur mise en cache ou undefined si non trouvée
 */
function get(key, cacheType = CACHE_TYPES.MAIN) {
  const cache = getCacheInstance(cacheType);
  const value = cache.get(key);
  
  // Enregistrer les statistiques
  const namespace = key.split(':')[0];
  if (!cacheStats.byNamespace[namespace]) {
    cacheStats.byNamespace[namespace] = { hits: 0, misses: 0 };
  }
  
  if (value !== undefined) {
    cacheStats.hits++;
    cacheStats.byNamespace[namespace].hits++;
    logger.debug(`Cache hit for key: ${key}`);
    return value;
  } else {
    cacheStats.misses++;
    cacheStats.byNamespace[namespace].misses++;
    logger.debug(`Cache miss for key: ${key}`);
    return undefined;
  }
}

/**
 * Met une valeur en cache
 * @param {string} key - Clé de cache
 * @param {*} value - Valeur à mettre en cache
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à utiliser
 * @param {number} [ttl=null] - Durée de vie en secondes, null pour utiliser la valeur par défaut
 * @returns {boolean} Succès ou échec
 */
function set(key, value, cacheType = CACHE_TYPES.MAIN, ttl = null) {
  const cache = getCacheInstance(cacheType);
  cacheStats.sets++;
  logger.debug(`Setting cache for key: ${key}`);
  return cache.set(key, value, ttl);
}

/**
 * Supprime une valeur du cache
 * @param {string} key - Clé de cache
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à utiliser
 * @returns {number} Nombre d'éléments supprimés
 */
function invalidate(key, cacheType = CACHE_TYPES.MAIN) {
  const cache = getCacheInstance(cacheType);
  const result = cache.del(key);
  if (result > 0) {
    cacheStats.invalidations += result;
    logger.debug(`Invalidated cache for key: ${key}`);
  }
  return result;
}

/**
 * Supprime les valeurs de cache par motif
 * @param {string} pattern - Motif de clé à supprimer (peut être un préfixe)
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à utiliser
 * @returns {number} Nombre d'éléments supprimés
 */
function invalidatePattern(pattern, cacheType = CACHE_TYPES.MAIN) {
  const cache = getCacheInstance(cacheType);
  const keys = cache.keys();
  let count = 0;
  
  keys.forEach(key => {
    if (key.startsWith(pattern)) {
      cache.del(key);
      count++;
    }
  });
  
  if (count > 0) {
    cacheStats.invalidations += count;
    logger.debug(`Invalidated ${count} cache entries with pattern: ${pattern}`);
  }
  
  return count;
}

/**
 * Vide complètement un cache
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à vider
 */
function flush(cacheType = CACHE_TYPES.MAIN) {
  const cache = getCacheInstance(cacheType);
  const count = cache.keys().length;
  cache.flushAll();
  
  if (count > 0) {
    cacheStats.invalidations += count;
    logger.info(`Flushed ${count} entries from ${cacheType} cache`);
  }
}

/**
 * Récupère les statistiques du cache
 * @returns {object} Statistiques du cache
 */
function getStats() {
  return {
    ...cacheStats,
    size: {
      main: mainCache.keys().length,
      response: responseCache.keys().length,
      aggregation: aggregationCache.keys().length
    },
    hitRatio: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
  };
}

/**
 * Réinitialise les statistiques du cache
 */
function resetStats() {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    byNamespace: {}
  };
}

/**
 * Middleware Express pour mettre en cache les réponses HTTP
 * @param {number} [ttl=60] - Durée de vie en secondes
 * @param {Function} [keyGenerator] - Fonction personnalisée pour générer la clé de cache
 * @returns {Function} Middleware Express
 */
function responseCacheMiddleware(ttl = 60, keyGenerator = null) {
  return (req, res, next) => {
    // Ne pas mettre en cache pour les requêtes non-GET ou avec ?nocache=true
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }
    
    // Générer la clé de cache
    const key = keyGenerator 
      ? keyGenerator(req) 
      : generateCacheKey(`response:${req.originalUrl}`, req.query);
    
    // Vérifier si la réponse est en cache
    const cachedResponse = get(key, CACHE_TYPES.RESPONSE);
    
    if (cachedResponse) {
      // Utiliser la réponse mise en cache
      return res.status(cachedResponse.status)
        .set(cachedResponse.headers)
        .set('X-Cache', 'HIT')
        .send(cachedResponse.body);
    }
    
    // Sauvegarder les méthodes originales de res
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    // Variables pour stocker l'état de la réponse
    let responseBody;
    let responseStatus = 200;
    
    // Remplacer res.status
    res.status = function(code) {
      responseStatus = code;
      return originalStatus.apply(this, arguments);
    };
    
    // Remplacer res.send
    res.send = function(body) {
      responseBody = body;
      
      // Ne mettre en cache que les réponses réussies
      if (responseStatus >= 200 && responseStatus < 300) {
        const cachedData = {
          status: responseStatus,
          headers: {
            'Content-Type': this.get('Content-Type')
          },
          body: responseBody
        };
        set(key, cachedData, CACHE_TYPES.RESPONSE, ttl);
      }
      
      this.set('X-Cache', 'MISS');
      return originalSend.apply(this, arguments);
    };
    
    // Remplacer res.json
    res.json = function(body) {
      responseBody = body;
      
      // Ne mettre en cache que les réponses réussies
      if (responseStatus >= 200 && responseStatus < 300) {
        const cachedData = {
          status: responseStatus,
          headers: {
            'Content-Type': 'application/json'
          },
          body: responseBody
        };
        set(key, cachedData, CACHE_TYPES.RESPONSE, ttl);
      }
      
      this.set('X-Cache', 'MISS');
      return originalJson.apply(this, arguments);
    };
    
    next();
  };
}

/**
 * Fonction d'aide pour mettre en cache un résultat de fonction asynchrone
 * @param {Function} asyncFn - Fonction asynchrone dont le résultat sera mis en cache
 * @param {string} key - Clé de cache
 * @param {string} [cacheType=CACHE_TYPES.MAIN] - Type de cache à utiliser
 * @param {number} [ttl=null] - Durée de vie en secondes, null pour utiliser la valeur par défaut
 * @returns {Promise<*>} Résultat de la fonction, depuis le cache si disponible
 */
async function cached(asyncFn, key, cacheType = CACHE_TYPES.MAIN, ttl = null) {
  // Vérifier si la valeur est déjà en cache
  const cachedValue = get(key, cacheType);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Exécuter la fonction et mettre en cache le résultat
  const result = await asyncFn();
  set(key, result, cacheType, ttl);
  
  return result;
}

// Exporter les fonctionnalités du module
module.exports = {
  get,
  set,
  invalidate,
  invalidatePattern,
  flush,
  generateCacheKey,
  getStats,
  resetStats,
  cached,
  responseCacheMiddleware,
  CACHE_TYPES
};