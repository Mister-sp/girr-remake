/**
 * Service de surveillance des performances pour identifier les goulots d'étranglement
 * dans l'application frontend.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      // Seuils en millisecondes pour différentes catégories d'opérations
      render: 16, // ~60fps
      api: 1000,  // 1s pour les appels API
      computation: 50, // 50ms pour les calculs lourds
      transition: 300 // 300ms pour les animations/transitions
    };

    // Activation de la surveillance selon l'environnement
    this.enabled = process.env.NODE_ENV === 'development' || 
                   localStorage.getItem('enablePerformanceMonitoring') === 'true';
    
    // Activation des traces détaillées
    this.detailedTracingEnabled = localStorage.getItem('enableDetailedPerformanceTracing') === 'true';
    
    // Initialisation de l'observateur d'entrées longues si disponible
    this._initLongTaskObserver();
    
    // Intervalle pour le nettoyage des métriques anciennes
    this._cleanupInterval = setInterval(() => this._cleanupOldMetrics(), 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Active ou désactive la surveillance des performances
   * @param {boolean} enable - Si true, active la surveillance
   * @param {boolean} detailed - Si true, active les traces détaillées
   */
  setEnabled(enable, detailed = false) {
    this.enabled = enable;
    this.detailedTracingEnabled = detailed;
    
    if (enable) {
      localStorage.setItem('enablePerformanceMonitoring', 'true');
      if (detailed) {
        localStorage.setItem('enableDetailedPerformanceTracing', 'true');
      } else {
        localStorage.removeItem('enableDetailedPerformanceTracing');
      }
    } else {
      localStorage.removeItem('enablePerformanceMonitoring');
      localStorage.removeItem('enableDetailedPerformanceTracing');
    }
  }

  /**
   * Initialise l'observateur d'entrées longues (pour détecter les tâches bloquantes)
   * @private
   */
  _initLongTaskObserver() {
    if ('PerformanceObserver' in window) {
      try {
        // Observer les tâches longues (qui bloquent le thread principal)
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this._recordMetric('long-task', {
              duration: entry.duration,
              name: 'Long Task',
              startTime: entry.startTime,
              attribution: entry.attribution?.map(a => a.name || 'unknown').join(',') || 'unknown'
            });
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('PerformanceObserver for longtask not supported', e);
      }
    }
  }

  /**
   * Commence à mesurer une opération
   * 
   * @param {string} name - Nom de l'opération
   * @param {string} category - Catégorie de l'opération ('render', 'api', etc.)
   * @returns {string} ID unique pour cette mesure
   */
  start(name, category = 'general') {
    if (!this.enabled) return name;
    
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      name,
      category,
      startTime: performance.now(),
      inProgress: true
    });
    
    if (this.detailedTracingEnabled) {
      console.group(`⏱️ Début: ${name} [${category}]`);
      console.trace(`Mesure démarrée à ${new Date().toISOString()}`);
      console.groupEnd();
    }
    
    return id;
  }

  /**
   * Termine la mesure d'une opération et enregistre la métrique
   * 
   * @param {string} id - ID retourné par la méthode start()
   * @param {Object} additionalData - Données supplémentaires à associer à cette mesure
   * @returns {number|null} Durée en ms, ou null si la mesure n'existe pas
   */
  end(id, additionalData = {}) {
    if (!this.enabled || !this.metrics.has(id)) return null;
    
    const metric = this.metrics.get(id);
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    metric.inProgress = false;
    metric.timestamp = Date.now();
    metric.additionalData = additionalData;
    
    // Vérifier si cette opération dépasse le seuil défini pour sa catégorie
    const threshold = this.thresholds[metric.category] || this.thresholds.general || 100;
    metric.isSlowOperation = duration > threshold;
    
    if (metric.isSlowOperation || this.detailedTracingEnabled) {
      const icon = metric.isSlowOperation ? '🐢 LENT' : '✅ OK';
      console.group(`${icon}: ${metric.name} [${metric.category}] - ${duration.toFixed(2)}ms`);
      
      if (metric.isSlowOperation) {
        console.warn(`Cette opération a dépassé le seuil recommandé de ${threshold}ms`);
      }
      
      console.info('Détails:', {
        ...metric,
        additionalData
      });
      
      console.groupEnd();
    }
    
    return duration;
  }

  /**
   * Mesure le temps d'exécution d'une fonction
   * 
   * @param {Function} fn - Fonction à mesurer
   * @param {string} name - Nom descriptif
   * @param {string} category - Catégorie de l'opération
   * @returns {*} Résultat de la fonction
   */
  measure(fn, name, category = 'computation') {
    if (!this.enabled) return fn();
    
    const id = this.start(name, category);
    let result;
    
    try {
      result = fn();
      
      // Si c'est une promesse, traiter correctement
      if (result instanceof Promise) {
        return result.then(value => {
          this.end(id, { async: true });
          return value;
        }).catch(error => {
          this.end(id, { async: true, error: error.message });
          throw error;
        });
      } 
      
      this.end(id);
      return result;
    } catch (error) {
      this.end(id, { error: error.message });
      throw error;
    }
  }

  /**
   * Crée un wrapper autour d'une fonction pour la mesurer automatiquement
   * 
   * @param {Function} fn - Fonction à mesurer
   * @param {string} name - Nom descriptif
   * @param {string} category - Catégorie de l'opération
   * @returns {Function} Fonction wrappée
   */
  wrapFunction(fn, name, category = 'computation') {
    if (!this.enabled) return fn;
    
    return (...args) => this.measure(() => fn(...args), name, category);
  }

  /**
   * Décore une classe de composant React pour mesurer ses méthodes de cycle de vie
   * 
   * @param {React.Component} Component - Classe de composant React
   * @param {string} componentName - Nom du composant
   * @returns {React.Component} Composant avec mesures de performance
   */
  monitorComponent(Component, componentName = Component.displayName || Component.name) {
    if (!this.enabled) return Component;
    
    const lifecycleMethods = [
      'render',
      'componentDidMount', 
      'componentDidUpdate', 
      'componentWillUnmount',
      'getDerivedStateFromProps',
      'shouldComponentUpdate'
    ];

    const self = this;
    
    // Décorer chaque méthode du cycle de vie
    lifecycleMethods.forEach(method => {
      const originalMethod = Component.prototype[method];
      if (originalMethod) {
        Component.prototype[method] = function(...args) {
          const id = self.start(`${componentName}.${method}`, method === 'render' ? 'render' : 'lifecycle');
          let result;
          
          try {
            result = originalMethod.apply(this, args);
          } finally {
            self.end(id, { props: this.props });
          }
          
          return result;
        };
      }
    });
    
    return Component;
  }

  /**
   * Enregistre directement une métrique de performance
   * 
   * @param {string} name - Nom de la métrique
   * @param {Object} data - Données de la métrique
   * @private
   */
  _recordMetric(name, data) {
    if (!this.enabled) return;
    
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      ...data,
      name,
      timestamp: Date.now(),
      inProgress: false
    });
    
    // Si c'est une opération lente ou que le traçage détaillé est activé
    if ((data.duration && data.duration > (this.thresholds[data.category] || 100)) || 
        this.detailedTracingEnabled) {
      console.warn(`🔍 Métrique enregistrée: ${name}`, data);
    }
  }

  /**
   * Nettoie les métriques plus anciennes que la limite définie
   * @private
   */
  _cleanupOldMetrics() {
    if (!this.enabled) return;
    
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;
    
    this.metrics.forEach((metric, id) => {
      // Ne pas supprimer les opérations en cours
      if (!metric.inProgress && (now - metric.timestamp) > maxAge) {
        this.metrics.delete(id);
        cleaned++;
      }
    });
    
    if (cleaned > 0 && this.detailedTracingEnabled) {
      console.info(`🧹 ${cleaned} métriques de performance nettoyées`);
    }
  }

  /**
   * Récupère les statistiques globales de performance
   * 
   * @returns {Object} Statistiques de performance
   */
  getStats() {
    if (!this.enabled) return { enabled: false };
    
    const stats = {
      enabled: true,
      totalMetrics: this.metrics.size,
      operationsInProgress: 0,
      slowOperations: 0,
      categorySummary: {},
      detailedTracingEnabled: this.detailedTracingEnabled
    };
    
    this.metrics.forEach(metric => {
      // Compter les opérations en cours
      if (metric.inProgress) {
        stats.operationsInProgress++;
      }
      
      // Compter les opérations lentes
      if (metric.isSlowOperation) {
        stats.slowOperations++;
      }
      
      // Résumé par catégorie
      if (metric.category) {
        if (!stats.categorySummary[metric.category]) {
          stats.categorySummary[metric.category] = {
            count: 0,
            totalDuration: 0,
            slowCount: 0,
            avgDuration: 0,
            maxDuration: 0,
          };
        }
        
        const summary = stats.categorySummary[metric.category];
        summary.count++;
        
        if (metric.duration) {
          summary.totalDuration += metric.duration;
          summary.avgDuration = summary.totalDuration / summary.count;
          summary.maxDuration = Math.max(summary.maxDuration, metric.duration);
          
          if (metric.isSlowOperation) {
            summary.slowCount++;
          }
        }
      }
    });
    
    return stats;
  }

  /**
   * Récupère les opérations lentes selon les seuils définis
   * 
   * @param {number} limit - Nombre maximum d'opérations à retourner
   * @returns {Array} Liste des opérations lentes
   */
  getSlowOperations(limit = 50) {
    if (!this.enabled) return [];
    
    const slowOps = Array.from(this.metrics.values())
      .filter(metric => metric.isSlowOperation && !metric.inProgress)
      .sort((a, b) => b.duration - a.duration) // Tri par durée décroissante
      .slice(0, limit)
      .map(metric => ({
        name: metric.name,
        category: metric.category,
        duration: metric.duration,
        timestamp: metric.timestamp,
        threshold: this.thresholds[metric.category] || 100
      }));
    
    return slowOps;
  }
}

// Instance singleton pour l'application
const performanceMonitor = new PerformanceMonitor();

// Créer un hook de débogage global pour faciliter l'accès depuis la console
if (typeof window !== 'undefined') {
  window.__PERF_MONITOR__ = performanceMonitor;
}

export default performanceMonitor;