/**
 * Configuration du système de pagination et lazy loading.
 * @module config/pagination
 */

const { filterData } = require('./filtering');

/**
 * Paramètres de pagination par défaut.
 */
const DEFAULT_CONFIG = {
  // Nombre d'éléments par page par défaut
  defaultPageSize: 20,
  
  // Limites de taille de page
  minPageSize: 5,
  maxPageSize: 100,
  
  // Configuration spécifique pour chaque type de donnée
  programs: {
    pageSize: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  },
  episodes: {
    pageSize: 15,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  },
  topics: {
    pageSize: 30,
    sortBy: 'order',
    sortDirection: 'asc' // les topics sont généralement affichés par ordre croissant
  },
  mediaItems: {
    pageSize: 25,
    sortBy: 'order',
    sortDirection: 'asc' // les médias sont généralement affichés par ordre croissant
  }
};

/**
 * Configuration actuelle de pagination.
 */
let paginationConfig = { ...DEFAULT_CONFIG };

/**
 * Obtient la configuration actuelle de pagination.
 * @returns {Object} Configuration actuelle
 */
function getConfig() {
  return { ...paginationConfig };
}

/**
 * Met à jour la configuration de pagination.
 * @param {Object} newConfig - Nouvelle configuration partielle
 * @returns {Object} Configuration mise à jour
 */
function updateConfig(newConfig) {
  if (newConfig.programs) {
    paginationConfig.programs = { ...paginationConfig.programs, ...newConfig.programs };
  }
  
  if (newConfig.episodes) {
    paginationConfig.episodes = { ...paginationConfig.episodes, ...newConfig.episodes };
  }
  
  if (newConfig.topics) {
    paginationConfig.topics = { ...paginationConfig.topics, ...newConfig.topics };
  }
  
  if (newConfig.mediaItems) {
    paginationConfig.mediaItems = { ...paginationConfig.mediaItems, ...newConfig.mediaItems };
  }
  
  // Mettre à jour les paramètres globaux
  if (newConfig.defaultPageSize !== undefined) {
    paginationConfig.defaultPageSize = newConfig.defaultPageSize;
  }
  
  if (newConfig.minPageSize !== undefined) {
    paginationConfig.minPageSize = newConfig.minPageSize;
  }
  
  if (newConfig.maxPageSize !== undefined) {
    paginationConfig.maxPageSize = newConfig.maxPageSize;
  }
  
  return { ...paginationConfig };
}

/**
 * Calcule les paramètres de pagination à partir des paramètres de requête.
 * @param {Object} queryParams - Paramètres de requête HTTP
 * @param {string} resourceType - Type de ressource (programs, episodes, topics, mediaItems)
 * @returns {Object} Paramètres de pagination
 */
function calculatePagination(queryParams, resourceType) {
  const config = paginationConfig[resourceType] || {};
  
  // Extraire et valider le numéro de page
  const page = queryParams.page !== undefined ? parseInt(queryParams.page, 10) : 1;
  
  // Extraire et valider la taille de page
  let pageSize = queryParams.pageSize !== undefined 
    ? parseInt(queryParams.pageSize, 10)
    : (config.pageSize || paginationConfig.defaultPageSize);
  
  // Appliquer les limites de taille de page
  pageSize = Math.min(
    Math.max(pageSize, paginationConfig.minPageSize),
    paginationConfig.maxPageSize
  );
  
  // Extraire les paramètres de tri
  const sortBy = queryParams.sortBy || config.sortBy || 'createdAt';
  const sortDirection = queryParams.sortDirection || config.sortDirection || 'desc';
  
  return {
    page,
    pageSize,
    sortBy,
    sortDirection,
    skip: (page - 1) * pageSize,
    limit: pageSize
  };
}

/**
 * Trie et pagine un ensemble de données.
 * @param {Array} data - Données à paginer
 * @param {Object} paginationParams - Paramètres de pagination
 * @param {Object} queryParams - Paramètres de requête pour le filtrage
 * @param {string} resourceType - Type de ressource pour le filtrage
 * @returns {Object} Données paginées avec métadonnées
 */
function paginateData(data, paginationParams, queryParams = {}, resourceType = null) {
  let filteredData = data;

  // Appliquer les filtres si un resourceType est fourni
  if (resourceType) {
    filteredData = filterData(data, queryParams, resourceType);
  }
  
  // Extraire les paramètres
  const { page, pageSize, sortBy, sortDirection } = paginationParams;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Appliquer le tri
  if (sortBy) {
    filteredData.sort((a, b) => {
      if (a[sortBy] === undefined || b[sortBy] === undefined) {
        return 0;
      }
      
      let comparison;
      if (a[sortBy] instanceof Date && b[sortBy] instanceof Date) {
        comparison = a[sortBy].getTime() - b[sortBy].getTime();
      } else if (typeof a[sortBy] === 'string' && typeof b[sortBy] === 'string') {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      } else {
        comparison = a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Extraire la page demandée
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = filteredData.slice(startIndex, startIndex + pageSize);
  
  // Retourner les données avec les métadonnées
  return {
    items: paginatedItems,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      sortBy,
      sortDirection
    }
  };
}

/**
 * Crée un middleware Express pour gérer la pagination.
 * @param {string} resourceType - Type de ressource
 * @returns {Function} Middleware Express
 */
function createPaginationMiddleware(resourceType) {
  return (req, res, next) => {
    // Ajouter les paramètres de pagination à la requête
    req.pagination = calculatePagination(req.query, resourceType);
    next();
  };
}

module.exports = {
  getConfig,
  updateConfig,
  calculatePagination,
  paginateData,
  createPaginationMiddleware
};