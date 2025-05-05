/**
 * Module d'agrégation de données pour les tableaux de bord et les vues synthétiques
 * @module config/aggregation
 */
const { filterData } = require('./filtering');
const cache = require('./cache');

/**
 * Configuration des agrégations par défaut
 */
const DEFAULT_AGGREGATIONS = {
  // Métriques générales sur les programmes
  programMetrics: {
    cacheKey: 'aggregation:programMetrics',
    ttl: 60 * 15, // 15 minutes
    calculation: async (dataProvider) => {
      const programs = await dataProvider.getPrograms();
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return {
        total: programs.length,
        active: programs.filter(p => p.isActive).length,
        inactive: programs.filter(p => !p.isActive).length,
        recentlyCreated: programs.filter(p => new Date(p.createdAt) >= oneWeekAgo).length,
        avgEpisodesPerProgram: (programs.reduce((sum, p) => sum + (p.episodeCount || 0), 0) / (programs.length || 1)).toFixed(1)
      };
    }
  },

  // Métriques sur les épisodes
  episodeMetrics: {
    cacheKey: 'aggregation:episodeMetrics',
    ttl: 60 * 10, // 10 minutes
    calculation: async (dataProvider) => {
      const episodes = await dataProvider.getEpisodes();
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const statuses = {
        draft: episodes.filter(e => e.status === 'draft').length,
        scheduled: episodes.filter(e => e.status === 'scheduled').length,
        published: episodes.filter(e => e.status === 'published').length,
        archived: episodes.filter(e => e.status === 'archived').length
      };
      
      const totalDuration = episodes.reduce((sum, e) => sum + (e.duration || 0), 0);
      const avgDuration = (totalDuration / (episodes.length || 1)).toFixed(2);
      
      return {
        total: episodes.length,
        recentlyPublished: episodes.filter(e => e.status === 'published' && new Date(e.publishDate) >= oneMonthAgo).length,
        statuses,
        totalDuration,
        avgDuration,
        upcomingScheduled: episodes.filter(e => e.status === 'scheduled' && new Date(e.publishDate) > now).length
      };
    }
  },

  // Métriques sur les topics
  topicMetrics: {
    cacheKey: 'aggregation:topicMetrics',
    ttl: 60 * 10, // 10 minutes
    calculation: async (dataProvider) => {
      const topics = await dataProvider.getTopics();
      const episodes = await dataProvider.getEpisodes();
      
      const topicsByStatus = {
        pending: topics.filter(t => t.status === 'pending').length,
        active: topics.filter(t => t.status === 'active').length,
        done: topics.filter(t => t.status === 'done').length
      };
      
      // Trouver les topics les plus utilisés dans les épisodes
      const topicUsage = {};
      topics.forEach(topic => {
        topicUsage[topic.id] = {
          id: topic.id,
          title: topic.title,
          count: 0
        };
      });
      
      episodes.forEach(episode => {
        if (episode.topicIds && Array.isArray(episode.topicIds)) {
          episode.topicIds.forEach(topicId => {
            if (topicUsage[topicId]) {
              topicUsage[topicId].count++;
            }
          });
        }
      });
      
      const popularTopics = Object.values(topicUsage)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        total: topics.length,
        byStatus: topicsByStatus,
        avgDuration: (topics.reduce((sum, t) => sum + (t.duration || 0), 0) / (topics.length || 1)).toFixed(2),
        popularTopics
      };
    }
  },

  // Métriques sur les médias
  mediaMetrics: {
    cacheKey: 'aggregation:mediaMetrics',
    ttl: 60 * 10, // 10 minutes
    calculation: async (dataProvider) => {
      const mediaItems = await dataProvider.getMediaItems();
      
      const byType = {
        image: mediaItems.filter(m => m.type === 'image').length,
        video: mediaItems.filter(m => m.type === 'video').length,
        document: mediaItems.filter(m => m.type === 'document').length,
        other: mediaItems.filter(m => m.type === 'other' || !m.type).length
      };
      
      const totalSize = mediaItems.reduce((sum, m) => sum + (m.size || 0), 0);
      
      // Convertir en MB avec 2 décimales
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return {
        total: mediaItems.length,
        byType,
        totalSizeMB,
        avgSizeMB: (totalSizeMB / (mediaItems.length || 1)).toFixed(2)
      };
    }
  },

  // Résumé global pour le tableau de bord
  dashboardSummary: {
    cacheKey: 'aggregation:dashboardSummary',
    ttl: 60 * 5, // 5 minutes
    calculation: async (dataProvider) => {
      const [
        programMetrics, 
        episodeMetrics, 
        topicMetrics, 
        mediaMetrics,
        recentEpisodes,
        upcomingEpisodes
      ] = await Promise.all([
        getAggregation('programMetrics', dataProvider),
        getAggregation('episodeMetrics', dataProvider),
        getAggregation('topicMetrics', dataProvider),
        getAggregation('mediaMetrics', dataProvider),
        dataProvider.getRecentEpisodes(5),
        dataProvider.getUpcomingEpisodes(5)
      ]);
      
      return {
        summary: {
          programs: programMetrics.total,
          episodes: episodeMetrics.total,
          topics: topicMetrics.total,
          media: mediaMetrics.total
        },
        recentEpisodes,
        upcomingEpisodes,
        programMetrics,
        episodeMetrics,
        topicMetrics,
        mediaMetrics
      };
    }
  }
};

