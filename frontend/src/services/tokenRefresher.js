/**
 * Service de gestion du rafraîchissement automatique des tokens d'authentification.
 * @module services/tokenRefresher
 */

import axios from 'axios';
import jwtDecode from 'jwt-decode';
import AuthService from './auth';

const REFRESH_MARGIN_MINUTES = 5; // Rafraîchir le token 5 minutes avant expiration
let refreshTimer = null;

/**
 * Détermine le délai avant la prochaine vérification du token.
 * @returns {number} Délai en millisecondes ou -1 si pas de token
 * @private
 */
function getRefreshDelay() {
  try {
    const token = AuthService.getToken();
    if (!token) return -1;

    const decodedToken = jwtDecode(token);
    if (!decodedToken.exp) return -1;

    // Calculer le temps restant avant expiration (en secondes)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedToken.exp - currentTime;
    
    // Soustraire la marge (en secondes)
    const refreshMargin = REFRESH_MARGIN_MINUTES * 60;
    const refreshDelay = (timeUntilExpiry - refreshMargin) * 1000;
    
    // Si le token est déjà proche de l'expiration ou expiré, rafraîchir immédiatement
    return Math.max(0, refreshDelay);
  } catch (error) {
    console.error('Erreur de calcul du délai de rafraîchissement:', error);
    return 60000; // En cas d'erreur, réessayer dans 1 minute
  }
}

/**
 * Tente de rafraîchir le token.
 * @returns {Promise<boolean>} True si rafraîchi avec succès
 * @private
 */
async function refreshToken() {
  try {
    const response = await axios.post('/api/auth/refresh-token', {}, {
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`
      }
    });
    
    if (response.data && response.data.token) {
      AuthService.setToken(response.data.token);
      console.log('Token rafraîchi avec succès');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return false;
  }
}

/**
 * Planifie la prochaine vérification du token.
 * @private
 */
function scheduleNextCheck() {
  // Annuler le timer existant s'il y en a un
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  const delay = getRefreshDelay();
  
  // Si pas de token ou délai invalide, ne pas planifier de vérification
  if (delay < 0) return;
  
  refreshTimer = setTimeout(async () => {
    const success = await refreshToken();
    
    // Replanifier, que le rafraîchissement soit réussi ou non
    scheduleNextCheck();
    
    // Si échec du rafraîchissement, notifier l'utilisateur
    if (!success) {
      // Émettre un événement que les composants peuvent écouter
      window.dispatchEvent(new CustomEvent('token-refresh-failed'));
    }
  }, delay);
}

/**
 * Démarre le service de rafraîchissement automatique des tokens.
 */
export function startTokenRefresher() {
  scheduleNextCheck();
  
  // Écouter les changements de connexion/déconnexion
  window.addEventListener('storage', (event) => {
    if (event.key === 'fremen_auth_token') {
      scheduleNextCheck();
    }
  });
}

/**
 * Arrête le service de rafraîchissement automatique des tokens.
 */
export function stopTokenRefresher() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export default {
  startTokenRefresher,
  stopTokenRefresher,
  getRefreshDelay,  // Exposé pour les tests
  refreshToken      // Exposé pour un rafraîchissement manuel
};