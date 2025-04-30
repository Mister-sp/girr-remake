const express = require('express');
const router = express.Router();
const { store, saveStore } = require('../data/store');
const { getIO } = require('../websocket');

// GET /api/settings/transitions - Récupérer les paramètres de transition
router.get('/transitions', (req, res) => {
  res.json(store.transitionSettings || {
    appearEffect: 'fade',
    disappearEffect: 'fade',
    duration: 0.5,
    timing: 'ease-in-out',
    slideDistance: 40,
    zoomScale: 0.8,
    rotateAngle: -10
  });
});

// POST /api/settings/transitions - Mettre à jour les paramètres de transition
router.post('/transitions', (req, res) => {
  const { appearEffect, disappearEffect, duration, timing, slideDistance, zoomScale, rotateAngle } = req.body;

  // Validation des effets
  const validEffects = ['fade', 'slide', 'zoom', 'rotate'];
  if (appearEffect && !validEffects.includes(appearEffect)) {
    return res.status(400).json({ error: "L'effet d'apparition n'est pas valide" });
  }
  if (disappearEffect && !validEffects.includes(disappearEffect)) {
    return res.status(400).json({ error: "L'effet de disparition n'est pas valide" });
  }

  // Mise à jour des paramètres
  store.transitionSettings = {
    ...store.transitionSettings,
    appearEffect: appearEffect || store.transitionSettings?.appearEffect || 'fade',
    disappearEffect: disappearEffect || store.transitionSettings?.disappearEffect || 'fade',
    duration: duration !== undefined ? Number(duration) : store.transitionSettings?.duration || 0.5,
    timing: timing || store.transitionSettings?.timing || 'ease-in-out',
    slideDistance: slideDistance !== undefined ? Number(slideDistance) : store.transitionSettings?.slideDistance || 40,
    zoomScale: zoomScale !== undefined ? Number(zoomScale) : store.transitionSettings?.zoomScale || 0.8,
    rotateAngle: rotateAngle !== undefined ? Number(rotateAngle) : store.transitionSettings?.rotateAngle || -10
  };

  // Sauvegarder les changements
  saveStore();

  // Notifier tous les clients connectés
  try {
    const io = getIO();
    if (io) {
      io.emit('settings:transitions:update', store.transitionSettings);
    }
  } catch (err) {
    console.warn('WebSocket non disponible pour settings:transitions:update');
  }

  res.json(store.transitionSettings);
});

module.exports = router;