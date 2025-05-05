import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth';

/**
 * Composant de notifications système pour les erreurs critiques (authentification, API, etc.)
 * Les notifications restent affichées jusqu'à ce que l'utilisateur les ferme ou agisse dessus.
 */
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  
  // Écouter les événements de notification système
  useEffect(() => {
    // Fonction pour ajouter une notification
    const addNotification = (notification) => {
      setNotifications(prev => [...prev, {
        ...notification,
        id: Date.now(),
        timestamp: new Date()
      }]);
    };

    // Échec de rafraîchissement du token
    const handleTokenRefreshFail = () => {
      addNotification({
        type: 'error',
        title: 'Problème d\'authentification',
        message: 'Votre session a expiré ou ne peut pas être renouvelée.',
        action: {
          label: 'Se reconnecter',
          handler: () => {
            AuthService.logout();
            window.location.href = '/login';
          }
        },
        persistent: true
      });
    };

    // Erreur d'API
    const handleApiError = (event) => {
      const { status, message, endpoint } = event.detail;
      
      // Gérer différemment selon le code d'erreur
      if (status === 401 || status === 403) {
        addNotification({
          type: 'error',
          title: 'Erreur d'authentification',
          message: 'Vous n\'êtes pas autorisé à effectuer cette action.',
          persistent: true,
          action: {
            label: 'Se reconnecter',
            handler: () => {
              AuthService.logout();
              window.location.href = '/login';
            }
          }
        });
      } else if (status >= 500) {
        addNotification({
          type: 'error',
          title: 'Erreur serveur',
          message: `Une erreur est survenue (${endpoint}): ${message || 'Problème de communication avec le serveur.'}`,
          persistent: false
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Erreur',
          message: message || 'Une erreur est survenue.',
          persistent: false
        });
      }
    };

    // Erreur de connexion WebSocket
    const handleWebSocketError = (event) => {
      const { error } = event.detail;
      
      addNotification({
        type: 'error',
        title: 'Connexion temps réel perdue',
        message: `${error || 'Problème de connexion temps réel'}. Les fonctionnalités d'OBS peuvent être affectées.`,
        action: {
          label: 'Reconnecter',
          handler: () => {
            // Déclencher une reconnexion WebSocket via un événement personnalisé
            window.dispatchEvent(new CustomEvent('websocket-reconnect'));
            
            // Retirer cette notification
            setNotifications(prev => 
              prev.filter(n => n.title !== 'Connexion temps réel perdue')
            );
          }
        },
        persistent: true
      });
    };
    
    // Enregistrer les gestionnaires d'événements
    window.addEventListener('token-refresh-failed', handleTokenRefreshFail);
    window.addEventListener('api-error', handleApiError);
    window.addEventListener('websocket-error', handleWebSocketError);
    
    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('token-refresh-failed', handleTokenRefreshFail);
      window.removeEventListener('api-error', handleApiError);
      window.removeEventListener('websocket-error', handleWebSocketError);
    };
  }, []);
  
  // Supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Si pas de notifications, ne rien afficher
  if (notifications.length === 0) return null;
  
  return (
    <div className="notification-container" style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      width: '350px',
      maxWidth: '90%',
    }}>
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification notification-${notification.type}`}
          style={{
            backgroundColor: notification.type === 'error' ? '#f44336' : 
                            notification.type === 'warning' ? '#ff9800' : '#4caf50',
            color: '#fff',
            padding: '12px 16px',
            marginBottom: 10,
            borderRadius: 4,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            position: 'relative',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{notification.title}</strong>
            <button
              onClick={() => removeNotification(notification.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 5px'
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ marginTop: 5 }}>{notification.message}</div>
          
          {notification.action && (
            <button
              onClick={() => {
                notification.action.handler();
                removeNotification(notification.id);
              }}
              style={{
                marginTop: 10,
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              {notification.action.label}
            </button>
          )}
        </div>
      ))}
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;