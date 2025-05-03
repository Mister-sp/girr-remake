/**
 * Configuration et gestion des sauvegardes automatiques.
 * @module config/backup
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { store, saveStore } = require('../data/store');

/**
 * Configuration des sauvegardes.
 * @type {Object}
 */
let backupConfig = {
    interval: 15 * 60 * 1000, // 15 minutes
    maxBackups: 50,
    backupDir: path.join(__dirname, '../data/backups'),
    enabled: true
};

/**
 * Obtient la configuration actuelle des backups.
 * @returns {Object} Configuration des backups
 */
function getBackupConfig() {
    return { ...backupConfig };
}

/**
 * Met à jour la configuration des backups.
 * @param {Object} newConfig - Nouvelle configuration
 * @returns {Object} Configuration mise à jour
 */
function updateBackupConfig(newConfig) {
    backupConfig = {
        ...backupConfig,
        ...newConfig
    };
    return getBackupConfig();
}

/**
 * Initialise le système de sauvegardes.
 * @async
 * @returns {Promise<void>}
 */
async function setupBackup() {
  // Créer le dossier de backup si nécessaire
  if (!fs.existsSync(backupConfig.backupDir)) {
    fs.mkdirSync(backupConfig.backupDir, { recursive: true });
  }

  // Nettoyer les anciennes sauvegardes
  await cleanOldBackups();

  // Démarrer les sauvegardes automatiques
  setInterval(createBackup, backupConfig.interval);
  logger.info('Système de backup initialisé');
}

/**
 * Crée une nouvelle sauvegarde.
 * @async
 * @returns {Promise<string>} Chemin du fichier de sauvegarde
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(
      backupConfig.backupDir,
      `backup-${timestamp}.json`
    );

    await fs.promises.writeFile(
      backupPath,
      JSON.stringify(store, null, 2)
    );

    logger.info(`Backup créé: ${backupPath}`);
    return backupPath;
  } catch (err) {
    logger.error('Erreur lors de la création du backup:', err);
    throw err;
  }
}

/**
 * Supprime les anciennes sauvegardes.
 * @async
 * @returns {Promise<void>}
 */
async function cleanOldBackups() {
  try {
    const files = await fs.promises.readdir(backupConfig.backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupConfig.backupDir, f),
        time: fs.statSync(path.join(backupConfig.backupDir, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Garder seulement les N plus récents
    if (backupFiles.length > backupConfig.maxBackups) {
      const toDelete = backupFiles.slice(backupConfig.maxBackups);
      for (const file of toDelete) {
        await fs.promises.unlink(file.path);
        logger.info(`Ancien backup supprimé: ${file.name}`);
      }
    }
  } catch (err) {
    logger.error('Erreur lors du nettoyage des backups:', err);
  }
}

/**
 * Liste les sauvegardes disponibles.
 * @async
 * @returns {Promise<Array>} Liste des fichiers de sauvegarde
 */
async function listBackups() {
  try {
    const files = await fs.promises.readdir(backupConfig.backupDir);
    return files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupConfig.backupDir, f),
        time: fs.statSync(path.join(backupConfig.backupDir, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);
  } catch (err) {
    logger.error('Erreur lors de la liste des backups:', err);
    return [];
  }
}

/**
 * Restaure une sauvegarde.
 * @async
 * @param {string} backupName - Nom du fichier de sauvegarde
 * @returns {Promise<void>}
 */
async function restoreBackup(backupName) {
  try {
    const backupPath = path.join(backupConfig.backupDir, backupName);
    const data = JSON.parse(await fs.promises.readFile(backupPath));
    
    // Créer une sauvegarde avant la restauration
    await createBackup();

    // Restaurer les données
    Object.assign(store, data);
    await saveStore();
    
    logger.info(`Backup restauré: ${backupName}`);
  } catch (err) {
    logger.error('Erreur lors de la restauration du backup:', err);
    throw err;
  }
}

module.exports = {
  setupBackup,
  createBackup,
  listBackups,
  restoreBackup,
  getBackupConfig,
  updateBackupConfig
};