import axios from 'axios';
import { AuthService } from './auth';
import { handleApiError } from './adapters';
import { cacheService } from './cacheService';

/**
 * Service de gestion des requêtes API avec gestion des tokens d'authentification,
 * mécanisme de retry pour les requêtes qui échouent, et mise en cache.
 */
class ApiService {
  /**
   * Effectue une requête GET vers l'API
   * @param {string} url - URL de la requête
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de l'API
   */
  static async get(url, options = {}) {
    const { 
      useCache = true,
      cacheOptions = {},
      ...requestOptions 
    } = options;
    
    // Vérifier si la réponse est en cache et que le cache est activé
    if (useCache) {
      const cachedResponse = cacheService.get(url, requestOptions.params);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Si pas en cache ou cache désactivé, faire l'appel API
    const response = await this._request('get', url, requestOptions);
    
    // Mettre en cache la réponse si le cache est activé
    if (useCache && response && !response.isError) {
      const { ttl } = cacheOptions;
      cacheService.set(url, requestOptions.params, response, ttl);
    }
    
    return response;
  }
  
  /**
   * Effectue une requête POST vers l'API
   * @param {string} url - URL de la requête
   * @param {Object} data - Données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de l'API
   */
  static async post(url, data, options = {}) {
    const response = await this._request('post', url, { ...options, data });
    
    // Invalider le cache pour les opérations d'écriture
    if (response && !response.isError) {
      this._invalidateRelatedCache(url);
    }
    
    return response;
  }
  
  /**
   * Effectue une requête PUT vers l'API
   * @param {string} url - URL de la requête
   * @param {Object} data - Données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de l'API
   */
  static async put(url, data, options = {}) {
    const response = await this._request('put', url, { ...options, data });
    
    // Invalider le cache pour les opérations d'écriture
    if (response && !response.isError) {
      this._invalidateRelatedCache(url);
    }
    
    return response;
  }
  
  /**
   * Effectue une requête DELETE vers l'API
   * @param {string} url - URL de la requête
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de l'API
   */
  static async delete(url, options = {}) {
    const response = await this._request('delete', url, options);
    
    // Invalider le cache pour les opérations d'écriture
    if (response && !response.isError) {
      this._invalidateRelatedCache(url);
    }
    
    return response;
  }
  
  /**
   * Effectue une requête HTTP avec retry automatique en cas d'erreur
   * @param {string} method - Méthode HTTP (get, post, put, delete)
   * @param {string} url - URL de la requête
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de l'API
   * @private
   */
  static async _request(method, url, options = {}) {
    const { 
      params,
      data,
      retries = 0,
      retryDelay = 1000,
      throwOnError = true,
      useAuth = true,
      onRetry = () => {},
      ...axiosOptions 
    } = options;
    
    let lastError;
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        // Si ce n'est pas la première tentative, attendre avant de réessayer
        if (attempt > 0) {
          // Délai progressif: retryDelay * 2^(attempt-1)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          onRetry(lastError, attempt);
        }
        
        // Préparer les en-têtes d'authentification si nécessaire
        const headers = {};
        if (useAuth) {
          const token = AuthService.getToken();
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        }
        
        // Effectuer la requête
        const response = await axios({
          method,
          url,
          headers,
          data,
          params,
          ...axiosOptions
        });
        
        return response;
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Si on a épuisé toutes les tentatives, traiter l'erreur
        if (attempt > retries) {
          if (throwOnError) {
            // Traiter et propager l'erreur
            return handleApiError(error, url);
          } else {
            // Retourner un objet d'erreur normalisé sans lancer d'exception
            return {
              isError: true,
              error: lastError,
              status: lastError.response?.status || 500,
              message: lastError.message || 'Une erreur est survenue'
            };
          }
        }
      }
    }
  }
  
  /**
   * Invalide les entrées de cache liées à une URL
   * @param {string} url - URL de la requête qui a modifié les données
   * @private
   */
  static _invalidateRelatedCache(url) {
    // Extraire le préfixe de ressource de l'URL pour invalidation
    const urlParts = url.split('/');
    
    // Si l'URL suit le motif /api/resource/id/subresource/subid
    // Nous invaliderons /api/resource et /api/resource/id
    if (urlParts.length >= 3) {
      // Exemple: pour /api/programs/123/episodes/456
      // On invalide /api/programs et /api/programs/123
      const baseResource = urlParts.slice(0, 3).join('/'); // /api/programs
      cacheService.invalidateByPrefix(baseResource);
      
      if (urlParts.length >= 4) {
        const parentResource = urlParts.slice(0, 4).join('/'); // /api/programs/123
        cacheService.invalidateByPrefix(parentResource);
      }
    }
  }
  
  /**
   * Vide entièrement le cache API
   */
  static clearCache() {
    cacheService.clear();
  }
}

export default ApiService;