const express = require('express');
// `mergeParams: true` permet d'accéder à :programId depuis le routeur parent (programs.js)
const router = express.Router({ mergeParams: true }); 

// Importer les routes imbriquées
const topicRoutes = require('./topics');
// Importer le store
const { store, deleteEpisodeCascade } = require('../data/store');

// NE PLUS UTILISER LES ROUTES IMBRIQUEES ICI - FAIT DANS SERVER.JS
// router.use('/:episodeId/topics', topicRoutes);

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

// GET /api/programs/:programId/episodes - Récupérer tous les épisodes d'un programme
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const programEpisodes = store.episodes.filter(ep => ep.programId === programId);
  res.json(programEpisodes);
});

// POST /api/programs/:programId/episodes - Créer un nouvel épisode pour un programme
router.post('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  // Optionnel : Vérifier si le programme existe dans store.programs
  const programExists = store.programs.some(p => p.id === programId);
  if (!programExists) {
      return res.status(404).send('Programme parent non trouvé.');
  }

  const newEpisode = {
    id: store.nextEpisodeId++,
    programId: programId,
    number: req.body.number || 1, // Numéro d'épisode
    title: req.body.title || 'Nouvel Épisode',
    // Ajoutez d'autres champs pertinents (date, description, etc.)
  };
  store.episodes.push(newEpisode);
  res.status(201).json(newEpisode);
});

// GET /api/programs/:programId/episodes/:episodeId - Récupérer un épisode spécifique
router.get('/:episodeId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const episode = store.episodes.find(ep => ep.id === episodeId && ep.programId === programId);
  if (!episode) {
    return res.status(404).send('Épisode non trouvé dans ce programme.');
  }
  res.json(episode);
});

// PUT /api/programs/:programId/episodes/:episodeId - Mettre à jour un épisode
router.put('/:episodeId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const episodeIndex = store.episodes.findIndex(ep => ep.id === episodeId && ep.programId === programId);
  if (episodeIndex === -1) {
    return res.status(404).send('Épisode non trouvé dans ce programme.');
  }
  const updatedEpisode = { 
    ...store.episodes[episodeIndex], 
    ...req.body 
  };
  // Assurer que les IDs ne sont pas modifiés par le body
  updatedEpisode.id = episodeId;
  updatedEpisode.programId = programId;
  store.episodes[episodeIndex] = updatedEpisode;
  res.json(updatedEpisode);
});

// DELETE /api/programs/:programId/episodes/:episodeId - Supprimer un épisode (avec cascade)
router.delete('/:episodeId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const episodeIndex = store.episodes.findIndex(ep => ep.id === episodeId && ep.programId === programId);
  if (episodeIndex === -1) {
    return res.status(404).send('Épisode non trouvé dans ce programme.');
  }
  const deletedEpisodeData = { ...store.episodes[episodeIndex] }; // Copie avant suppression

  // Utiliser la fonction de suppression en cascade du store
  deleteEpisodeCascade(episodeId, programId);
  
  res.json(deletedEpisodeData); // Renvoyer les données de l'épisode supprimé
});

module.exports = router;
