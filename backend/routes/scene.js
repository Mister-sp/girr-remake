const express = require('express');
const router = express.Router();
const { store, getCurrentScene, setCurrentScene, saveStore } = require('../data/store');
const { getIO } = require('../websocket');

// GET current scene
router.get('/', (req, res) => {
  const scene = getCurrentScene();
  // Include transition settings in scene response
  res.json({
    ...scene,
    ...store.transitionSettings
  });
});

// PUT update current scene
router.put('/', (req, res) => {
  const { name, mediaAppearEffect, mediaDisappearEffect } = req.body;
  
  // Validation des paramètres
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'Le nom de la scène doit être une chaîne non vide.' });
  }

  const validEffects = ['fade', 'slide', 'scale', 'flip', 'none'];

  if (mediaAppearEffect && !validEffects.includes(mediaAppearEffect)) {
    return res.status(400).json({ error: "L'effet d'apparition n'est pas valide." });
  }
  if (mediaDisappearEffect && !validEffects.includes(mediaDisappearEffect)) {
    return res.status(400).json({ error: "L'effet de disparition n'est pas valide." });
  }

  // Update scene and transition settings
  const scene = setCurrentScene({
    name: name?.trim(),
    mediaAppearEffect,
    mediaDisappearEffect
  });

  // If transition effects are provided, update global settings too
  if (mediaAppearEffect || mediaDisappearEffect) {
    store.transitionSettings = {
      ...store.transitionSettings,
      appearEffect: mediaAppearEffect || store.transitionSettings?.appearEffect,
      disappearEffect: mediaDisappearEffect || store.transitionSettings?.disappearEffect
    };
    saveStore(); // Sauvegarde des changements
    try {
      const io = getIO();
      if (io) {
        io.emit('settings:transitions:update', store.transitionSettings);
      }
    } catch (err) {
      console.warn('WebSocket non disponible pour settings:transitions:update');
    }
  }

  res.json({
    ...scene,
    ...store.transitionSettings
  });
});

module.exports = router;
