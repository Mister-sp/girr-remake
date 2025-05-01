const fs = require('fs').promises;
const path = require('path');
const { store, saveStore } = require('../data/store');
const logger = require('./logger');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../data/backups');
const DEFAULT_CONFIG = {
  maxBackups: 10,
  intervalHours: 1,
  enabled: true
};

// État interne
let backupInterval = null;

// Obtenir la configuration actuelle
function getBackupConfig() {
  return {
    maxBackups: store.backupSettings?.maxBackups ?? DEFAULT_CONFIG.maxBackups,
    intervalHours: store.backupSettings?.intervalHours ?? DEFAULT_CONFIG.intervalHours,
    enabled: store.backupSettings?.enabled ?? DEFAULT_CONFIG.enabled
  };
}

// Mettre à jour la configuration
function updateBackupConfig(newConfig) {
  store.backupSettings = {
    ...getBackupConfig(),
    ...newConfig
  };
  saveStore();
  
  // Redémarrer le backup automatique avec les nouveaux paramètres
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
  
  if (store.backupSettings.enabled) {
    startAutoBackup();
  }
  
  return store.backupSettings;
}

// Créer un backup avec la date dans le nom
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    
    // Créer l'objet de backup (même format que l'export)
    const backupData = {
      programs: store.programs || [],
      episodes: store.episodes || [],
      topics: store.topics || [],
      mediaItems: store.mediaItems || [],
      transitionSettings: store.transitionSettings || {},
      backupSettings: store.backupSettings || DEFAULT_CONFIG,
      backupDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Écrire le fichier de backup
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    logger.info(`Backup créé avec succès: ${backupPath}`);

    // Nettoyer les anciens backups
    await cleanOldBackups();
  } catch (error) {
    logger.error('Erreur lors de la création du backup:', error);
  }
}

// Supprimer les backups les plus anciens si on dépasse MAX_BACKUPS
async function cleanOldBackups() {
  const config = getBackupConfig();
  try {
    // Lister tous les fichiers de backup
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
    
    // Trier par date (du plus récent au plus ancien)
    const sortedFiles = backupFiles.sort((a, b) => b.localeCompare(a));
    
    // Supprimer les fichiers en trop
    const filesToDelete = sortedFiles.slice(config.maxBackups);
    for (const file of filesToDelete) {
      const filePath = path.join(BACKUP_DIR, file);
      await fs.unlink(filePath);
      logger.info(`Ancien backup supprimé: ${filePath}`);
    }
  } catch (error) {
    logger.error('Erreur lors du nettoyage des anciens backups:', error);
  }
}

// Restaurer un backup spécifique
async function restoreBackup(filename) {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    const backupContent = await fs.readFile(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);

    // Vérifier que le backup est valide
    if (!backupData.programs || !backupData.episodes || !backupData.topics || !backupData.mediaItems) {
      throw new Error('Format de backup invalide');
    }

    // Mettre à jour le store avec les données du backup
    store.programs = backupData.programs;
    store.episodes = backupData.episodes;
    store.topics = backupData.topics;
    store.mediaItems = backupData.mediaItems;
    if (backupData.transitionSettings) {
      store.transitionSettings = backupData.transitionSettings;
    }

    logger.info(`Backup restauré avec succès: ${filename}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la restauration du backup ${filename}:`, error);
    throw error;
  }
}

// Lister tous les backups disponibles
async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    return files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
  } catch (error) {
    logger.error('Erreur lors de la liste des backups:', error);
    return [];
  }
}

// Initialisation : créer le dossier de backup s'il n'existe pas
async function init() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      logger.error('Erreur lors de la création du dossier de backup:', error);
    }
  }
}

// Démarrer le système de backup automatique
function startAutoBackup() {
  const config = getBackupConfig();
  
  if (!config.enabled) {
    logger.info('Système de backup automatique désactivé');
    return;
  }

  // Créer un backup immédiatement au démarrage
  createBackup();
  
  // Puis créer un backup périodiquement
  const intervalMs = config.intervalHours * 60 * 60 * 1000;
  backupInterval = setInterval(createBackup, intervalMs);
  logger.info(`Système de backup automatique démarré (intervalle: ${config.intervalHours}h)`);
}

module.exports = {
  init,
  startAutoBackup,
  createBackup,
  restoreBackup,
  listBackups,
  getBackupConfig,
  updateBackupConfig
};