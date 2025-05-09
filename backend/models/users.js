/**
 * Gestion des utilisateurs et authentification.
 * @module models/users
 * 
 * Ce module gère les opérations liées aux utilisateurs:
 * - Création de l'utilisateur admin par défaut
 * - Validation des identifiants lors de la connexion
 * - Gestion des mots de passe (hachage, vérification)
 */

const bcrypt = require('bcryptjs');
// Remove top-level require of store to break cycle
// const { store, saveStore } = require('../data/store'); 
const authConfig = require('../config/auth');

// Helper function to get store module when needed
function getStoreModule() {
  return require('../data/store');
}

// Remove top-level initialization, moved into initializeDefaultUser
// if (!store.users) {
//     store.users = [];
// }

/**
 * Crée l'utilisateur admin par défaut s'il n'existe pas déjà.
 * Cette fonction est appelée au démarrage de l'application.
 * Les identifiants sont définis dans config/auth.js ou via variables d'environnement.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function initializeDefaultUser() {
    // Get store and saveStore when the function is called
    const { store, saveStore } = getStoreModule(); 

    // Initialize store.users if it doesn't exist yet
    if (!store.users) {
        store.users = [];
    }

    if (store.users.length === 0) {
        const hashedPassword = await bcrypt.hash(authConfig.defaultUser.password, 10);
        store.users.push({
            id: 1,
            username: authConfig.defaultUser.username,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        await saveStore();
    }
}

/**
 * Valide les identifiants d'un utilisateur.
 * Compare le mot de passe fourni avec le hash stocké.
 * 
 * @async
 * @param {string} username - Nom d'utilisateur
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<Object|null>} - Données utilisateur si valide, null sinon
 */
async function validateCredentials(username, password) {
    // Get store when the function is called
    const { store } = getStoreModule(); 
    const user = store.users.find(u => u.username === username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
}

/**
 * Change le mot de passe d'un utilisateur.
 * 
 * @async
 * @param {number} userId - ID de l'utilisateur
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<boolean>} - True si succès, false si échec
 */
async function changePassword(userId, newPassword) {
    // Get store and saveStore when the function is called
    const { store, saveStore } = getStoreModule(); 
    const user = store.users.find(u => u.id === userId);
    if (!user) return false;

    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    await saveStore();
    return true;
}

module.exports = {
    initializeDefaultUser,
    validateCredentials,
    changePassword
};