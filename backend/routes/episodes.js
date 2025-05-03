/**
 * Routes de gestion des épisodes.
 * @module routes/episodes
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const {
  getProgramById,
  getEpisodeById,
  addOrUpdateEpisode,
  deleteEpisodeCascade,
  getNextEpisodeId,
  getEpisodesByProgramId
} = require('../data/store');
const logger = require('../config/logger');
// <-- Ajouté: Import du module de pagination -->
const { paginateData } = require('../config/pagination');

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
 * Liste les épisodes d'un programme avec support de pagination.
 * 
 * @name GET /api/programs/:programId/episodes
 * @function
 * @memberof module:routes/episodes
 * @param {number} programId - ID du programme parent
 * @returns {Array} Liste des épisodes paginée
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  
  // <-- Ajouté: Support de pagination -->
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || undefined;
  const sortBy = req.query.sortBy || undefined;
  const sortDirection = req.query.sortDirection || undefined;
  
  // Vérifier que le programme existe
  const program = getProgramById(programId);
  if (!program) {
    return res.status(404).json({ message: 'Programme parent non trouvé' });
  }

  // Récupérer tous les épisodes du programme
  const allEpisodes = getEpisodesByProgramId(programId);
  
  // Appliquer la pagination
  const result = paginateData(allEpisodes, {
    page,
    pageSize,
    type: 'episodes',
    sortBy,
    sortDirection
  });
  
  res.json(result);
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

  // <-- Modifié: Utiliser getEpisodeById et vérifier programId -->
  const episode = getEpisodeById(episodeId);

  if (!episode || episode.programId !== programId) {
    return res.status(404).json({ message: 'Épisode non trouvé pour ce programme' });
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
    
    // <-- Modifié: Vérifier que le programme existe avec getProgramById -->
    const program = getProgramById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Programme parent non trouvé' });
    }

    const newEpisode = {
      // <-- Modifié: Utiliser getNextEpisodeId -->
      id: getNextEpisodeId(),
      programId,
      title: req.body.title,
      description: req.body.description || '',
      recordingDate: req.body.recordingDate || new Date().toISOString(),
      isLive: req.body.isLive || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // <-- Modifié: Utiliser addOrUpdateEpisode (qui sauvegarde) -->
    await addOrUpdateEpisode(newEpisode);

    logger.info(`Épisode créé: ${newEpisode.title} (ID: ${newEpisode.id}, Programme: ${program.title})`);
    res.status(201).json(newEpisode);
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

    // <-- Modifié: Utiliser getEpisodeById et vérifier programId -->
    const existingEpisode = getEpisodeById(episodeId);

    if (!existingEpisode || existingEpisode.programId !== programId) {
      return res.status(404).json({ message: 'Épisode non trouvé pour ce programme' });
    }

    // Créer l'objet mis à jour
    const updatedEpisode = {
        ...existingEpisode,
        title: req.body.title !== undefined ? req.body.title : existingEpisode.title,
        description: req.body.description !== undefined ? req.body.description : existingEpisode.description,
        recordingDate: req.body.recordingDate !== undefined ? req.body.recordingDate : existingEpisode.recordingDate,
        isLive: req.body.isLive !== undefined ? req.body.isLive : existingEpisode.isLive,
        updatedAt: new Date().toISOString()
    };

    // <-- Modifié: Utiliser addOrUpdateEpisode (qui sauvegarde) -->
    await addOrUpdateEpisode(updatedEpisode);

    logger.info(`Épisode mis à jour: ${updatedEpisode.title} (ID: ${updatedEpisode.id})`);
    res.json(updatedEpisode);
  } catch (err) {
    logger.error(`Erreur mise à jour épisode ${req.params.id}:`, err);
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

    // <-- Modifié: Utiliser getEpisodeById pour vérifier l'existence et programId -->
    const episodeToDelete = getEpisodeById(episodeId);

    if (!episodeToDelete || episodeToDelete.programId !== programId) {
      return res.status(404).json({ message: 'Épisode non trouvé pour ce programme' });
    }

    // <-- Modifié: Utiliser deleteEpisodeCascade (prend juste episodeId, gère la sauvegarde) -->
    const deleted = await deleteEpisodeCascade(episodeId);

    if (deleted) {
        logger.info(`Épisode supprimé: ${episodeToDelete.title} (ID: ${episodeId})`);
        res.json({ message: 'Épisode supprimé avec succès' });
    } else {
        logger.warn(`Tentative de suppression de l'épisode ${episodeId} échouée après l'avoir trouvé.`);
        res.status(500).json({ message: 'Erreur lors de la suppression de l'épisode dans le store' });
    }

  } catch (err) {
    logger.error(`Erreur suppression épisode ${req.params.id}:`, err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l'épisode' });
  }
});

module.exports = router;
