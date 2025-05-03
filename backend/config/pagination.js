/**
 * Configuration du système de pagination et lazy loading.
 * @module config/pagination
 */

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
  
  return getConfig();
}

/**
 * Réinitialise la configuration à ses valeurs par défaut.
 * @returns {Object} Configuration par défaut
 */
function resetConfig() {
  paginationConfig = { ...DEFAULT_CONFIG };
  return getConfig();
}

/**
 * Utilitaire pour calculer les paramètres de pagination à partir de la requête.
 * @param {Object} options - Options de pagination
 * @param {number} [options.page=1] - Numéro de page (commence à 1)
 * @param {number} [options.pageSize] - Taille de la page
 * @param {string} [options.type='default'] - Type de donnée (programs, episodes, topics, mediaItems)
 * @param {string} [options.sortBy] - Champ de tri
 * @param {string} [options.sortDirection] - Direction de tri ('asc' ou 'desc')
 * @returns {Object} Paramètres de pagination calculés
 */
function calculatePagination(options = {}) {
  const type = options.type || 'default';
  const typeConfig = paginationConfig[type] || {};
  
  let pageSize = options.pageSize || typeConfig.pageSize || paginationConfig.defaultPageSize;
  
  // Appliquer les limites min/max
  pageSize = Math.max(paginationConfig.minPageSize, Math.min(pageSize, paginationConfig.maxPageSize));
  
  // Page commence à 1 (plus intuitif pour les utilisateurs)
  const page = Math.max(1, options.page || 1);
  const skip = (page - 1) * pageSize;
  const limit = pageSize;
  
  // Options de tri
  const sortBy = options.sortBy || typeConfig.sortBy || 'id';
  const sortDirection = options.sortDirection || typeConfig.sortDirection || 'asc';
  
  return {
    page,
    pageSize,
    skip,
    limit,
    sortBy,
    sortDirection
  };
}

/**
 * Applique la pagination à un tableau de données.
 * @param {Array} data - Tableau de données complet
 * @param {Object} paginationOptions - Options de pagination (comme pour calculatePagination)
 * @returns {Object} Résultat paginé
 */
function paginateData(data, paginationOptions = {}) {
  const { skip, limit, sortBy, sortDirection } = calculatePagination(paginationOptions);
  
  // Créer une copie pour éviter de modifier le tableau original
  const sortedData = [...data];
  
  // Trier les données
  sortedData.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Appliquer pagination
  const items = sortedData.slice(skip, skip + limit);
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const page = paginationOptions.page || 1;
  
  return {
    items,
    meta: {
      page,
      pageSize: limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = {
  getConfig,
  updateConfig,
  resetConfig,
  calculatePagination,
  paginateData
};