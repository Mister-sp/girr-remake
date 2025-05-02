/**
 * Routes de gestion des configurations de scènes OBS.
 * @module routes/scene
 */

const express = require('express');
const router = express.Router();
const { store, saveStore } = require('../data/store');
const logger = require('../config/logger');
const { getIO } = require('../websocket');

/**
 * Récupère la configuration de scène actuelle.
 * 
 * @name GET /api/scene
 * @function
 * @memberof module:routes/scene
 * @returns {Object} Configuration de scène
 */
router.get('/', (req, res) => {
  res.json(store.sceneConfig || {});
});

/**
 * Met à jour la configuration de scène.
 * 
 * @name PUT /api/scene
 * @function
 * @memberof module:routes/scene
 * @param {Object} req.body - Nouvelle configuration
 * @param {Object} req.body.layout - Configuration de mise en page
 * @param {Object} req.body.style - Configuration de style
 * @returns {Object} Configuration mise à jour
 */
router.put('/', async (req, res) => {
  try {
    const { layout, style } = req.body;

    if (!store.sceneConfig) {
      store.sceneConfig = {};
    }

    // Mettre à jour la configuration
    if (layout) store.sceneConfig.layout = layout;
    if (style) store.sceneConfig.style = style;
    
    store.sceneConfig.updatedAt = new Date().toISOString();
    await saveStore();

    // Notifier les clients
    const io = getIO();
    if (io) {
      io.emit('scene:updated', store.sceneConfig);
    }

    res.json(store.sceneConfig);
  } catch (err) {
    logger.error('Erreur mise à jour scène:', err);
    res.status(500).json({ message: 'Erreur mise à jour scène' });
  }
});

/**
 * Réinitialise la configuration de scène aux valeurs par défaut.
 * 
 * @name POST /api/scene/reset
 * @function
 * @memberof module:routes/scene
 * @returns {Object} Configuration par défaut
 */
router.post('/reset', async (req, res) => {
  try {
    // Configuration par défaut
    const defaultConfig = {
      layout: {
        rows: 2,
        columns: 2,
        gap: 10,
        padding: 20
      },
      style: {
        background: '#000000',
        textColor: '#ffffff',
        fontFamily: 'Arial',
        fontSize: 24
      },
      updatedAt: new Date().toISOString()
    };

    store.sceneConfig = defaultConfig;
    await saveStore();

    // Notifier les clients
    const io = getIO();
    if (io) {
      io.emit('scene:reset', defaultConfig);
    }

    res.json(defaultConfig);
  } catch (err) {
    logger.error('Erreur réinitialisation scène:', err);
    res.status(500).json({ message: 'Erreur réinitialisation scène' });
  }
});

/**
 * Enregistre un preset de configuration.
 * 
 * @name POST /api/scene/presets
 * @function
 * @memberof module:routes/scene
 * @param {Object} req.body - Configuration du preset
 * @param {string} req.body.name - Nom du preset
 * @param {Object} req.body.config - Configuration à sauvegarder
 * @returns {Object} Preset créé
 */
router.post('/presets', async (req, res) => {
  try {
    const { name, config } = req.body;

    if (!name || !config) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    if (!store.scenePresets) {
      store.scenePresets = [];
    }

    const preset = {
      id: store.nextPresetId++,
      name,
      config,
      createdAt: new Date().toISOString()
    };

    store.scenePresets.push(preset);
    await saveStore();

    // Notifier les clients
    const io = getIO();
    if (io) {
      io.emit('scene:preset-created', preset);
    }

    res.status(201).json(preset);
  } catch (err) {
    logger.error('Erreur création preset:', err);
    res.status(500).json({ message: 'Erreur création preset' });
  }
});

/**
 * Récupère la liste des presets.
 * 
 * @name GET /api/scene/presets
 * @function
 * @memberof module:routes/scene
 * @returns {Array} Liste des presets
 */
router.get('/presets', (req, res) => {
  res.json(store.scenePresets || []);
});

/**
 * Supprime un preset.
 * 
 * @name DELETE /api/scene/presets/:id
 * @function
 * @memberof module:routes/scene
 * @param {string} id - ID du preset
 * @returns {Object} Message de confirmation
 */
router.delete('/presets/:id', async (req, res) => {
  try {
    const presetId = parseInt(req.params.id);
    const presetIndex = store.scenePresets?.findIndex(p => p.id === presetId);

    if (presetIndex === -1) {
      return res.status(404).json({ message: 'Preset non trouvé' });
    }

    store.scenePresets.splice(presetIndex, 1);
    await saveStore();

    // Notifier les clients
    const io = getIO();
    if (io) {
      io.emit('scene:preset-deleted', presetId);
    }

    res.json({ message: 'Preset supprimé' });
  } catch (err) {
    logger.error('Erreur suppression preset:', err);
    res.status(500).json({ message: 'Erreur suppression preset' });
  }
});

/**
 * Applique un preset.
 * 
 * @name POST /api/scene/presets/:id/apply
 * @function
 * @memberof module:routes/scene
 * @param {string} id - ID du preset
 * @returns {Object} Configuration appliquée
 */
router.post('/presets/:id/apply', async (req, res) => {
  try {
    const presetId = parseInt(req.params.id);
    const preset = store.scenePresets?.find(p => p.id === presetId);

    if (!preset) {
      return res.status(404).json({ message: 'Preset non trouvé' });
    }

    store.sceneConfig = {
      ...preset.config,
      updatedAt: new Date().toISOString()
    };
    await saveStore();

    // Notifier les clients
    const io = getIO();
    if (io) {
      io.emit('scene:updated', store.sceneConfig);
    }

    res.json(store.sceneConfig);
  } catch (err) {
    logger.error('Erreur application preset:', err);
    res.status(500).json({ message: 'Erreur application preset' });
  }
});

module.exports = router;
