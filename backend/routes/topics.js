const express = require('express');
// mergeParams: true pour accéder à :programId et :episodeId
const router = express.Router({ mergeParams: true });

// Importer les routes imbriquées
const mediaRoutes = require('./media');
// Importer le store
const { store, deleteTopicCascade } = require('../data/store');
const { topicsCounter } = require('../config/monitoring');

/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du topic
 *         title:
 *           type: string
 *           description: Titre du topic
 *         duration:
 *           type: integer
 *           description: Durée en secondes
 *         color:
 *           type: string
 *           description: Couleur du topic (format hex)
 *         status:
 *           type: string
 *           enum: [pending, active, done]
 *           description: État du topic
 */

/**
 * @swagger
 * /api/programs/{programId}/episodes/{episodeId}/topics:
 *   get:
 *     summary: Récupère tous les topics d'un épisode
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *   post:
 *     summary: Crée un nouveau topic
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Topic'
 *     responses:
 *       201:
 *         description: Topic créé avec succès
 */

// GET /api/programs/:programId/episodes/:episodeId/topics - Récupérer tous les sujets d'un épisode
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  // Filtrer les sujets appartenant à cet épisode spécifique (et indirectement à ce programme)
  const episodeTopics = store.topics.filter(t => t.episodeId === episodeId && t.programId === programId);
  res.json(episodeTopics);
});

// POST /api/programs/:programId/episodes/:episodeId/topics - Créer un nouveau sujet
router.post('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  
  // Optionnel : Vérifier l'existence du programme et de l'épisode parents
  const episodeExists = store.episodes.some(ep => ep.id === episodeId && ep.programId === programId);
  if (!episodeExists) {
      return res.status(404).send('Épisode parent non trouvé.');
  }

  const newTopic = {
    id: store.nextTopicId++,
    programId: programId,
    episodeId: episodeId,
    title: req.body.title || 'Nouveau Sujet',
    position: req.body.position || 0, // Position dans l'épisode
    // Ajoutez d'autres champs (ex: startTime, endTime)
  };
  store.topics.push(newTopic);
  topicsCounter.inc(); // Incrémenter le compteur de topics
  res.status(201).json(newTopic);
});

// ROUTES SPECIFIQUES A UN TOPIC (DOIVENT VENIR AVANT L'IMBRICATION MEDIA)

// GET /api/programs/:programId/episodes/:episodeId/topics/:topicId - Récupérer un sujet spécifique
router.get('/:topicId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);
  const topic = store.topics.find(t => t.id === topicId && t.episodeId === episodeId && t.programId === programId);
  if (!topic) {
    return res.status(404).send('Sujet non trouvé dans cet épisode.');
  }
  res.json(topic);
});

// PUT /api/programs/:programId/episodes/:episodeId/topics/:topicId - Mettre à jour un sujet
router.put('/:topicId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);
  const topicIndex = store.topics.findIndex(t => t.id === topicId && t.episodeId === episodeId && t.programId === programId);
  if (topicIndex === -1) {
    return res.status(404).send('Sujet non trouvé dans cet épisode.');
  }
  const updatedTopic = { 
    ...store.topics[topicIndex], 
    ...req.body 
  };
  // Assurer que les IDs ne sont pas modifiés
  updatedTopic.id = topicId;
  updatedTopic.episodeId = episodeId;
  updatedTopic.programId = programId;
  store.topics[topicIndex] = updatedTopic;
  res.json(updatedTopic);
});

// DELETE /api/programs/:programId/episodes/:episodeId/topics/:topicId - Supprimer un sujet (avec cascade)
router.delete('/:topicId', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);
  const topicIndex = store.topics.findIndex(t => t.id === topicId && t.episodeId === episodeId && t.programId === programId);
  if (topicIndex === -1) {
    return res.status(404).send('Sujet non trouvé dans cet épisode.');
  }
  const deletedTopicData = { ...store.topics[topicIndex] }; // Copie avant suppression
  
  // Utiliser la fonction de suppression en cascade du store
  deleteTopicCascade(topicId, episodeId, programId);
  
  res.json(deletedTopicData); // Renvoyer les données du sujet supprimé
});

// NE PLUS UTILISER LES ROUTES IMBRIQUEES ICI - FAIT DANS SERVER.JS
// router.use('/:topicId/media', mediaRoutes);

module.exports = router;
