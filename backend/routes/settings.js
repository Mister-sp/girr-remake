const express = require('express');
const router = express.Router();
const { store, saveStore } = require('../data/store');
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

// GET /api/settings/export - Exporter toutes les configurations
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

// POST /api/settings/import - Importer des configurations
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

// POST /api/settings/import-legacy - Importer des données depuis l'ancien format GIRR
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

// GET /api/settings/backups - Liste tous les backups disponibles
router.get('/backups', async (req, res) => {
  try {
    const backups = await backup.listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la liste des backups' });
  }
});

// POST /api/settings/backups - Crée un backup manuel
router.post('/backups', async (req, res) => {
  try {
    await backup.createBackup();
    res.json({ message: 'Backup créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du backup' });
  }
});

// POST /api/settings/backups/:filename/restore - Restaure un backup spécifique
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