/**
 * Service d'authentification pour gérer les opérations liées aux utilisateurs.
 * @module services/auth
 * 
 * Ce service gère:
 * - La connexion et déconnexion des utilisateurs
 * - Le stockage et la récupération des tokens JWT
 * - La vérification du statut d'authentification
 * - La modification des mots de passe
 */

import apiClient from './api';

/**
 * Clé pour stocker le token d'authentification dans le localStorage.
 * @constant {string}
 */
const AUTH_TOKEN_KEY = 'fremen_auth_token';

/**
 * Clé pour stocker les données utilisateur dans le localStorage.
 * @constant {string}
 */
const USER_DATA_KEY = 'fremen_user_data';

/**
 * Gestionnaire d'authentification exposant les méthodes liées à l'authentification.
 * @namespace
 */
export const AuthService = {
    /**
     * Authentifie un utilisateur et stocke son token.
     * @async
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Données utilisateur et token
     * @throws {Error} Erreur de connexion
     */
    async login(username, password) {
        const response = await apiClient.post('/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Déconnecte l'utilisateur en supprimant son token et ses données.
     * Redirige vers la page de connexion.
     * @returns {void}
     */
    logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        window.location.href = '/login';
    },

    /**
     * Récupère le token d'authentification stocké.
     * @returns {string|null} Token JWT ou null si non connecté
     */
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Récupère les données de l'utilisateur connecté.
     * @returns {Object|null} Données utilisateur ou null si non connecté
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(USER_DATA_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Vérifie si un utilisateur est actuellement connecté.
     * @returns {boolean} True si connecté, false sinon
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Change le mot de passe de l'utilisateur.
     * @async
     * @param {number} userId - ID de l'utilisateur
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} Message de confirmation
     * @throws {Error} Erreur de changement de mot de passe
     */
    async changePassword(userId, currentPassword, newPassword) {
        return await apiClient.post('/auth/change-password', {
            userId,
            currentPassword,
            newPassword
        });
    }
};