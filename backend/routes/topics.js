/**
 * Routes de gestion des sujets.
 * @module routes/topics
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getEpisodeById,
  getTopicById,
  addOrUpdateTopic,
  deleteTopicCascade,
  getNextTopicId,
  getTopicsByEpisodeId,
  saveStore // Importé pour la réorganisation
} = require('../data/store');
const { topicsCounter } = require('../config/monitoring');
const logger = require('../config/logger');
// <-- Ajouté: Import du module de pagination -->
const { paginateData } = require('../config/pagination');

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
 * Liste les sujets d'un épisode avec support de pagination.
 * 
 * @name GET /api/programs/:programId/episodes/:episodeId/topics
 * @function
 * @memberof module:routes/topics
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @returns {Array} Liste des sujets paginée
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);

  // <-- Ajouté: Support de pagination -->
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || undefined;
  const sortBy = req.query.sortBy || undefined;
  const sortDirection = req.query.sortDirection || undefined;

  // Vérifier que l'épisode existe et appartient au bon programme
  const episode = getEpisodeById(episodeId);
  if (!episode || episode.programId !== programId) {
      return res.status(404).json({ message: 'Épisode parent non trouvé pour ce programme' });
  }

  // Récupérer tous les sujets de l'épisode
  const allTopics = getTopicsByEpisodeId(episodeId);
  
  // Appliquer la pagination
  const result = paginateData(allTopics, {
    page,
    pageSize,
    type: 'topics',
    sortBy,
    sortDirection
  });
  
  res.json(result);
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

  // <-- Modifié: Utiliser getTopicById et vérifier les IDs parents -->
  const topic = getTopicById(topicId);

  if (!topic || topic.programId !== programId || topic.episodeId !== episodeId) {
    return res.status(404).json({ message: 'Sujet non trouvé pour cet épisode/programme' });
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

    // <-- Modifié: Vérifier que l'épisode existe avec getEpisodeById -->
    const episode = getEpisodeById(episodeId);
    if (!episode || episode.programId !== programId) {
      return res.status(404).json({ message: 'Épisode parent non trouvé pour ce programme' });
    }

    // Calculer l'ordre basé sur les sujets existants pour cet épisode
    const currentTopics = getTopicsByEpisodeId(episodeId);

    const newTopic = {
      // <-- Modifié: Utiliser getNextTopicId -->
      id: getNextTopicId(),
      programId,
      episodeId,
      title: req.body.title,
      description: req.body.description || '',
      duration: req.body.duration || 0,
      status: req.body.status || 'pending',
      order: currentTopics.length, // Placer à la fin par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // <-- Modifié: Utiliser addOrUpdateTopic (qui sauvegarde et met à jour le compteur) -->
    await addOrUpdateTopic(newTopic);

    logger.info(`Sujet créé: ${newTopic.title} (ID: ${newTopic.id}, Épisode: ${episode.title})`);
    res.status(201).json(newTopic);
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

    // <-- Modifié: Utiliser getTopicById et vérifier les IDs parents -->
    const existingTopic = getTopicById(topicId);

    if (!existingTopic || existingTopic.programId !== programId || existingTopic.episodeId !== episodeId) {
      return res.status(404).json({ message: 'Sujet non trouvé pour cet épisode/programme' });
    }

    // Créer l'objet mis à jour
    const updatedTopic = {
        ...existingTopic,
        title: req.body.title !== undefined ? req.body.title : existingTopic.title,
        description: req.body.description !== undefined ? req.body.description : existingTopic.description,
        duration: req.body.duration !== undefined ? req.body.duration : existingTopic.duration,
        status: req.body.status !== undefined ? req.body.status : existingTopic.status,
        order: req.body.order !== undefined ? req.body.order : existingTopic.order,
        script: req.body.script !== undefined ? req.body.script : existingTopic.script, // Ajout du champ script
        updatedAt: new Date().toISOString()
    };

    // <-- Modifié: Utiliser addOrUpdateTopic (qui sauvegarde) -->
    await addOrUpdateTopic(updatedTopic);

    logger.info(`Sujet mis à jour: ${updatedTopic.title} (ID: ${updatedTopic.id})`);
    res.json(updatedTopic);
  } catch (err) {
    logger.error(`Erreur mise à jour sujet ${req.params.id}:`, err);
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

    if (!Array.isArray(topicIds)) {
        return res.status(400).json({ message: 'Le corps de la requête doit contenir un tableau topicIds' });
    }

    // Vérifier que l'épisode existe
    const episode = getEpisodeById(episodeId);
    if (!episode || episode.programId !== programId) {
      return res.status(404).json({ message: 'Épisode parent non trouvé pour ce programme' });
    }

    // Mettre à jour l'ordre des sujets en utilisant les fonctions du store
    // C'est moins performant que de modifier directement le store, mais plus sûr
    // On pourrait optimiser en ajoutant une fonction dédiée dans store.js si nécessaire
    const updates = topicIds.map((id, index) => {
        const topic = getTopicById(id);
        if (topic && topic.episodeId === episodeId) {
            // Créer une copie mise à jour
            return { ...topic, order: index, updatedAt: new Date().toISOString() };
        } else {
            logger.warn(`Tentative de réorganisation d'un topic invalide (ID: ${id}) ou n'appartenant pas à l'épisode ${episodeId}`);
            return null; // Ignorer les IDs invalides ou non correspondants
        }
    }).filter(Boolean); // Filtrer les nulls

    // Appliquer les mises à jour
    // Note: addOrUpdateTopic sauvegarde à chaque appel, ce n'est pas idéal pour les perfs.
    // Une fonction bulkUpdateTopicsOrder serait mieux.
    for (const updatedTopic of updates) {
        addOrUpdateTopic(updatedTopic); // Sauvegarde à chaque fois
    }
    // Si on veut une seule sauvegarde, il faudrait modifier addOrUpdateTopic
    // pour ne pas sauvegarder, et appeler saveStore() ici une seule fois.
    // Pour l'instant, on garde la simplicité.

    logger.info(`Ordre des sujets mis à jour pour l'épisode ${episodeId}`);
    res.json({ message: 'Ordre mis à jour avec succès' });
  } catch (err) {
    logger.error(`Erreur mise à jour ordre sujets pour épisode ${req.params.episodeId}:`, err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l'ordre' });
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

    // <-- Modifié: Utiliser getTopicById pour vérifier l'existence et les IDs parents -->
    const topicToDelete = getTopicById(topicId);

    if (!topicToDelete || topicToDelete.programId !== programId || topicToDelete.episodeId !== episodeId) {
      return res.status(404).json({ message: 'Sujet non trouvé pour cet épisode/programme' });
    }

    // <-- Modifié: Utiliser deleteTopicCascade (prend juste topicId, gère la sauvegarde et le compteur) -->
    const deleted = await deleteTopicCascade(topicId);

    if (deleted) {
        logger.info(`Sujet supprimé: ${topicToDelete.title} (ID: ${topicId})`);
        res.json({ message: 'Sujet supprimé avec succès' });
    } else {
        logger.warn(`Tentative de suppression du sujet ${topicId} échouée après l'avoir trouvé.`);
        res.status(500).json({ message: 'Erreur lors de la suppression du sujet dans le store' });
    }

  } catch (err) {
    logger.error(`Erreur suppression sujet ${req.params.id}:`, err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du sujet' });
  }
});

module.exports = router;