let aggregationsConfig = { ...DEFAULT_AGGREGATIONS };

/**
 * Obtient une agrégation de données, avec mise en cache
 * @param {string} aggregationType - Type d'agrégation
 * @param {object} dataProvider - Fournisseur de données
 * @param {boolean} [forceRefresh=false] - Forcer le rafraîchissement du cache
 * @returns {Promise<object>} Résultat de l'agrégation
 */
async function getAggregation(aggregationType, dataProvider, forceRefresh = false) {
  const aggregationConfig = aggregationsConfig[aggregationType];
  
  if (!aggregationConfig) {
    throw new Error(`Type d'agrégation inconnu: ${aggregationType}`);
  }
  
  const cacheKey = aggregationConfig.cacheKey;
  
  // Vérifier le cache, sauf si on force un rafraîchissement
  if (!forceRefresh) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Calculer l'agrégation
  const result = await aggregationConfig.calculation(dataProvider);
  
  // Mettre en cache le résultat
  cache.set(cacheKey, result, null, aggregationConfig.ttl);
  
  return result;
}

/**
 * Crée une agrégation personnalisée
 * @param {string} name - Nom de l'agrégation
 * @param {object} config - Configuration de l'agrégation
 * @returns {object} Configuration complète de l'agrégation
 */
function createCustomAggregation(name, config) {
  if (!name || !config || !config.calculation || typeof config.calculation !== 'function') {
    throw new Error('Une agrégation personnalisée doit avoir un nom et une fonction de calcul');
  }
  
  const aggregationConfig = {
    cacheKey: config.cacheKey || `aggregation:${name}`,
    ttl: config.ttl || 60 * 5, // 5 minutes par défaut
    calculation: config.calculation
  };
  
  aggregationsConfig[name] = aggregationConfig;
  
  return aggregationConfig;
}

/**
 * Invalide le cache pour une agrégation spécifique
 * @param {string} aggregationType - Type d'agrégation
 */
function invalidateAggregation(aggregationType) {
  const aggregationConfig = aggregationsConfig[aggregationType];
  
  if (aggregationConfig) {
    cache.invalidate(aggregationConfig.cacheKey);
  }
}

/**
 * Invalide toutes les agrégations en cache
 */
function invalidateAllAggregations() {
  Object.values(aggregationsConfig).forEach(config => {
    cache.invalidate(config.cacheKey);
  });
}

/**
 * Crée un fournisseur de données pour les agrégations basé sur des fonctions d'accès
 * @param {object} accessors - Fonctions d'accès aux données
 * @returns {object} Fournisseur de données
 */
function createDataProvider(accessors) {
  return {
    getPrograms: accessors.getPrograms || (async () => []),
    getEpisodes: accessors.getEpisodes || (async () => []),
    getTopics: accessors.getTopics || (async () => []),
    getMediaItems: accessors.getMediaItems || (async () => []),
    getRecentEpisodes: accessors.getRecentEpisodes || (async (limit) => []),
    getUpcomingEpisodes: accessors.getUpcomingEpisodes || (async (limit) => [])
  };
}

/**
 * Génère des agrégations filtrées pour un sous-ensemble de données
 * @param {string} aggregationType - Type d'agrégation
 * @param {object} dataProvider - Fournisseur de données brutes
 * @param {object} filters - Filtres à appliquer
 * @param {string} resourceType - Type de ressource pour le filtrage
 * @returns {Promise<object>} Résultat de l'agrégation filtrée
 */
async function getFilteredAggregation(aggregationType, dataProvider, filters, resourceType) {
  // Créer un nouveau fournisseur de données qui applique les filtres
  const filteredProvider = {...dataProvider};
  
  // Pour chaque méthode du fournisseur de données
  for (const [key, originalMethod] of Object.entries(dataProvider)) {
    // Remplacer la méthode par une version qui applique le filtre
    filteredProvider[key] = async (...args) => {
      const data = await originalMethod(...args);
      
      // Si c'est un tableau, appliquer les filtres
      if (Array.isArray(data)) {
        return filterData(data, filters, resourceType);
      }
      
      return data;
    };
  }
  
  // Utiliser ce fournisseur filtré pour l'agrégation
  // Forcer un recalcul (pas de cache) car les filtres sont spécifiques
  return getAggregation(aggregationType, filteredProvider, true);
}

/**
 * Middleware Express pour ajouter des agrégations à la réponse
 * @param {string} aggregationType - Type d'agrégation à utiliser
 * @param {object} dataProvider - Fournisseur de données
 * @returns {Function} Middleware Express
 */
function aggregationMiddleware(aggregationType, dataProvider) {
  return async (req, res, next) => {
    try {
      // Calculer l'agrégation
      const aggregation = await getAggregation(aggregationType, dataProvider);
      
      // Attacher à la requête pour utilisation ultérieure
      req.aggregation = aggregation;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  getAggregation,
  createCustomAggregation,
  invalidateAggregation,
  invalidateAllAggregations,
  createDataProvider,
  getFilteredAggregation,
  aggregationMiddleware,
  DEFAULT_AGGREGATIONS
};