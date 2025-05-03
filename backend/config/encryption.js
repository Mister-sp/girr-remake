/**
 * Module de chiffrement pour sécuriser les données sensibles.
 * @module config/encryption
 * 
 * Ce module fournit des méthodes pour chiffrer et déchiffrer les données sensibles
 * comme les mots de passe externes, les tokens d'API, etc.
 */

const crypto = require('crypto-js');

// Clé de chiffrement - DOIT être définie via variable d'environnement en production
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'fremen-secure-encryption-default-key-change-in-prod';

/**
 * Chiffre une chaîne de caractères ou un objet.
 * Les objets sont automatiquement convertis en JSON.
 * 
 * @param {string|Object} data - Données à chiffrer
 * @returns {string} Données chiffrées en format Base64
 */
function encrypt(data) {
  if (data === undefined || data === null) {
    return null;
  }
  
  // Convertir en string si c'est un objet
  const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  // Chiffrement AES
  const encrypted = crypto.AES.encrypt(dataStr, SECRET_KEY);
  return encrypted.toString();
}

/**
 * Déchiffre une chaîne de caractères préalablement chiffrée.
 * Si les données d'origine étaient un objet JSON, tente de le parser.
 * 
 * @param {string} encryptedData - Données chiffrées
 * @param {boolean} [parseJson=true] - Essayer de parser en JSON si possible
 * @returns {string|Object|null} Données déchiffrées
 */
function decrypt(encryptedData, parseJson = true) {
  if (!encryptedData) return null;
  
  try {
    // Déchiffrement AES
    const decrypted = crypto.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedStr = decrypted.toString(crypto.enc.Utf8);
    
    // Tenter de parser en JSON si demandé et possible
    if (parseJson) {
      try {
        return JSON.parse(decryptedStr);
      } catch (e) {
        // Si ce n'est pas du JSON valide, retourner la chaîne
        return decryptedStr;
      }
    }
    
    return decryptedStr;
  } catch (error) {
    console.error('Erreur de déchiffrement:', error.message);
    return null;
  }
}

/**
 * Génère un hash sécurisé d'une chaîne (non réversible).
 * Utile pour les empreintes numériques, pas pour les données à déchiffrer.
 * 
 * @param {string} data - Données à hasher
 * @returns {string} Hash SHA-256
 */
function hash(data) {
  if (!data) return null;
  return crypto.SHA256(String(data)).toString();
}

module.exports = {
  encrypt,
  decrypt,
  hash
};