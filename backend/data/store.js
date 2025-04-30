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
      programs: [], 
      episodes: [], 
      topics: [], 
      mediaItems: [],
      nextProgramId: 1, 
      nextEpisodeId: 1, 
      nextTopicId: 1, 
      nextMediaId: 1,
      currentScene: { name: '', lastChanged: null },
      transitionSettings: {
        appearEffect: 'fade',
        disappearEffect: 'fade',
        duration: 0.5,
        timing: 'ease-in-out',
        slideDistance: 40,
        zoomScale: 0.8,
        rotateAngle: -10
      }
    };
  }
} catch (e) {
  console.error('Erreur lors du chargement du store:', e);
  store = {
    programs: [], 
    episodes: [], 
    topics: [], 
    mediaItems: [],
    nextProgramId: 1, 
    nextEpisodeId: 1, 
    nextTopicId: 1, 
    nextMediaId: 1,
    currentScene: { name: '', lastChanged: null },
    transitionSettings: {
      appearEffect: 'fade',
      disappearEffect: 'fade',
      duration: 0.5,
      timing: 'ease-in-out',
      slideDistance: 40,
      zoomScale: 0.8,
      rotateAngle: -10
    }
  };
}

// Sauvegarder le store à chaque modification
function saveStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// Fonctions pour gérer la suppression en cascade
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

const deleteTopicCascade = (topicId, episodeId, programId) => {
  store.mediaItems = store.mediaItems.filter(m => 
    !(m.topicId === topicId && m.episodeId === episodeId && m.programId === programId)
  );
  store.topics = store.topics.filter(t => 
    !(t.id === topicId && t.episodeId === episodeId && t.programId === programId)
  );
  saveStore();
};

function getCurrentScene() {
  return store.currentScene || { 
    name: '', 
    lastChanged: null
  };
}

function setCurrentScene(data) {
  if (typeof data === 'string') {
    data = { name: data };
  }

  store.currentScene = {
    ...store.currentScene,
    ...data,
    lastChanged: new Date().toISOString()
  };
  
  saveStore();
  return store.currentScene;
}

module.exports = {
  store,
  saveStore,
  deleteProgramCascade,
  deleteEpisodeCascade,
  deleteTopicCascade,
  getCurrentScene,
  setCurrentScene
};
