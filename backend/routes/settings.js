/**
 * Routes de gestion des paramètres de l'application.
 * @module routes/settings
 */

const express = require('express');
const router = express.Router();
const { store, saveStore } = require('../data/store');
const logger = require('../config/logger');
const { getIO } = require('../websocket');

// Initialiser le système de backup
const backup = require('../config/backup');
backup.init().then(() => {
  backup.startAutoBackup();
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         transitions:
 *           type: object
 *           properties:
 *             appearEffect:
 *               type: string
 *               enum: [fade, slide, scale, flip, none]
 *             disappearEffect:
 *               type: string
 *               enum: [fade, slide, scale, flip, none]
 *         websocket:
 *           type: object
 *           properties:
 *             port:
 *               type: integer
 *             enabled:
 *               type: boolean
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Récupère tous les paramètres
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Paramètres actuels
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *   
 *   put:
 *     summary: Met à jour les paramètres
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Paramètres mis à jour avec succès
 */

/**
 * @swagger
 * /api/settings/export:
 *   get:
 *     summary: Exporte toutes les configurations
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Fichier JSON contenant toutes les configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 * 
 * /api/settings/import:
 *   post:
 *     summary: Importe des configurations
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configurations importées avec succès
 */

/**
 * @swagger
 * /api/settings/import-legacy:
 *   post:
 *     summary: Importe des données depuis l'ancien format GIRR
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Import réussi depuis l'ancien format
 */

/**
 * Récupère tous les paramètres.
 * 
 * @name GET /api/settings
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Paramètres de l'application
 */
router.get('/', (req, res) => {
  res.json(store.settings || {});
});

/**
 * Met à jour les paramètres.
 * 
 * @name PUT /api/settings
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Nouveaux paramètres
 * @param {Object} [req.body.obs] - Configuration OBS
 * @param {Object} [req.body.ui] - Préférences d'interface
 * @param {Object} [req.body.backup] - Configuration des sauvegardes
 * @returns {Object} Paramètres mis à jour 
 */
router.put('/', async (req, res) => {
  try {
    // Fusionner avec les paramètres existants
    store.settings = {
      ...store.settings,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveStore();
    
    logger.info('Paramètres mis à jour');
    res.json(store.settings);
  } catch (err) {
    logger.error('Erreur mise à jour paramètres:', err);
    res.status(500).json({ message: 'Erreur mise à jour paramètres' });
  }
});

/**
 * Récupère la configuration OBS.
 * 
 * @name GET /api/settings/obs
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Configuration OBS
 */
router.get('/obs', (req, res) => {
  res.json(store.settings?.obs || {});
});

/**
 * Met à jour la configuration OBS.
 * 
 * @name PUT /api/settings/obs
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Nouvelle configuration OBS
 * @param {string} [req.body.host] - Hôte du serveur OBS
 * @param {number} [req.body.port] - Port du serveur OBS
 * @param {string} [req.body.password] - Mot de passe de connexion
 * @returns {Object} Configuration OBS mise à jour
 */
router.put('/obs', async (req, res) => {
  try {
    // S'assurer que les paramètres existent
    if (!store.settings) store.settings = {};
    
    // Mettre à jour la config OBS
    store.settings.obs = {
      ...store.settings.obs,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveStore();
    
    logger.info('Configuration OBS mise à jour');
    res.json(store.settings.obs);
  } catch (err) {
    logger.error('Erreur mise à jour config OBS:', err);
    res.status(500).json({ message: 'Erreur mise à jour config OBS' });
  }
});

/**
 * Récupère les préférences d'interface.
 * 
 * @name GET /api/settings/ui
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Préférences d'interface
 */
router.get('/ui', (req, res) => {
  res.json(store.settings?.ui || {});
});

/**
 * Met à jour les préférences d'interface.
 * 
 * @name PUT /api/settings/ui
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Nouvelles préférences
 * @param {string} [req.body.theme] - Thème d'interface
 * @param {Object} [req.body.layout] - Disposition des éléments
 * @param {Object} [req.body.shortcuts] - Raccourcis clavier
 * @returns {Object} Préférences mises à jour
 */
router.put('/ui', async (req, res) => {
  try {
    // S'assurer que les paramètres existent
    if (!store.settings) store.settings = {};
    
    // Mettre à jour les préférences UI
    store.settings.ui = {
      ...store.settings.ui,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveStore();
    
    logger.info('Préférences UI mises à jour');
    res.json(store.settings.ui);
  } catch (err) {
    logger.error('Erreur mise à jour préférences UI:', err);
    res.status(500).json({ message: 'Erreur mise à jour préférences UI' });
  }
});

/**
 * Récupère la configuration des sauvegardes.
 * 
 * @name GET /api/settings/backup
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Configuration des sauvegardes
 */
router.get('/backup', (req, res) => {
  res.json(store.settings?.backup || {});
});

/**
 * Met à jour la configuration des sauvegardes.
 * 
 * @name PUT /api/settings/backup
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Nouvelle configuration
 * @param {boolean} [req.body.enabled] - Activer/désactiver les sauvegardes
 * @param {number} [req.body.interval] - Intervalle en minutes
 * @param {string} [req.body.directory] - Répertoire de sauvegarde
 * @returns {Object} Configuration mise à jour
 */
router.put('/backup', async (req, res) => {
  try {
    // S'assurer que les paramètres existent
    if (!store.settings) store.settings = {};
    
    // Mettre à jour la config de sauvegarde
    store.settings.backup = {
      ...store.settings.backup,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveStore();
    
    logger.info('Configuration de sauvegarde mise à jour');
    res.json(store.settings.backup);
  } catch (err) {
    logger.error('Erreur mise à jour config sauvegarde:', err);
    res.status(500).json({ message: 'Erreur mise à jour config sauvegarde' });
  }
});

/**
 * Réinitialise les paramètres par défaut.
 * 
 * @name POST /api/settings/reset
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Paramètres par défaut
 */
router.post('/reset', async (req, res) => {
  try {
    // Paramètres par défaut
    store.settings = {
      obs: {
        host: 'localhost',
        port: 4444,
        password: ''
      },
      ui: {
        theme: 'light',
        shortcuts: {}
      },
      backup: {
        enabled: true,
        interval: 5,
        directory: './backups'
      },
      updatedAt: new Date().toISOString()
    };

    await saveStore();
    
    logger.info('Paramètres réinitialisés');
    res.json(store.settings);
  } catch (err) {
    logger.error('Erreur réinitialisation paramètres:', err);
    res.status(500).json({ message: 'Erreur réinitialisation paramètres' });
  }
});

/**
 * Obtient les paramètres de transition.
 * @name GET/api/settings/transitions
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Paramètres de transition actuels
 */
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

/**
 * Met à jour les paramètres de transition.
 * @name POST/api/settings/transitions
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Nouveaux paramètres
 * @returns {Object} Paramètres mis à jour
 */
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

/**
 * Exporte la configuration complète.
 * @name GET/api/settings/export
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Configuration complète
 */
router.get('/export', (req, res) => {
  try {
    // Créer un objet d'export avec les données actuelles
    const exportData = {
      programs: store.programs || [],
      episodes: store.episodes || [],
      topics: store.topics || [],
      mediaItems: store.mediaItems || [],
      transitionSettings: store.transitionSettings || {},
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Envoyer comme fichier à télécharger
    res.setHeader('Content-Disposition', 'attachment; filename=fremen-config.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

/**
 * Importe une configuration.
 * @name POST/api/settings/import
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Configuration à importer
 * @returns {Object} Message de confirmation
 */
router.post('/import', (req, res) => {
  try {
    const importData = req.body;

    // Validation basique
    if (!importData.programs || !importData.episodes || !importData.topics || !importData.mediaItems) {
      return res.status(400).json({ error: 'Format de données invalide' });
    }

    // Sauvegarde des IDs actuels
    const nextIds = {
      programId: store.nextProgramId,
      episodeId: store.nextEpisodeId,
      topicId: store.nextTopicId,
      mediaId: store.nextMediaId
    };

    // Mise à jour du store
    store.programs = importData.programs;
    store.episodes = importData.episodes;
    store.topics = importData.topics;
    store.mediaItems = importData.mediaItems;
    if (importData.transitionSettings) {
      store.transitionSettings = importData.transitionSettings;
    }

    // Mise à jour des compteurs d'IDs
    store.nextProgramId = Math.max(nextIds.programId, ...importData.programs.map(p => p.id + 1));
    store.nextEpisodeId = Math.max(nextIds.episodeId, ...importData.episodes.map(e => e.id + 1));
    store.nextTopicId = Math.max(nextIds.topicId, ...importData.topics.map(t => t.id + 1));
    store.nextMediaId = Math.max(nextIds.mediaId, ...importData.mediaItems.map(m => m.id + 1));

    // Sauvegarder les changements
    saveStore();

    res.json({ message: 'Import réussi', imported: {
      programs: importData.programs.length,
      episodes: importData.episodes.length,
      topics: importData.topics.length,
      mediaItems: importData.mediaItems.length
    }});
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import des données' });
  }
});

/**
 * Importe des données depuis l'ancien format GIRR.
 * @name POST/api/settings/import-legacy
 * @function
 * @memberof module:routes/settings
 * @param {Object} req.body - Données au format ancien GIRR
 * @returns {Object} Message de confirmation
 */
router.post('/import-legacy', (req, res) => {
  try {
    const legacyData = req.body;

    // Validation basique du format ancien GIRR
    if (!legacyData.shows && !legacyData.episodes) {
      return res.status(400).json({ error: 'Format de données GIRR invalide' });
    }

    // Convertir les données
    const convertedData = {
      programs: (legacyData.shows || []).map(show => ({
        id: store.nextProgramId++,
        title: show.title || 'Programme sans titre',
        description: show.description || '',
        logoUrl: show.logo || '',
        logoEffect: 'none',
        logoPosition: 'top-right',
        logoSize: 80,
        lowerThirdConfig: {
          transitionIn: 'fade',
          transitionOut: 'slide',
          fontFamily: 'Roboto',
          fontUrl: 'https://fonts.googleapis.com/css?family=Roboto',
          fontSize: 32,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          textColor: '#FFFFFF',
          textStrokeColor: '#000000',
          textStrokeWidth: 2,
          backgroundColor: '#181818',
          backgroundOpacity: 0.97,
          logoInLowerThird: false,
          logoPosition: 'left'
        }
      })),
      episodes: [],
      topics: [],
      mediaItems: []
    };

    // Créer une map pour garder trace des anciens/nouveaux IDs
    const showToProgram = new Map();
    convertedData.programs.forEach((program, idx) => {
      showToProgram.set(legacyData.shows[idx]._id, program.id);
    });

    // Convertir les épisodes
    if (legacyData.episodes) {
      legacyData.episodes.forEach(episode => {
        const programId = showToProgram.get(episode.show);
        if (programId) {
          const newEpisode = {
            id: store.nextEpisodeId++,
            programId: programId,
            number: episode.number || 1,
            title: episode.title || 'Episode sans titre'
          };
          convertedData.episodes.push(newEpisode);

          // Convertir les topics de l'épisode
          if (episode.topics) {
            episode.topics.forEach((topic, position) => {
              const newTopic = {
                id: store.nextTopicId++,
                programId: programId,
                episodeId: newEpisode.id,
                title: topic.title || 'Sujet sans titre',
                position: position,
                script: topic.content || ''
              };
              convertedData.topics.push(newTopic);

              // Convertir les médias du topic
              if (topic.overlays) {
                topic.overlays.forEach((overlay, order) => {
                  convertedData.mediaItems.push({
                    id: store.nextMediaId++,
                    programId: programId,
                    episodeId: newEpisode.id,
                    topicId: newTopic.id,
                    type: overlay.type || 'url',
                    content: overlay.content || '',
                    order: order
                  });
                });
              }
            });
          }
        }
      });
    }

    // Sauvegarder les données converties
    store.programs = [...store.programs, ...convertedData.programs];
    store.episodes = [...store.episodes, ...convertedData.episodes];
    store.topics = [...store.topics, ...convertedData.topics];
    store.mediaItems = [...store.mediaItems, ...convertedData.mediaItems];
    saveStore();

    res.json({
      message: 'Import depuis l\'ancien GIRR réussi',
      imported: {
        programs: convertedData.programs.length,
        episodes: convertedData.episodes.length,
        topics: convertedData.topics.length,
        mediaItems: convertedData.mediaItems.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'import depuis l\'ancien GIRR:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import des données depuis l\'ancien GIRR' });
  }
});

/**
 * Liste les backups disponibles.
 * @name GET/api/settings/backups
 * @function
 * @memberof module:routes/settings
 * @returns {Array} Liste des fichiers de backup
 */
router.get('/backups', async (req, res) => {
  try {
    const backups = await backup.listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la liste des backups' });
  }
});

/**
 * Crée un backup manuel.
 * @name POST/api/settings/backups
 * @function
 * @memberof module:routes/settings
 * @returns {Object} Informations sur le backup créé
 */
router.post('/backups', async (req, res) => {
  try {
    await backup.createBackup();
    res.json({ message: 'Backup créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du backup' });
  }
});

/**
 * Restaure un backup spécifique.
 * @name POST/api/settings/backups/:filename/restore
 * @function
 * @memberof module:routes/settings
 * @param {string} req.params.filename - Nom du fichier de backup à restaurer
 * @returns {Object} Message de confirmation
 */
router.post('/backups/:filename/restore', async (req, res) => {
  try {
    await backup.restoreBackup(req.params.filename);
    // Sauver le store après la restauration
    await saveStore();
    // Notifier les clients connectés
    const io = getIO();
    if (io) {
      io.emit('store:update');
    }
    res.json({ message: 'Backup restauré avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la restauration du backup' });
  }
});

// GET /api/settings/backups/config - Récupérer la configuration des backups
router.get('/backups/config', (req, res) => {
  const config = backup.getBackupConfig();
  res.json(config);
});

// PUT /api/settings/backups/config - Mettre à jour la configuration des backups
router.put('/backups/config', (req, res) => {
  try {
    const { maxBackups, intervalHours, enabled } = req.body;
    const config = backup.updateBackupConfig({
      maxBackups: maxBackups !== undefined ? parseInt(maxBackups) : undefined,
      intervalHours: intervalHours !== undefined ? parseFloat(intervalHours) : undefined,
      enabled: enabled !== undefined ? Boolean(enabled) : undefined
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration des backups' });
  }
});

module.exports = router;