/**
 * Gestion de l'état et persistance des données.
 * @module data/store
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { topicsCounter, mediaCounter } = require('../config/monitoring');
const backupConfig = require('../config/backup'); // <-- Ajouté: Charger la configuration des backups

/**
 * Structure de données principale.
 * @type {Object}
 */
const store = {
  programs: [],
  episodes: [],
  topics: [],
  mediaItems: [],
  transitionSettings: {
    appearEffect: 'fade',
    disappearEffect: 'fade',
    duration: 0.5,
    timing: 'ease-in-out'
  },
  nextProgramId: 1,
  nextEpisodeId: 1,
  nextTopicId: 1,
  nextMediaId: 1,
  currentScene: null
};

// <-- Ajouté: Index pour recherches rapides -->
const programsById = new Map();
const episodesById = new Map(); // Clé: episodeId, Valeur: episode
const topicsById = new Map(); // Clé: topicId, Valeur: topic
const mediaItemsById = new Map(); // Clé: mediaId, Valeur: mediaItem
// Index pour relations (optimisation potentielle future)
// const episodesByProgramId = new Map(); // Clé: programId, Valeur: Map<episodeId, episode>
// const topicsByEpisodeId = new Map(); // Clé: episodeId, Valeur: Map<topicId, topic>
// const mediaByTopicId = new Map(); // Clé: topicId, Valeur: Map<mediaId, mediaItem>
// <-- Fin Ajout -->


/**
 * Chemin du fichier de stockage.
 * @type {string}
 */
const STORE_PATH = path.join(__dirname, 'store.json');
const BACKUP_PATH = path.join(__dirname, 'store.json.backup'); // Backup simple (écrasée)
const TIMESTAMPED_BACKUP_DIR = path.join(__dirname, 'backups'); // <-- Ajouté: Dossier pour backups horodatés

// <-- Ajouté: Assurer l'existence du dossier de backups -->
if (!fs.existsSync(TIMESTAMPED_BACKUP_DIR)) {
  fs.mkdirSync(TIMESTAMPED_BACKUP_DIR, { recursive: true });
}
// <-- Fin Ajout -->

/**
 * Reconstruit les index à partir des tableaux du store.
 * @private
 */
function buildIndexes() {
  programsById.clear();
  episodesById.clear();
  topicsById.clear();
  mediaItemsById.clear();

  store.programs.forEach(p => programsById.set(p.id, p));
  store.episodes.forEach(e => episodesById.set(e.id, e));
  store.topics.forEach(t => topicsById.set(t.id, t));
  store.mediaItems.forEach(m => mediaItemsById.set(m.id, m));

  // Mettre à jour les métriques Prometheus avec vérification
  try {
    if (topicsCounter && typeof topicsCounter.set === 'function') {
      topicsCounter.set(store.topics.length);
    }
    if (mediaCounter && typeof mediaCounter.set === 'function') {
      mediaCounter.set(store.mediaItems.length);
    }
  } catch (err) {
    logger.warn('Erreur lors de la mise à jour des métriques Prometheus:', err.message);
  }
}


/**
 * Charge les données depuis le fichier.
 * @returns {void}
 */
function loadStore() {
  let loaded = false;
  // 1. Essayer de charger depuis store.json
  if (fs.existsSync(STORE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_PATH));
      Object.assign(store, data);
      buildIndexes(); // <-- Modifié: Construire les index après chargement
      logger.info('Store chargé avec succès depuis store.json');
      loaded = true;
    } catch (err) {
      logger.error('Erreur lors du chargement de store.json:', err);
    }
  }

  // 2. Si échec, essayer depuis store.json.backup
  if (!loaded && fs.existsSync(BACKUP_PATH)) {
    try {
      const backupData = JSON.parse(fs.readFileSync(BACKUP_PATH));
      Object.assign(store, backupData);
      buildIndexes(); // <-- Modifié: Construire les index après chargement
      logger.warn('Store restauré depuis store.json.backup');
      loaded = true;
      // Tenter de sauvegarder immédiatement la version restaurée
      saveStore().catch(err => logger.error('Échec de la sauvegarde après restauration depuis backup simple:', err));
    } catch (backupErr) {
      logger.error('Échec de la restauration depuis store.json.backup:', backupErr);
    }
  }

  // 3. Si toujours échec, essayer depuis le dernier backup horodaté
  if (!loaded) {
    try {
      const latestBackup = getLatestTimestampedBackup();
      if (latestBackup) {
        const backupData = JSON.parse(fs.readFileSync(latestBackup));
        Object.assign(store, backupData);
        buildIndexes(); // <-- Modifié: Construire les index après chargement
        logger.warn(`Store restauré depuis le dernier backup horodaté: ${path.basename(latestBackup)}`);
        loaded = true;
         // Tenter de sauvegarder immédiatement la version restaurée
        saveStore().catch(err => logger.error('Échec de la sauvegarde après restauration depuis backup horodaté:', err));
      }
    } catch (tsBackupErr) {
      logger.error('Échec de la restauration depuis le dernier backup horodaté:', tsBackupErr);
    }
  }

  if (!loaded) {
     logger.warn('Impossible de charger ou restaurer le store. Démarrage avec un store vide.');
     // Assurer que les index sont vides si on démarre à vide
     buildIndexes();
  }
}

