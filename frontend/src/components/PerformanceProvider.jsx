/**
 * Contexte pour l'optimisation des performances de rendu.
 * @module components/PerformanceProvider
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Contexte de performance.
 * @type {React.Context}
 */
const PerformanceContext = createContext();

/**
 * Hook pour utiliser les optimisations de performance.
 * @returns {Object} Méthodes d'optimisation
 */
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * Provider pour les optimisations de performance.
 * @component
 * @description
 * Fournit des méthodes pour :
 * - Débouncer les mises à jour d'état fréquentes
 * - Mettre en cache les résultats de calculs coûteux
 * - Throttler les appels WebSocket
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 */
export function PerformanceProvider({ children }) {
  const [cache] = useState(new Map());
  const [performance, setPerformance] = useState({
    reducedMotion: false,
    lowPerformanceMode: false,
    isLowEndDevice: false,
    touchDevice: false
  });

  /**
   * Met en cache un résultat calculé.
   * @param {string} key - Clé de cache
   * @param {*} value - Valeur à mettre en cache
   * @param {number} [ttl=5000] - Durée de vie en ms
   */
  const setCacheValue = useCallback((key, value, ttl = 5000) => {
    cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }, [cache]);

  /**
   * Récupère une valeur du cache.
   * @param {string} key - Clé de cache
   * @returns {*} Valeur en cache ou undefined si expirée
   */
  const getCacheValue = useCallback((key) => {
    const item = cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expires) {
      cache.delete(key);
      return undefined;
    }
    return item.value;
  }, [cache]);

  /**
   * Débounce une fonction.
   * @param {Function} fn - Fonction à débouncer
   * @param {number} delay - Délai en ms
   * @returns {Function} Fonction debouncée
   */
  const debounce = useCallback((fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  /**
   * Throttle une fonction.
   * @param {Function} fn - Fonction à throttler
   * @param {number} limit - Limite en ms
   * @returns {Function} Fonction throttlée
   */
  const throttle = useCallback((fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  useEffect(() => {
    // Détecte les préférences de réduction de mouvement
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Détecte si c'est un appareil tactile
    const isTouch = window.matchMedia('(hover: none)').matches;
    
    // Détecte les appareils moins puissants
    const isLowEnd = () => {
      // Vérifie le nombre de cœurs CPU
      const cpuCores = navigator.hardwareConcurrency || 1;
      
      // Vérifie la mémoire disponible (si supporté)
      const lowRAM = navigator?.deviceMemory 
        ? navigator.deviceMemory < 4 
        : false;

      // Vérifie si c'est un appareil mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      return (cpuCores <= 4) || lowRAM || isMobile;
    };

    // Met à jour l'état avec les résultats
    setPerformance({
      reducedMotion: prefersReducedMotion,
      lowPerformanceMode: isLowEnd(),
      isLowEndDevice: isLowEnd(),
      touchDevice: isTouch
    });

    // Ajoute les classes CSS appropriées
    document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion);
    document.documentElement.classList.toggle('low-performance', isLowEnd());
    document.documentElement.classList.toggle('touch-device', isTouch);
  }, []);

  return (
    <PerformanceContext.Provider value={{
      setCacheValue,
      getCacheValue,
      debounce,
      throttle,
      ...performance
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}