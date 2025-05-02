/**
 * Routes de gestion des épisodes.
 * @module routes/episodes
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const { store, saveStore, deleteEpisodeCascade } = require('../data/store');
const logger = require('../config/logger');

// Configuration multer pour les logos d'épisodes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/logos')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * components:
 *   schemas:
 *     Episode:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique de l'épisode
 *         title:
 *           type: string
 *           description: Titre de l'épisode
 *         description:
 *           type: string
 *           description: Description de l'épisode
 */

/**
 * @swagger
 * /api/programs/{programId}/episodes:
 *   get:
 *     summary: Récupère tous les épisodes d'un programme
 *     tags: [Episodes]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du programme
 *     responses:
 *       200:
 *         description: Liste des épisodes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Episode'
 *   post:
 *     summary: Crée un nouvel épisode
 *     tags: [Episodes]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du programme
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Episode'
 *     responses:
 *       201:
 *         description: Épisode créé avec succès
 */

/**
 * Liste les épisodes d'un programme.
 * 
 * @name GET /api/programs/:programId/episodes
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @returns {Array} Liste des épisodes
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodes = store.episodes.filter(e => e.programId === programId);
  res.json(episodes);
});

/**
 * Récupère un épisode par son ID.
 * 
 * @name GET /api/programs/:programId/episodes/:id
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @param {number} id - ID de l'épisode
 * @returns {Object} Épisode trouvé
 */
router.get('/:id', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.id);
  
  const episode = store.episodes.find(e => 
    e.id === episodeId && e.programId === programId
  );

  if (!episode) {
    return res.status(404).json({ message: 'Épisode non trouvé' });
  }

  res.json(episode);
});

/**
 * Crée un nouvel épisode.
 * 
 * @name POST /api/programs/:programId/episodes
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @param {Object} req.body - Données de l'épisode
 * @param {string} req.body.title - Titre de l'épisode
 * @param {string} [req.body.description] - Description de l'épisode
 * @param {string} [req.body.recordingDate] - Date d'enregistrement
 * @param {boolean} [req.body.isLive=false] - Si l'épisode est en direct
 * @returns {Object} Épisode créé
 */
router.post('/', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    
    // Vérifier que le programme existe
    const program = store.programs.find(p => p.id === programId);
    if (!program) {
      return res.status(404).json({ message: 'Programme parent non trouvé' });
    }

    const episode = {
      id: store.nextEpisodeId++,
      programId,
      title: req.body.title,
      description: req.body.description || '',
      recordingDate: req.body.recordingDate || new Date().toISOString(),
      isLive: req.body.isLive || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.episodes.push(episode);
    await saveStore();

    logger.info(`Épisode créé: ${episode.title} (ID: ${episode.id}, Programme: ${program.title})`);
    res.status(201).json(episode);
  } catch (err) {
    logger.error('Erreur création épisode:', err);
    res.status(500).json({ message: 'Erreur création épisode' });
  }
});

/**
 * Met à jour un épisode.
 * 
 * @name PUT /api/programs/:programId/episodes/:id
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @param {number} id - ID de l'épisode
 * @param {Object} req.body - Données à mettre à jour
 * @returns {Object} Épisode mis à jour
 */
router.put('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.id);

    const episode = store.episodes.find(e => 
      e.id === episodeId && e.programId === programId
    );

    if (!episode) {
      return res.status(404).json({ message: 'Épisode non trouvé' });
    }

    // Mettre à jour les champs
    Object.assign(episode, {
      title: req.body.title || episode.title,
      description: req.body.description || episode.description,
      recordingDate: req.body.recordingDate || episode.recordingDate,
      isLive: req.body.isLive !== undefined ? req.body.isLive : episode.isLive,
      updatedAt: new Date().toISOString()
    });

    await saveStore();

    logger.info(`Épisode mis à jour: ${episode.title} (ID: ${episode.id})`);
    res.json(episode);
  } catch (err) {
    logger.error('Erreur mise à jour épisode:', err);
    res.status(500).json({ message: 'Erreur mise à jour épisode' });
  }
});

/**
 * Supprime un épisode.
 * 
 * @name DELETE /api/programs/:programId/episodes/:id
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @param {number} id - ID de l'épisode
 * @returns {Object} Message de confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.id);

    const episode = store.episodes.find(e => 
      e.id === episodeId && e.programId === programId
    );

    if (!episode) {
      return res.status(404).json({ message: 'Épisode non trouvé' });
    }

    // Supprimer l'épisode et ses dépendances
    deleteEpisodeCascade(episodeId, programId);

    logger.info(`Épisode supprimé: ${episode.title} (ID: ${episode.id})`);
    res.json({ message: 'Épisode supprimé' });
  } catch (err) {
    logger.error('Erreur suppression épisode:', err);
    res.status(500).json({ message: 'Erreur suppression épisode' });
  }
});

module.exports = router;