// <-- Ajouté: Fonction pour trouver le dernier backup horodaté -->
function getLatestTimestampedBackup() {
  try {
    const files = fs.readdirSync(TIMESTAMPED_BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(TIMESTAMPED_BACKUP_DIR, file),
        time: fs.statSync(path.join(TIMESTAMPED_BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Trier par date de modification décroissante

    return files.length > 0 ? files[0].path : null;
  } catch (err) {
    logger.error('Erreur lors de la recherche du dernier backup horodaté:', err);
    return null;
  }
}
// <-- Fin Ajout -->


/**
 * Sauvegarde les données dans le fichier.
 * @returns {Promise<void>}
 */
async function saveStore() {
  try {
    const dataToSave = JSON.stringify(store, null, 2);

    // 1. Créer une backup simple (écrasée)
    if (fs.existsSync(STORE_PATH)) {
      await fs.promises.copyFile(STORE_PATH, BACKUP_PATH);
    }

    // 2. Créer un backup horodaté (si activé)
    if (backupConfig.enabled) {
       const timestamp = new Date().toISOString().replace(/:/g, '-'); // Format ISO compatible nom de fichier
       const timestampedBackupFilename = `backup-${timestamp}.json`;
       const timestampedBackupPath = path.join(TIMESTAMPED_BACKUP_DIR, timestampedBackupFilename);
       await fs.promises.writeFile(timestampedBackupPath, dataToSave);
       logger.info(`Backup horodaté créé: ${timestampedBackupFilename}`);

       // Nettoyer les anciens backups horodatés
       cleanupOldBackups(); // <-- Ajouté
    }


    // 3. Sauvegarder les nouvelles données dans store.json
    await fs.promises.writeFile(STORE_PATH, dataToSave);

    logger.info('Store sauvegardé avec succès');
  } catch (err) {
    logger.error('Erreur lors de la sauvegarde du store:', err);
    throw err; // Propager l'erreur pour que l'appelant sache
  }
}

// <-- Ajouté: Fonction pour nettoyer les anciens backups -->
function cleanupOldBackups() {
  if (!backupConfig.enabled || backupConfig.maxBackups <= 0) {
    return; // Nettoyage désactivé ou mal configuré
  }

  try {
    const files = fs.readdirSync(TIMESTAMPED_BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(TIMESTAMPED_BACKUP_DIR, file),
        time: fs.statSync(path.join(TIMESTAMPED_BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Trier par date de modification décroissante (plus récent en premier)

    if (files.length > backupConfig.maxBackups) {
      const filesToDelete = files.slice(backupConfig.maxBackups);
      filesToDelete.forEach(fileInfo => {
        try {
          fs.unlinkSync(fileInfo.path);
          logger.info(`Ancien backup supprimé: ${fileInfo.name}`);
        } catch (unlinkErr) {
          logger.error(`Erreur lors de la suppression de l'ancien backup ${fileInfo.name}:`, unlinkErr);
        }
      });
    }
  } catch (err) {
    logger.error('Erreur lors du nettoyage des anciens backups:', err);
  }
}
// <-- Fin Ajout -->


/**
 * Supprime un programme et tous ses éléments dépendants.
 * Met à jour les index et sauvegarde.
 * @param {number} programId - ID du programme à supprimer
 * @returns {boolean} True si supprimé, false sinon
 */
const deleteProgramCascade = (programId) => {
  const programExists = programsById.has(programId);
  if (!programExists) return false;

  // Filtrer les tableaux principaux
  store.mediaItems = store.mediaItems.filter(m => m.programId !== programId);
  store.topics = store.topics.filter(t => t.programId !== programId);
  store.episodes = store.episodes.filter(e => e.programId !== programId);
  store.programs = store.programs.filter(p => p.id !== programId);

  // Reconstruire tous les index après suppression massive
  buildIndexes();
  saveStore();
  return true;
};

/**
 * Supprime un épisode et tous ses éléments dépendants.
 * Met à jour les index et sauvegarde.
 * @param {number} episodeId - ID de l'épisode à supprimer
 * @returns {boolean} True si supprimé, false sinon
 */
const deleteEpisodeCascade = (episodeId) => {
  const episodeExists = episodesById.has(episodeId);
  if (!episodeExists) return false;

  const { programId } = episodesById.get(episodeId); // Récupérer programId avant suppression

  store.mediaItems = store.mediaItems.filter(m => m.episodeId !== episodeId);
  store.topics = store.topics.filter(t => t.episodeId !== episodeId);
  store.episodes = store.episodes.filter(e => e.id !== episodeId);

  // Reconstruire les index affectés (ou tous pour simplifier)
  buildIndexes();
  saveStore();
  return true;
};

/**
 * Supprime un sujet et tous ses médias.
 * Met à jour les index et sauvegarde.
 * @param {number} topicId - ID du sujet à supprimer
 * @returns {boolean} True si supprimé, false sinon
 */
const deleteTopicCascade = (topicId) => {
  const topicExists = topicsById.has(topicId);
  if (!topicExists) return false;

  const { programId, episodeId } = topicsById.get(topicId); // Récupérer IDs avant suppression

  store.mediaItems = store.mediaItems.filter(m => m.topicId !== topicId);
  store.topics = store.topics.filter(t => t.id !== topicId);

  // Reconstruire les index affectés (ou tous pour simplifier)
  buildIndexes();
  saveStore();
  return true;
};

// <-- Ajouté: Fonctions pour ajouter/mettre à jour des éléments en gérant les index -->
async function addOrUpdateProgram(program) { // <-- Modifié: async
  const index = store.programs.findIndex(p => p.id === program.id);
  if (index > -1) {
    store.programs[index] = program; // Mise à jour
  } else {
    store.programs.push(program); // Ajout
  }
  programsById.set(program.id, program); // Mettre à jour l'index
  await saveStore(); // <-- Ajouté
}

async function addOrUpdateEpisode(episode) { // <-- Modifié: async
  const index = store.episodes.findIndex(e => e.id === episode.id);
  if (index > -1) {
    store.episodes[index] = episode;
  } else {
    store.episodes.push(episode);
  }
  episodesById.set(episode.id, episode);
  await saveStore(); // <-- Ajouté
}

async function addOrUpdateTopic(topic) { // <-- Modifié: async
  const index = store.topics.findIndex(t => t.id === topic.id);
  if (index > -1) {
    store.topics[index] = topic;
  } else {
    store.topics.push(topic);
  }
  topicsById.set(topic.id, topic);
  
  // Mettre à jour la métrique Prometheus avec vérification
  try {
    if (topicsCounter && typeof topicsCounter.set === 'function') {
      topicsCounter.set(store.topics.length);
    }
  } catch (err) {
    logger.warn('Erreur lors de la mise à jour de la métrique topicsCounter:', err.message);
  }
  
  await saveStore(); // <-- Ajouté
}

async function addOrUpdateMediaItem(mediaItem) { // <-- Modifié: async
  const index = store.mediaItems.findIndex(m => m.id === mediaItem.id);
  if (index > -1) {
    store.mediaItems[index] = mediaItem;
  } else {
    store.mediaItems.push(mediaItem);
  }
  mediaItemsById.set(mediaItem.id, mediaItem);
  
  // Mettre à jour la métrique Prometheus avec vérification
  try {
    if (mediaCounter && typeof mediaCounter.set === 'function') {
      mediaCounter.set(store.mediaItems.length);
    }
  } catch (err) {
    logger.warn('Erreur lors de la mise à jour de la métrique mediaCounter:', err.message);
  }
  
  await saveStore(); // <-- Ajouté
}

async function deleteMediaItem(mediaId) { // <-- Modifié: async
    const initialLength = store.mediaItems.length;
    store.mediaItems = store.mediaItems.filter(m => m.id !== mediaId);
    const deleted = store.mediaItems.length < initialLength;
    
    if (deleted) {
        mediaItemsById.delete(mediaId);
        
        // Mettre à jour la métrique Prometheus avec vérification
        try {
            if (mediaCounter && typeof mediaCounter.set === 'function') {
                mediaCounter.set(store.mediaItems.length);
            }
        } catch (err) {
            logger.warn('Erreur lors de la mise à jour de la métrique mediaCounter:', err.message);
        }
        
        await saveStore();
    }
    
    return deleted;
}
// <-- Fin Ajout -->


/**
 * Obtient la scène actuellement affichée.
 * @returns {Object|null} Scène courante
 */
function getCurrentScene() {
  return store.currentScene;
}

/**
 * Met à jour la scène actuelle.
 * @param {Object} scene - Nouvelle scène
 * @returns {Object} Scène mise à jour
 */
function setCurrentScene(scene) {
  store.currentScene = {
    ...store.currentScene,
    ...scene,
    timestamp: Date.now()
  };
  // Pas besoin de sauvegarder le store juste pour un changement de scène
  // saveStore(); // <- Commenté: Sauvegarde déclenchée par d'autres actions ou périodiquement
  return store.currentScene;
}

// Charger les données au démarrage
loadStore();

// Sauvegarder périodiquement et avant l'arrêt
const AUTOSAVE_INTERVAL = backupConfig.autosaveIntervalMinutes * 60 * 1000; // Utiliser config
if (AUTOSAVE_INTERVAL > 0) {
    setInterval(saveStore, AUTOSAVE_INTERVAL);
    logger.info(`Autosave configuré toutes les ${backupConfig.autosaveIntervalMinutes} minutes.`);
} else {
    logger.info('Autosave désactivé (intervalle <= 0).');
}

process.on('SIGINT', async () => {
  logger.info('Signal SIGINT reçu. Sauvegarde du store avant de quitter...');
  try {
    await saveStore();
    logger.info('Store sauvegardé. Arrêt.');
    process.exit(0);
  } catch (err) {
    logger.error('Erreur lors de la sauvegarde finale:', err);
    process.exit(1); // Quitter avec un code d'erreur
  }
});
process.on('SIGTERM', async () => { // Gérer aussi SIGTERM
  logger.info('Signal SIGTERM reçu. Sauvegarde du store avant de quitter...');
   try {
    await saveStore();
    logger.info('Store sauvegardé. Arrêt.');
    process.exit(0);
  } catch (err) {
    logger.error('Erreur lors de la sauvegarde finale:', err);
    process.exit(1);
  }
});


module.exports = {
  store, // Exposer le store brut (à utiliser avec prudence)
  // --- Getters utilisant les index ---
  getProgramById: (id) => programsById.get(id),
  getEpisodeById: (id) => episodesById.get(id),
  getTopicById: (id) => topicsById.get(id),
  getMediaItemById: (id) => mediaItemsById.get(id),
  getAllPrograms: () => store.programs, // Retourne toujours le tableau pour l'itération
  getAllEpisodes: () => store.episodes,
  getAllTopics: () => store.topics,
  getAllMediaItems: () => store.mediaItems,
  // <-- Ajouté: Getters filtrés (optimisation simple) -->
  getEpisodesByProgramId: (programId) => store.episodes.filter(e => e.programId === programId),
  getTopicsByEpisodeId: (episodeId) => store.topics.filter(t => t.episodeId === episodeId),
  getMediaByTopicId: (topicId) => store.mediaItems.filter(m => m.topicId === topicId),
  // <-- Fin Ajout -->
  // --- Fonctions de modification (gèrent les index et la sauvegarde) ---
  saveStore, // Toujours exposé si besoin de sauvegarde manuelle
  addOrUpdateProgram,
  addOrUpdateEpisode,
  addOrUpdateTopic,
  addOrUpdateMediaItem,
  deleteProgramCascade,
  deleteEpisodeCascade,
  deleteTopicCascade,
  deleteMediaItem,
  // --- Scène ---
  getCurrentScene,
  setCurrentScene,
  // --- ID Generation (inchangé pour l'instant) ---
  getNextProgramId: () => store.nextProgramId++,
  getNextEpisodeId: () => store.nextEpisodeId++,
  getNextTopicId: () => store.nextTopicId++,
  getNextMediaId: () => store.nextMediaId++,
};
