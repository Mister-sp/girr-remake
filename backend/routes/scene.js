const express = require('express');
const router = express.Router();
const { getCurrentScene, setCurrentScene } = require('../data/store');
const { getIO } = require('../websocket');

// GET current scene
router.get('/', (req, res) => {
  const scene = getCurrentScene();
  res.json(scene);
});

// PUT update current scene
router.put('/', (req, res) => {
  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Le nom de la scène est requis.' });
  }
  const scene = setCurrentScene(name.trim());
  // Diffuser la nouvelle scène à tous les clients WebSocket
  try {
    getIO().emit('scene:update', scene);
    console.log('[WebSocket] scene:update émis à tous les clients:', scene);
  } catch (e) {
    console.warn('WebSocket non initialisé pour scene:update');
  }
  res.json(scene);
});

module.exports = router;
