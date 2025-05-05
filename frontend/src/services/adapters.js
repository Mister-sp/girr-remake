/**
 * Adaptateurs pour normaliser les réponses d'API.
 * Ce module fournit des utilitaires pour extraire des données de manière cohérente
 * indépendamment du format de la réponse API.
 * @module services/adapters
 */

/**
 * Extrait un tableau de données d'une réponse API, quelle que soit sa structure.
 * Gère de manière transparente différents formats :
 * - Tableau direct
 * - { data: [...] }
 * - { data: { items: [...], meta: {...} } }
 * - { data: { success: true, data: [...], meta: {...} } }
 * 
 * @param {Object|Array|null} response - La réponse API à traiter
 * @returns {Array} - Les données extraites sous forme de tableau
 */
export function extractDataArray(response) {
  // Gestion des cas null/undefined
  if (!response) {
    console.warn('Response is null or undefined');
    return [];
  }

  // Si c'est déjà un tableau, le retourner directement
  if (Array.isArray(response)) {
    return response;
  }

  // Extraire le champ "data" si présent
  const data = response.data;
  
  // Si data est null/undefined
  if (!data) {
    console.warn('Response.data is null or undefined');
    return [];
  }

  // Si data est un tableau, le retourner
  if (Array.isArray(data)) {
    return data;
  }

  // Si data est un objet avec un champ "items" (format de pagination standard)
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  // Si data est un objet avec un champ "data" (autre format avec succès+données+méta)
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }

  // Si rien ne fonctionne, journaliser et retourner un tableau vide
  console.warn('Could not extract array data from response', response);
  return [];
}

/**
 * Extrait les métadonnées de pagination d'une réponse API, si disponibles.
 * 
 * @param {Object} response - La réponse API à traiter
 * @returns {Object|null} - Les métadonnées extraites ou null si non disponible
 */
export function extractPaginationMeta(response) {
  if (!response) return null;

  // Format { data: { meta: {...} } }
  if (response.data && response.data.meta) {
    return response.data.meta;
  }
  
  // Format { meta: {...} }
  if (response.meta) {
    return response.meta;
  }

  // Format { data: { success: true, data: [...], meta: {...} } }
  if (response.data && response.data.success && response.data.meta) {
    return response.data.meta;
  }

  return null;
}

/**
 * Détermine si une réponse API contient des données de pagination.
 * 
 * @param {Object} response - La réponse API à vérifier
 * @returns {boolean} - true si la réponse contient des métadonnées de pagination
 */
export function hasPagination(response) {
  const meta = extractPaginationMeta(response);
  return meta !== null && 
    (meta.total !== undefined || 
     meta.totalPages !== undefined || 
     meta.page !== undefined);
}

/**
 * Extrait une donnée simple (non-tableau) d'une réponse API.
 * 
 * @param {Object} response - La réponse API à traiter
 * @returns {*} - La donnée extraite
 */
export function extractData(response) {
  if (!response) return null;
  
  return response.data !== undefined ? response.data : response;
}

/**
 * Envoie un événement d'erreur API pour être traité par le système de notification.
 * 
 * @param {Object} error - L'erreur à traiter
 * @param {string} endpoint - L'endpoint qui a généré l'erreur
 */
export function handleApiError(error, endpoint) {
  const status = error.response?.status || 500;
  const message = error.response?.data?.error || error.message || 'Une erreur est survenue.';
  
  // Déclencher un événement personnalisé pour le système de notification
  window.dispatchEvent(new CustomEvent('api-error', {
    detail: {
      status,
      message,
      endpoint
    }
  }));
}