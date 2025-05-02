/**
 * Gestion de l'état et persistance des données.
 * @module data/store
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { topicsCounter, mediaCounter } = require('../config/monitoring');

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

/**
 * Chemin du fichier de stockage.
 * @type {string}
 */
const STORE_PATH = path.join(__dirname, 'store.json');
const BACKUP_PATH = path.join(__dirname, 'store.json.backup');

/**
 * Charge les données depuis le fichier.
 * @returns {void}
 */
function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_PATH));
      Object.assign(store, data);
      
      // Mise à jour des métriques
      topicsCounter.inc(store.topics.length);
      mediaCounter.inc(store.mediaItems.length);

      logger.info('Store chargé avec succès');
    }
  } catch (err) {
    logger.error('Erreur lors du chargement du store:', err);
    
    // Tenter de restaurer depuis la backup
    if (fs.existsSync(BACKUP_PATH)) {
      try {
        const backup = JSON.parse(fs.readFileSync(BACKUP_PATH));
        Object.assign(store, backup);
        logger.info('Store restauré depuis la backup');
      } catch (backupErr) {
        logger.error('Échec de la restauration depuis la backup:', backupErr);
      }
    }
  }
}

/**
 * Sauvegarde les données dans le fichier.
 * @returns {Promise<void>}
 */
async function saveStore() {
  try {
    // Créer une backup avant la sauvegarde
    if (fs.existsSync(STORE_PATH)) {
      fs.copyFileSync(STORE_PATH, BACKUP_PATH);
    }

    // Sauvegarder les nouvelles données
    await fs.promises.writeFile(
      STORE_PATH,
      JSON.stringify(store, null, 2)
    );
    
    logger.info('Store sauvegardé avec succès');
  } catch (err) {
    logger.error('Erreur lors de la sauvegarde du store:', err);
    throw err;
  }
}

/**
 * Supprime un programme et tous ses épisodes/sujets/médias.
 * @param {number} programId - ID du programme à supprimer
 * @returns {void}
 */
const deleteProgramCascade = (programId) => {
  // Supprimer tous les médias associés
  store.mediaItems = store.mediaItems.filter(m => m.programId !== programId);
  // Supprimer tous les topics associés
  store.topics = store.topics.filter(t => t.programId !== programId);
  // Supprimer tous les épisodes associés
  store.episodes = store.episodes.filter(e => e.programId !== programId);
  // Supprimer le programme
  store.programs = store.programs.filter(p => p.id !== programId);
  saveStore();
};

/**
 * Supprime un épisode et tous ses sujets/médias.
 * @param {number} episodeId - ID de l'épisode à supprimer
 * @param {number} programId - ID du programme associé
 * @returns {void}
 */
const deleteEpisodeCascade = (episodeId, programId) => {
  store.mediaItems = store.mediaItems.filter(m => 
    !(m.episodeId === episodeId && m.programId === programId)
  );
  store.topics = store.topics.filter(t => 
    !(t.episodeId === episodeId && t.programId === programId)
  );
  store.episodes = store.episodes.filter(e => 
    !(e.id === episodeId && e.programId === programId)
  );
  saveStore();
};

/**
 * Supprime un sujet et tous ses médias.
 * @param {number} topicId - ID du sujet à supprimer
 * @param {number} episodeId - ID de l'épisode associé
 * @param {number} programId - ID du programme associé
 * @returns {void}
 */
const deleteTopicCascade = (topicId, episodeId, programId) => {
  store.mediaItems = store.mediaItems.filter(m => 
    !(m.topicId === topicId && m.episodeId === episodeId && m.programId === programId)
  );
  store.topics = store.topics.filter(t => 
    !(t.id === topicId && t.episodeId === episodeId && t.programId === programId)
  );
  saveStore();
};

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
  return store.currentScene;
}

// Charger les données au démarrage
loadStore();

// Sauvegarder périodiquement et avant l'arrêt
const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(saveStore, AUTOSAVE_INTERVAL);
process.on('SIGINT', () => {
  saveStore().then(() => process.exit());
});

module.exports = {
  store,
  saveStore,
  deleteProgramCascade,
  deleteEpisodeCascade,
  deleteTopicCascade,
  getCurrentScene,
  setCurrentScene
};
