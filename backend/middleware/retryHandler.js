/**
 * Middleware de gestion des retries pour les opérations critiques du backend
 * Permet de gérer automatiquement les tentatives de reconnexion en cas d'erreur
 */
const logger = require('../config/logger');

/**
 * Fonction qui enveloppe une promesse avec un mécanisme de retry
 * 
 * @param {Function} promiseFactory - Fonction qui retourne une promesse 
 * @param {Object} options - Options de configuration
 * @param {number} options.retries - Nombre maximum de tentatives (par défaut: 3)
 * @param {number} options.retryDelay - Délai initial entre les tentatives en ms (par défaut: 300)
 * @param {Function} options.onRetry - Callback appelé avant chaque nouvelle tentative (erreur, tentative)
 * @param {Function} options.shouldRetry - Fonction pour déterminer si on doit réessayer (erreur) => boolean
 * @returns {Promise} - Résultat de la promesse ou erreur après épuisement des tentatives
 */
const retryPromise = async (promiseFactory, options = {}) => {
  const {
    retries = 3,
    retryDelay = 300,
    onRetry = () => {},
    shouldRetry = (error) => {
      // Par défaut, on réessaie pour les erreurs de connexion ou de timeout
      return (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.status === 503 || // Service Unavailable
        error.status === 429    // Too Many Requests
      );
    }
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await promiseFactory();
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Si on a épuisé toutes les tentatives ou qu'on ne devrait pas réessayer cette erreur
      if (attempt > retries || !shouldRetry(error)) {
        logger.error(`Échec définitif après ${attempt} tentative(s): ${error.message}`, {
          error,
          attempts: attempt
        });
        throw error;
      }

      // Calcul du délai avec backoff exponentiel
      const delay = retryDelay * Math.pow(2, attempt - 1);
      
      // Ajouter une variation aléatoire (jitter) pour éviter une congestion synchronisée
      const jitter = Math.random() * 300;
      const finalDelay = delay + jitter;
      
      logger.warn(`Tentative ${attempt}/${retries} échouée: ${error.message}. Nouvel essai dans ${Math.round(finalDelay)}ms`, {
        error: error.message,
        attempt,
        delay: finalDelay
      });

      // Notification de la tentative
      onRetry(error, attempt);
      
      // Attente avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
};

/**
 * Middleware Express qui enveloppe les gestionnaires de route avec un mécanisme de retry
 * 
 * @param {Function} handler - Gestionnaire de route Express
 * @param {Object} options - Options de configuration du retry
 * @returns {Function} - Middleware Express avec gestion des retries
 */
const withRetry = (handler, options = {}) => {
  return async (req, res, next) => {
    try {
      await retryPromise(() => handler(req, res, next), options);
    } catch (error) {
      // Si l'erreur persiste après tous les retries, la passer au gestionnaire d'erreurs
      next(error);
    }
  };
};

/**
 * Utilitaire pour envelopper un service ou une fonction avec un mécanisme de retry
 * 
 * @param {Object} service - Service contenant des méthodes asynchrones
 * @param {Array} methodNames - Noms des méthodes à envelopper
 * @param {Object} options - Options de retry
 * @returns {Object} - Service avec méthodes enveloppées
 */
const retryService = (service, methodNames, options = {}) => {
  const wrappedService = Object.create(service);

  methodNames.forEach((methodName) => {
    const originalMethod = service[methodName];
    
    if (typeof originalMethod !== 'function') {
      return;
    }

    wrappedService[methodName] = async (...args) => {
      return retryPromise(() => originalMethod.apply(service, args), options);
    };
  });

  return wrappedService;
};

module.exports = {
  retryPromise,
  withRetry,
  retryService
};