/**
 * Configuration de l'authentification.
 * @module config/auth
 * 
 * Ce module contient les paramètres de configuration pour le système d'authentification.
 * Il gère les secrets JWT, les délais d'expiration et les identifiants par défaut.
 * 
 * Pour la sécurité en production:
 * 1. Définissez les variables d'environnement JWT_SECRET, ADMIN_USERNAME et ADMIN_PASSWORD
 * 2. Utilisez un secret JWT fort et unique
 * 3. Changez les identifiants admin par défaut
 */

module.exports = {
    /**
     * Secret utilisé pour signer les tokens JWT.
     * En production, définir via la variable d'environnement JWT_SECRET.
     * @type {string}
     */
    jwtSecret: process.env.JWT_SECRET || 'votre-secret-temporaire-a-changer-en-production',
    
    /**
     * Durée de validité des tokens JWT.
     * Format: chaîne de caractères compatible avec la propriété expiresIn de jsonwebtoken.
     * Exemples: '1h', '2d', '10h', '7d'
     * @type {string}
     */
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    
    /**
     * Configuration de l'utilisateur admin par défaut.
     * Ces identifiants sont utilisés uniquement lors de la première initialisation.
     * En production, définir via les variables d'environnement ADMIN_USERNAME et ADMIN_PASSWORD.
     * @type {Object}
     */
    defaultUser: {
        username: process.env.ADMIN_USERNAME || 'admin',
        // Le mot de passe sera hashé à la création
        password: process.env.ADMIN_PASSWORD || 'admin',
    }
};