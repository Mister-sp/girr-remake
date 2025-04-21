// Store simple en mémoire pour les données

const fs = require('fs');
const path = require('path');
const STORE_PATH = path.join(__dirname, 'store.json');

// Charger le store depuis le fichier JSON si présent
let store;
try {
  if (fs.existsSync(STORE_PATH)) {
    store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } else {
    store = {
      programs: [], episodes: [], topics: [], mediaItems: [],
      nextProgramId: 1, nextEpisodeId: 1, nextTopicId: 1, nextMediaId: 1
    };
  }
} catch (e) {
  // Si erreur de lecture, repartir sur un store vide
  store = {
    programs: [], episodes: [], topics: [], mediaItems: [],
    nextProgramId: 1, nextEpisodeId: 1, nextTopicId: 1, nextMediaId: 1
  };
}

// Sauvegarder le store à chaque modification
function saveStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}


// Fonctions pour gérer la suppression en cascade
// (simplifié pour le stockage en mémoire)

const deleteProgramCascade = (programId) => {
  store.episodes = store.episodes.filter(ep => {
    if (ep.programId === programId) {
      deleteEpisodeCascade(ep.id, programId); // Supprimer les enfants de l'épisode
      return false; // Ne pas garder l'épisode
    }
    return true;
  });
  store.programs = store.programs.filter(p => p.id !== programId);
  saveStore();
};

const deleteEpisodeCascade = (episodeId, programId) => {
  store.topics = store.topics.filter(t => {
    if (t.episodeId === episodeId && t.programId === programId) {
      deleteTopicCascade(t.id, episodeId, programId); // Supprimer les enfants du sujet
      return false; // Ne pas garder le sujet
    }
    return true;
  });
  store.episodes = store.episodes.filter(ep => !(ep.id === episodeId && ep.programId === programId));
  saveStore();
};

const deleteTopicCascade = (topicId, episodeId, programId) => {
  store.mediaItems = store.mediaItems.filter(m => 
    !(m.topicId === topicId && m.episodeId === episodeId && m.programId === programId)
  );
  store.topics = store.topics.filter(t => !(t.id === topicId && t.episodeId === episodeId && t.programId === programId));
  saveStore();
};

module.exports = {
  store,
  deleteProgramCascade,
  deleteEpisodeCascade,
  deleteTopicCascade
};
