import { useState, useCallback } from 'react';

/**
 * Hook pour gérer un cache côté client des requêtes API
 * Compatible avec usePagination pour réduire les appels réseau
 * 
 * @param {Object} options - Options de configuration du cache
 * @param {number} options.ttl - Durée de vie du cache en millisecondes (par défaut 5 minutes)
 * @param {number} options.maxSize - Nombre maximum d'entrées dans le cache (par défaut 100)
 * @returns {Object} Méthodes pour gérer le cache
 */
function useApiCache(options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes par défaut
    maxSize = 100
  } = options;

  // État local pour le cache
  const [cache, setCache] = useState(new Map());
  
  /**
   * Génère une clé de cache unique basée sur les paramètres de requête
   * @param {string} endpoint - L'endpoint API
   * @param {Object} params - Les paramètres de requête
   * @returns {string} Une clé de cache unique
   */
  const generateCacheKey = useCallback((endpoint, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        // Gestion spéciale pour les filtres (qui sont des objets)
        if (key === 'filters' && typeof params[key] === 'object') {
          acc[key] = JSON.stringify(params[key]);
        } else {
          acc[key] = params[key];
        }
        return acc;
      }, {});

    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }, []);

  /**
   * Vérifie si une entrée est présente et valide dans le cache
   * @param {string} key - La clé de cache à vérifier
   * @returns {boolean} true si l'entrée est valide, false sinon
   */
  const isCacheValid = useCallback((key) => {
    if (!cache.has(key)) return false;
    
    const entry = cache.get(key);
    const now = Date.now();
    
    return entry && entry.expiresAt > now;
  }, [cache]);

  /**
   * Récupère une entrée du cache
   * @param {string} endpoint - L'endpoint API
   * @param {Object} params - Les paramètres de requête
   * @returns {Object|null} L'entrée du cache ou null si non trouvée/expirée
   */
  const getCachedData = useCallback((endpoint, params = {}) => {
    const key = generateCacheKey(endpoint, params);
    
    if (isCacheValid(key)) {
      const entry = cache.get(key);
      return entry.data;
    }
    
    return null;
  }, [cache, generateCacheKey, isCacheValid]);

  /**
   * Ajoute ou met à jour une entrée dans le cache
   * @param {string} endpoint - L'endpoint API
   * @param {Object} params - Les paramètres de requête
   * @param {*} data - Les données à mettre en cache
   */
  const setCachedData = useCallback((endpoint, params = {}, data) => {
    const key = generateCacheKey(endpoint, params);
    const now = Date.now();
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      
      // Ajouter/mettre à jour l'entrée
      newCache.set(key, {
        data,
        cachedAt: now,
        expiresAt: now + ttl
      });
      
      // Vérifier si le cache dépasse la taille maximale
      if (newCache.size > maxSize) {
        // Supprimer l'entrée la plus ancienne
        const oldestKey = [...newCache.entries()]
          .sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0][0];
        newCache.delete(oldestKey);
      }
      
      return newCache;
    });
  }, [generateCacheKey, ttl, maxSize]);

  /**
   * Invalide une entrée spécifique du cache
   * @param {string} endpoint - L'endpoint API
   * @param {Object} params - Les paramètres de requête
   */
  const invalidateCache = useCallback((endpoint, params = {}) => {
    const key = generateCacheKey(endpoint, params);
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(key);
      return newCache;
    });
  }, [generateCacheKey]);

  /**
   * Invalide toutes les entrées du cache pour un endpoint spécifique
   * @param {string} endpoint - L'endpoint API à invalider
   */
  const invalidateEndpoint = useCallback((endpoint) => {
    setCache(prevCache => {
      const newCache = new Map();
      
      // Ne conserver que les entrées qui ne commencent pas par cet endpoint
      for (const [key, value] of prevCache.entries()) {
        if (!key.startsWith(`${endpoint}:`)) {
          newCache.set(key, value);
        }
      }
      
      return newCache;
    });
  }, []);

  /**
   * Effacer complètement le cache
   */
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  /**
   * Récupère des données avec mise en cache
   * @param {Function} fetchFn - Fonction de récupération des données
   * @param {string} endpoint - Endpoint API pour la clé de cache
   * @param {Object} params - Paramètres de requête
   * @returns {Promise} Promise contenant les données
   */
  const fetchWithCache = useCallback(async (fetchFn, endpoint, params = {}) => {
    // Vérifier si les données sont en cache
    const cachedData = getCachedData(endpoint, params);
    if (cachedData) return cachedData;
    
    // Si non, faire la requête API
    const data = await fetchFn(params);
    
    // Mettre en cache le résultat
    setCachedData(endpoint, params, data);
    
    return data;
  }, [getCachedData, setCachedData]);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    invalidateEndpoint,
    clearCache,
    fetchWithCache,
    cacheSize: cache.size
  };
}

export default useApiCache;