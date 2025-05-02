/**
 * Routes de gestion des sujets.
 * @module routes/topics
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { store, saveStore, deleteTopicCascade } = require('../data/store');
const { topicsCounter } = require('../config/monitoring');
const logger = require('../config/logger');

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

/**
 * Liste les sujets d'un épisode.
 * 
 * @name GET /api/programs/:programId/episodes/:episodeId/topics
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @returns {Array} Liste des sujets
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  
  const topics = store.topics.filter(t => 
    t.programId === programId && t.episodeId === episodeId
  );

  res.json(topics);
});

/**
 * Récupère un sujet par son ID.
 * 
 * @name GET /api/programs/:programId/episodes/:episodeId/topics/:id
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} id - ID du sujet
 * @returns {Object} Sujet trouvé
 */
router.get('/:id', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.id);
  
  const topic = store.topics.find(t => 
    t.id === topicId && 
    t.programId === programId && 
    t.episodeId === episodeId
  );

  if (!topic) {
    return res.status(404).json({ message: 'Sujet non trouvé' });
  }

  res.json(topic);
});

/**
 * Crée un nouveau sujet.
 * 
 * @name POST /api/programs/:programId/episodes/:episodeId/topics
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {Object} req.body - Données du sujet
 * @param {string} req.body.title - Titre du sujet
 * @param {string} [req.body.description] - Description du sujet
 * @param {number} [req.body.duration] - Durée estimée en minutes
 * @param {string} [req.body.status='pending'] - Statut du sujet
 * @returns {Object} Sujet créé
 */
router.post('/', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);

    // Vérifier que l'épisode existe
    const episode = store.episodes.find(e => 
      e.id === episodeId && e.programId === programId
    );
    if (!episode) {
      return res.status(404).json({ message: 'Épisode parent non trouvé' });
    }

    const topic = {
      id: store.nextTopicId++,
      programId,
      episodeId,
      title: req.body.title,
      description: req.body.description || '',
      duration: req.body.duration || 0,
      status: req.body.status || 'pending',
      order: store.topics.filter(t => t.episodeId === episodeId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.topics.push(topic);
    await saveStore();

    // Incrémenter le compteur de sujets
    topicsCounter.inc();
    
    logger.info(`Sujet créé: ${topic.title} (ID: ${topic.id}, Épisode: ${episode.title})`);
    res.status(201).json(topic);
  } catch (err) {
    logger.error('Erreur création sujet:', err);
    res.status(500).json({ message: 'Erreur création sujet' });
  }
});

/**
 * Met à jour un sujet.
 * 
 * @name PUT /api/programs/:programId/episodes/:episodeId/topics/:id
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} id - ID du sujet
 * @param {Object} req.body - Données à mettre à jour
 * @returns {Object} Sujet mis à jour
 */
router.put('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.id);

    const topic = store.topics.find(t => 
      t.id === topicId && 
      t.programId === programId && 
      t.episodeId === episodeId
    );

    if (!topic) {
      return res.status(404).json({ message: 'Sujet non trouvé' });
    }

    // Mettre à jour les champs
    Object.assign(topic, {
      title: req.body.title || topic.title,
      description: req.body.description || topic.description,
      duration: req.body.duration || topic.duration,
      status: req.body.status || topic.status,
      order: req.body.order !== undefined ? req.body.order : topic.order,
      updatedAt: new Date().toISOString()
    });

    await saveStore();
    
    logger.info(`Sujet mis à jour: ${topic.title} (ID: ${topic.id})`);
    res.json(topic);
  } catch (err) {
    logger.error('Erreur mise à jour sujet:', err);
    res.status(500).json({ message: 'Erreur mise à jour sujet' });
  }
});

/**
 * Met à jour l'ordre des sujets.
 * 
 * @name PUT /api/programs/:programId/episodes/:episodeId/topics/reorder
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {Array<number>} req.body.topicIds - Liste ordonnée des IDs de sujets
 * @returns {Object} Message de confirmation
 */
router.put('/reorder', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const { topicIds } = req.body;

    // Mettre à jour l'ordre des sujets
    topicIds.forEach((id, index) => {
      const topic = store.topics.find(t => 
        t.id === id && 
        t.programId === programId && 
        t.episodeId === episodeId
      );
      if (topic) {
        topic.order = index;
      }
    });

    await saveStore();
    
    logger.info(`Ordre des sujets mis à jour pour l'épisode ${episodeId}`);
    res.json({ message: 'Ordre mis à jour' });
  } catch (err) {
    logger.error('Erreur mise à jour ordre sujets:', err);
    res.status(500).json({ message: 'Erreur mise à jour ordre' });
  }
});

/**
 * Supprime un sujet.
 * 
 * @name DELETE /api/programs/:programId/episodes/:episodeId/topics/:id
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} id - ID du sujet
 * @returns {Object} Message de confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.id);

    const topic = store.topics.find(t => 
      t.id === topicId && 
      t.programId === programId && 
      t.episodeId === episodeId
    );

    if (!topic) {
      return res.status(404).json({ message: 'Sujet non trouvé' });
    }

    // Supprimer le sujet et ses médias
    deleteTopicCascade(topicId, episodeId, programId);
    
    logger.info(`Sujet supprimé: ${topic.title} (ID: ${topic.id})`);
    res.json({ message: 'Sujet supprimé' });
  } catch (err) {
    logger.error('Erreur suppression sujet:', err);
    res.status(500).json({ message: 'Erreur suppression sujet' });
  }
});

module.exports = router;
