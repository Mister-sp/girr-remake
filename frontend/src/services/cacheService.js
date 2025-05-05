/**
 * Service de mise en cache côté client pour réduire les requêtes API.
 * Utilise à la fois le sessionStorage pour les données persistantes entre pages
 * et un cache en mémoire pour les accès rapides.
 */
class CacheService {
  constructor(options = {}) {
    // Cache en mémoire (plus rapide que sessionStorage)
    this.memoryCache = new Map();
    
    // Options par défaut
    this.options = {
      // Durée de vie par défaut des entrées du cache (en ms) - 5 minutes
      defaultTTL: 5 * 60 * 1000,
      // Préfixe utilisé pour les clés dans le sessionStorage
      storageKeyPrefix: 'app_cache_',
      // Taille maximale de l'entrée pour le sessionStorage (en caractères)
      maxStorageEntrySize: 2 * 1024 * 1024, // 2MB
      ...options
    };
    
    // Initialisation du cache mémoire à partir du sessionStorage
    this.loadCacheFromStorage();
  }
  
  /**
   * Génère une clé de cache basée sur l'URL et les paramètres
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres optionnels de la requête
   * @returns {string} - Clé de cache unique
   */
  generateCacheKey(url, params = null) {
    const normalizedUrl = url.toLowerCase().trim();
    
    if (!params) {
      return normalizedUrl;
    }
    
    // Trier les paramètres pour garantir que les clés identiques avec des ordres différents
    // produisent la même clé de cache
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
      
    return `${normalizedUrl}?${sortedParams}`;
  }
  
  /**
   * Charge le cache depuis le sessionStorage vers la mémoire
   * @private
   */
  loadCacheFromStorage() {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
        if (key && key.startsWith(this.options.storageKeyPrefix)) {
          const value = sessionStorage.getItem(key);
          
          if (value) {
            try {
              const cacheEntry = JSON.parse(value);
              const originalKey = key.slice(this.options.storageKeyPrefix.length);
              
              // Vérifier si l'entrée n'a pas expiré
              if (cacheEntry.expiry > Date.now()) {
                this.memoryCache.set(originalKey, cacheEntry);
              } else {
                // Supprimer les entrées expirées
                sessionStorage.removeItem(key);
              }
            } catch (e) {
              console.warn('Échec de la lecture d\'une entrée de cache:', e);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Échec du chargement du cache depuis le sessionStorage:', e);
    }
  }
  
  /**
   * Récupère une valeur du cache
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres optionnels de la requête
   * @returns {*} - La valeur en cache ou null si non trouvée ou expirée
   */
  get(url, params = null) {
    const key = this.generateCacheKey(url, params);
    
    // D'abord vérifier le cache mémoire (plus rapide)
    const memoryEntry = this.memoryCache.get(key);
    
    if (memoryEntry) {
      // Vérifier si l'entrée a expiré
      if (memoryEntry.expiry > Date.now()) {
        return memoryEntry.value;
      } else {
        // Supprimer l'entrée expirée
        this.memoryCache.delete(key);
        try {
          sessionStorage.removeItem(this.options.storageKeyPrefix + key);
        } catch (e) {
          console.warn('Échec de la suppression de l\'entrée de cache expirée:', e);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Stocke une valeur dans le cache
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres optionnels de la requête
   * @param {*} value - Valeur à mettre en cache
   * @param {number} ttl - Durée de vie en millisecondes (utilise defaultTTL par défaut)
   */
  set(url, params = null, value, ttl = null) {
    const key = this.generateCacheKey(url, params);
    const expiry = Date.now() + (ttl || this.options.defaultTTL);
    const cacheEntry = { value, expiry };
    
    // Toujours mettre à jour le cache mémoire
    this.memoryCache.set(key, cacheEntry);
    
    // Tenter de mettre à jour aussi le sessionStorage pour persistence entre navigations
    try {
      const serializedEntry = JSON.stringify(cacheEntry);
      
      // Vérifier la taille avant stockage pour éviter les erreurs QUOTA_EXCEEDED
      if (serializedEntry.length <= this.options.maxStorageEntrySize) {
        sessionStorage.setItem(this.options.storageKeyPrefix + key, serializedEntry);
      }
    } catch (e) {
      console.warn('Échec de l\'enregistrement dans le sessionStorage:', e);
    }
  }
  
  /**
   * Supprime une entrée spécifique du cache
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres optionnels de la requête
   */
  remove(url, params = null) {
    const key = this.generateCacheKey(url, params);
    
    this.memoryCache.delete(key);
    
    try {
      sessionStorage.removeItem(this.options.storageKeyPrefix + key);
    } catch (e) {
      console.warn('Échec de la suppression de l\'entrée de cache:', e);
    }
  }
  
  /**
   * Invalide toutes les entrées du cache dont les URLs commencent par le préfixe donné
   * @param {string} urlPrefix - Préfixe d'URL pour l'invalidation
   */
  invalidateByPrefix(urlPrefix) {
    if (!urlPrefix) return;
    
    const normalizedPrefix = urlPrefix.toLowerCase().trim();
    
    // Supprimer du cache mémoire
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(normalizedPrefix)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Supprimer du sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.options.storageKeyPrefix)) {
          const originalKey = key.slice(this.options.storageKeyPrefix.length);
          if (originalKey.startsWith(normalizedPrefix)) {
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.warn('Échec de l\'invalidation du cache par préfixe:', e);
    }
  }
  
  /**
   * Efface complètement le cache
   */
  clear() {
    // Effacer le cache mémoire
    this.memoryCache.clear();
    
    // Effacer le sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.options.storageKeyPrefix)) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Échec de l\'effacement du cache:', e);
    }
  }
}

// Exporter une instance singleton du service de cache
export const cacheService = new CacheService();

// Exporter aussi la classe pour permettre la création d'instances multiples si nécessaire
export default CacheService;