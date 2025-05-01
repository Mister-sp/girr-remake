import React, { createContext, useContext, useEffect, useState } from 'react';

const PerformanceContext = createContext({
  reducedMotion: false,
  lowPerformanceMode: false,
  isLowEndDevice: false,
  touchDevice: false
});

export function PerformanceProvider({ children }) {
  const [performance, setPerformance] = useState({
    reducedMotion: false,
    lowPerformanceMode: false,
    isLowEndDevice: false,
    touchDevice: false
  });

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
    <PerformanceContext.Provider value={performance}>
      {children}
    </PerformanceContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function usePerformance() {
  return useContext(PerformanceContext);
}