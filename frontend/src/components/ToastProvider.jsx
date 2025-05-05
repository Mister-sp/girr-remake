import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Création du contexte pour le système de toasts
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [counter, setCounter] = useState(0);
  const toastTimersRef = useRef({});
  const toastProgressRef = useRef({});
  const liveRegionRef = useRef(null);
  
  // Nettoyage des timers lorsque le composant est démonté
  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach(timer => clearTimeout(timer));
      Object.values(toastProgressRef.current).forEach(interval => clearInterval(interval));
    };
  }, []);

  // Annoncer les nouveaux toasts pour les lecteurs d'écran
  useEffect(() => {
    if (toasts.length > 0) {
      const latestToast = toasts[toasts.length - 1];
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = latestToast.message;
      }
    }
  }, [toasts]);

  const addToast = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = 5000,
      position = 'top-right',
      actions = [],
      dismissible = true,
      icon = null,
      showProgress = true,
    } = options;

    const id = String(counter);
    setCounter(prev => prev + 1);

    const newToast = {
      id,
      message,
      type,
      position,
      actions,
      dismissible,
      visible: true,
      icon,
      progress: showProgress ? 100 : null,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      // Set main timer for toast dismissal
      toastTimersRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, duration);
      
      // Set progress timer if progress is enabled
      if (showProgress) {
        const startTime = Date.now();
        const interval = 16; // ~60fps
        
        toastProgressRef.current[id] = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          
          setToasts(prev => 
            prev.map(toast => 
              toast.id === id ? { ...toast, progress: remaining } : toast
            )
          );
          
          if (remaining <= 0) {
            clearInterval(toastProgressRef.current[id]);
            delete toastProgressRef.current[id];
          }
        }, interval);
      }
    }

    return id;
  }, [counter]);

  const updateToast = useCallback((id, message, options = {}) => {
    const toast = toasts.find(t => t.id === id);
    if (!toast) return;

    const updatedToast = {
      ...toast,
      message: message || toast.message,
      ...options
    };
    
    setToasts(prev => prev.map(t => t.id === id ? updatedToast : t));
    
    // Reset timers if duration is provided
    if (options.duration) {
      // Clear existing timers
      if (toastTimersRef.current[id]) {
        clearTimeout(toastTimersRef.current[id]);
      }
      if (toastProgressRef.current[id]) {
        clearInterval(toastProgressRef.current[id]);
      }
      
      // Set new timers
      toastTimersRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, options.duration);
      
      if (updatedToast.progress !== null) {
        const startTime = Date.now();
        const interval = 16;
        
        toastProgressRef.current[id] = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / options.duration) * 100);
          
          setToasts(prev => 
            prev.map(toast => 
              toast.id === id ? { ...toast, progress: remaining } : toast
            )
          );
          
          if (remaining <= 0) {
            clearInterval(toastProgressRef.current[id]);
            delete toastProgressRef.current[id];
          }
        }, interval);
      }
    }
    
    return id;
  }, [toasts]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    // Suppression après l'animation de sortie
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);

    // Nettoyage des timers
    if (toastTimersRef.current[id]) {
      clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
    
    if (toastProgressRef.current[id]) {
      clearInterval(toastProgressRef.current[id]);
      delete toastProgressRef.current[id];
    }
  }, []);

  const pauseTimer = useCallback((id) => {
    // Store current progress value
    const toast = toasts.find(t => t.id === id);
    if (toast) {
      toast.pausedProgress = toast.progress;
    }
    
    // Clear timers
    if (toastTimersRef.current[id]) {
      clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
    
    if (toastProgressRef.current[id]) {
      clearInterval(toastProgressRef.current[id]);
      delete toastProgressRef.current[id];
    }
  }, [toasts]);

  const resumeTimer = useCallback((id, duration = 5000) => {
    const toast = toasts.find(t => t.id === id);
    if (toast && toast.visible) {
      // Calculate remaining time based on progress
      const remainingPercentage = toast.pausedProgress || 0;
      const remainingTime = (remainingPercentage / 100) * toast.duration;
      
      // Set new timer
      toastTimersRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, remainingTime);
      
      // Resume progress
      if (toast.progress !== null) {
        const startTime = Date.now();
        const interval = 16;
        
        toastProgressRef.current[id] = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, remainingPercentage - (elapsed / remainingTime) * remainingPercentage);
          
          setToasts(prev => 
            prev.map(t => 
              t.id === id ? { ...t, progress: remaining } : t
            )
          );
          
          if (remaining <= 0) {
            clearInterval(toastProgressRef.current[id]);
            delete toastProgressRef.current[id];
          }
        }, interval);
      }
    }
  }, [toasts, dismissToast]);

  const value = {
    addToast,
    dismissToast,
    updateToast
  };

  // Positions pour les toasts
  const getPositionStyle = (position) => {
    switch (position) {
      case 'top-left': return { top: '30px', left: '30px' };
      case 'top-center': return { top: '30px', left: '50%', transform: 'translateX(-50%)' };
      case 'top-right': return { top: '30px', right: '30px' };
      case 'bottom-left': return { bottom: '30px', left: '30px' };
      case 'bottom-center': return { bottom: '30px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right': return { bottom: '30px', right: '30px' };
      default: return { top: '30px', right: '30px' };
    }
  };

  // Fonction pour déterminer l'animation d'entrée en fonction de la position
  const getEnterAnimationClass = (position) => {
    if (position.startsWith('top')) return 'toast-enter-top';
    if (position.startsWith('bottom')) return 'toast-enter-bottom';
    return 'toast-enter-right';
  };

  // Fonction pour déterminer l'animation de sortie en fonction de la position
  const getExitAnimationClass = (position) => {
    if (position.startsWith('top')) return 'toast-exit-top';
    if (position.startsWith('bottom')) return 'toast-exit-bottom';
    return 'toast-exit-right';
  };

  // Grouper les toasts par position
  const positionGroups = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-right';
    if (!acc[position]) acc[position] = [];
    acc[position].push(toast);
    return acc;
  }, {});

  // Icônes par défaut pour chaque type de toast
  const getDefaultIcon = (type) => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return null;
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Région live pour l'accessibilité */}
      <div 
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Conteneurs de toasts pour chaque position */}
      {Object.entries(positionGroups).map(([position, positionToasts]) => (
        <div 
          key={position} 
          className={`toast-container toast-position-${position}`}
          style={getPositionStyle(position)}
        >
          {positionToasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type} ${
                toast.visible 
                  ? `toast-visible ${getEnterAnimationClass(position)}`
                  : getExitAnimationClass(position)
              }`}
              role="alert"
              aria-live="assertive"
              onMouseEnter={() => pauseTimer(toast.id)}
              onMouseLeave={() => resumeTimer(toast.id, toast.duration)}
            >
              <div className="toast-content">
                {/* Icon section */}
                {(toast.icon || getDefaultIcon(toast.type)) && (
                  <div className="toast-icon">
                    {toast.icon || getDefaultIcon(toast.type)}
                  </div>
                )}
                
                <div className="toast-message-container">
                  <span className="toast-message">{toast.message}</span>
                  
                  {toast.actions && toast.actions.length > 0 && (
                    <div className="toast-actions">
                      {toast.actions.map((action, index) => (
                        <button 
                          key={index}
                          className="toast-action-button"
                          onClick={() => {
                            if (action.onClick) action.onClick();
                            if (action.closeToast !== false) dismissToast(toast.id);
                          }}
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  {toast.progress !== null && (
                    <div className="toast-progress-container">
                      <div 
                        className="toast-progress-bar"
                        style={{ width: `${toast.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {toast.dismissible && (
                <button 
                  className="toast-close-button"
                  aria-label="Fermer"
                  onClick={() => dismissToast(toast.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ToastProvider;
