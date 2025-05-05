/**
 * Routes de gestion des médias (fichiers, URLs) attachés aux sujets.
 * @module routes/media
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {
  getTopicById,
  getMediaItemById,
  addOrUpdateMediaItem,
  deleteMediaItem,
  getNextMediaId,
  getMediaByTopicId
} = require('../data/store');
const { mediaCounter } = require('../config/monitoring');
const logger = require('../config/logger');
// <-- Ajouté: Import du module de pagination -->
const { paginateData } = require('../config/pagination');

// Configuration multer pour les fichiers média
const storage = multer.diskStorage({
  destination: './public/media',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `media-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du média
 *         type:
 *           type: string
 *           enum: [image, video, iframe]
 *           description: Type de média
 *         url:
 *           type: string
 *           description: URL du média
 *         duration:
 *           type: integer
 *           description: Durée d'affichage en secondes
 *         position:
 *           type: integer
 *           description: Position dans la liste des médias
 */

/**
 * @swagger
 * /api/programs/{programId}/episodes/{episodeId}/topics/{topicId}/media:
 *   get:
 *     summary: Récupère tous les médias d'un topic
 *     tags: [Media]
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
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des médias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Media'
 *   post:
 *     summary: Ajoute un nouveau média
 *     tags: [Media]
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
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Media'
 *     responses:
 *       201:
 *         description: Média ajouté avec succès
 */

/**
 * Liste les médias d'un sujet avec support de pagination.
 *
 * @name GET /api/programs/:programId/episodes/:episodeId/topics/:topicId/media
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @returns {Array} Liste des médias paginée
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);

  // Vérifier que le topic existe et appartient au bon programme/épisode
  const topic = getTopicById(topicId);
  if (!topic || topic.programId !== programId || topic.episodeId !== episodeId) {
    return res.sendError('Sujet parent non trouvé pour ce programme/épisode', { status: 404 });
  }

  // Récupérer tous les médias du sujet
  const allMedia = getMediaByTopicId(topicId);
  
  // Utiliser la méthode standardisée pour envoyer une réponse paginée
  res.sendPaginated(allMedia, {
    type: 'mediaItems',
    message: `${allMedia.length} médias trouvés pour le sujet ${topic.title}`
  });
});

/**
 * Récupère un média par son ID.
 * 
 * @name GET /api/programs/:programId/episodes/:episodeId/topics/:topicId/media/:id
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @param {number} id - ID du média
 * @returns {Object} Média trouvé
 */
router.get('/:id', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);
  const mediaId = parseInt(req.params.id);

  const media = getMediaItemById(mediaId);

  if (!media || media.programId !== programId || media.episodeId !== episodeId || media.topicId !== topicId) {
    return res.sendError('Média non trouvé pour ce sujet/épisode/programme', { status: 404 });
  }

  res.sendSuccess(media, {
    message: `Média ${media.originalName || media.url} récupéré avec succès`
  });
});

/**
 * Télécharge un fichier média.
 * 
 * @name POST /api/programs/:programId/episodes/:episodeId/topics/:topicId/media/upload
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @param {File} req.file - Fichier média
 * @returns {Object} Média créé
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.sendError('Aucun fichier fourni', { status: 400 });
    }

    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.topicId);

    const topic = getTopicById(topicId);
    if (!topic || topic.programId !== programId || topic.episodeId !== episodeId) {
      return res.sendError('Sujet parent non trouvé pour ce programme/épisode', { status: 404 });
    }

    // Déterminer l'ordre (position) du nouveau média
    const existingMedia = getMediaByTopicId(topicId);
    const newOrder = existingMedia.length;

    const newMedia = {
      id: getNextMediaId(),
      programId,
      episodeId,
      topicId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/media/${req.file.filename}`,
      order: newOrder, // Position à la fin de la liste par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addOrUpdateMediaItem(newMedia);

    logger.info(`Média uploadé: ${newMedia.originalName} (ID: ${newMedia.id}, Sujet: ${topic.title})`);
    
    res.sendSuccess(newMedia, {
      message: `Média "${newMedia.originalName}" uploadé avec succès`,
      status: 201
    });
  } catch (err) {
    logger.error('Erreur upload média:', err);
    res.sendError('Erreur lors de l\'upload du média', { 
      status: 500,
      details: err.message 
    });
  }
});

/**
 * Met à jour les métadonnées d'un média.
 * 
 * @name PUT /api/programs/:programId/episodes/:episodeId/topics/:topicId/media/:id
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @param {number} id - ID du média
 * @param {Object} req.body - Données à mettre à jour
 * @returns {Object} Média mis à jour
 */
router.put('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.topicId);
    const mediaId = parseInt(req.params.id);

    const existingMedia = getMediaItemById(mediaId);

    if (!existingMedia || existingMedia.programId !== programId || 
        existingMedia.episodeId !== episodeId || existingMedia.topicId !== topicId) {
      return res.sendError('Média non trouvé pour ce sujet/épisode/programme', { status: 404 });
    }

    // Créer l'objet mis à jour
    const updatedMedia = {
        ...existingMedia,
        title: req.body.title !== undefined ? req.body.title : existingMedia.title,
        description: req.body.description !== undefined ? req.body.description : existingMedia.description,
        order: req.body.order !== undefined ? req.body.order : existingMedia.order,
        // Possibilité d'ajouter d'autres champs ici selon besoin
        updatedAt: new Date().toISOString()
    };

    await addOrUpdateMediaItem(updatedMedia);

    logger.info(`Média mis à jour: ${updatedMedia.originalName || updatedMedia.url} (ID: ${updatedMedia.id})`);
    
    res.sendSuccess(updatedMedia, {
      message: `Média "${updatedMedia.originalName || updatedMedia.url}" mis à jour avec succès`
    });
  } catch (err) {
    logger.error(`Erreur mise à jour média ${req.params.id}:`, err);
    res.sendError('Erreur lors de la mise à jour du média', { 
      status: 500,
      details: err.message
    });
  }
});

/**
 * Supprime un média.
 * 
 * @name DELETE /api/programs/:programId/episodes/:episodeId/topics/:topicId/media/:id
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @param {number} id - ID du média
 * @returns {Object} Message de confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.topicId);
    const mediaId = parseInt(req.params.id);

    const mediaToDelete = getMediaItemById(mediaId);

    if (!mediaToDelete || mediaToDelete.programId !== programId || 
        mediaToDelete.episodeId !== episodeId || mediaToDelete.topicId !== topicId) {
      return res.sendError('Média non trouvé pour ce sujet/épisode/programme', { status: 404 });
    }

    // Supprimer le fichier physique si c'est un upload et non une URL externe
    if (mediaToDelete.filename) {
        try {
            const filePath = path.join(__dirname, '../public/media', mediaToDelete.filename);
            await fs.unlink(filePath);
            logger.info(`Fichier média supprimé: ${filePath}`);
        } catch (fileErr) {
            logger.warn(`Erreur lors de la suppression du fichier média ${mediaToDelete.filename}:`, fileErr);
            // On continue même si le fichier ne peut pas être supprimé
        }
    }

    const deleted = await deleteMediaItem(mediaId);

    if (deleted) {
        logger.info(`Média supprimé: ${mediaToDelete.originalName || mediaToDelete.url} (ID: ${mediaId})`);
        res.sendSuccess(
          { deleted: true, id: mediaId },
          { message: `Média "${mediaToDelete.originalName || mediaToDelete.url}" supprimé avec succès` }
        );
    } else {
        logger.warn(`Tentative de suppression du média ${mediaId} échouée après l'avoir trouvé.`);
        res.sendError('Erreur lors de la suppression du média dans le store', { status: 500 });
    }
  } catch (err) {
    logger.error(`Erreur suppression média ${req.params.id}:`, err);
    res.sendError('Erreur serveur lors de la suppression du média', { 
      status: 500,
      details: err.message
    });
  }
});

// PUT /order - Mettre à jour l'ordre des médias
router.put('/order', async (req, res) => {
  try {
    const { programId, episodeId, topicId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.sendError('Le corps de la requête doit contenir un tableau orderedIds', { status: 400 });
    }

    // Parser les IDs des paramètres d'URL
    const pId = parseInt(programId);
    const eId = parseInt(episodeId);
    const tId = parseInt(topicId);

    // Vérifier la validité des paramètres
    if (isNaN(pId) || isNaN(eId) || isNaN(tId)) {
      logger.error(`Paramètres d'URL invalides: programId=${programId}, episodeId=${episodeId}, topicId=${topicId}`);
      return res.sendError('Paramètre ID invalide dans l\'URL', { status: 400 });
    }

    // Vérifier que le topic existe
    const topic = getTopicById(tId);
    if (!topic || topic.programId !== pId || topic.episodeId !== eId) {
      return res.sendError('Sujet non trouvé pour ce programme/épisode', { status: 404 });
    }

    // Récupérer les médias du topic
    const topicMedia = getMediaByTopicId(tId);
    if (topicMedia.length === 0) {
      logger.warn(`Aucun média trouvé pour programId=${pId}, episodeId=${eId}, topicId=${tId}`);
      return res.sendError('Aucun média trouvé pour ce sujet', { status: 404 });
    }

    // Créer une map pour accès rapide
    const mediaMap = new Map(topicMedia.map(item => [item.id, { ...item }]));
    const updatedIds = [];

    // Appliquer les changements d'ordre pour chaque ID dans orderedIds
    for (let i = 0; i < orderedIds.length; i++) {
      const id = parseInt(orderedIds[i]);
      if (isNaN(id)) continue;

      const mediaItem = mediaMap.get(id);
      if (mediaItem && mediaItem.order !== i) {
        // Créer une copie mise à jour avec le nouvel ordre
        const updatedMedia = {
          ...mediaItem,
          order: i,
          updatedAt: new Date().toISOString()
        };
            
        // Mise à jour dans le store
        await addOrUpdateMediaItem(updatedMedia);
        logger.debug(`Ordre du média ID ${id} mis à jour: ${mediaItem.order} -> ${i}`);
        updatedIds.push(id);
      }
    }

    // Les médias du topic non inclus dans orderedIds sont relégués à la fin
    const missingMediaIds = Array.from(mediaMap.keys()).filter(id => 
      !orderedIds.includes(id) && !orderedIds.includes(String(id))
    );

    for (let i = 0; i < missingMediaIds.length; i++) {
      const id = missingMediaIds[i];
      const mediaItem = mediaMap.get(id);
      const newOrder = orderedIds.length + i;
        
      if (mediaItem && mediaItem.order !== newOrder) {
        const updatedMedia = {
          ...mediaItem,
          order: newOrder,
          updatedAt: new Date().toISOString()
        };
            
        // Mise à jour dans le store
        await addOrUpdateMediaItem(updatedMedia);
        logger.debug(`Média ID ${id} (non ordonné explicitement) relégué avec ordre: ${mediaItem.order} -> ${newOrder}`);
        updatedIds.push(id);
      }
    }

    logger.info(`Ordre des médias mis à jour pour le sujet ID ${tId}`);
    
    res.sendSuccess(
      { updatedIds, topicId: tId },
      { message: `Ordre de ${updatedIds.length} médias mis à jour avec succès` }
    );
  } catch (err) {
    logger.error(`Erreur lors de la mise à jour de l'ordre des médias:`, err);
    res.sendError('Erreur serveur lors de la mise à jour de l\'ordre des médias', {
      status: 500,
      details: err.message
    });
  }
});

// Middleware de log placé tout en haut du fichier pour logger TOUTES les requêtes
router.use((req, res, next) => {
  logger.debug(`Requête reçue sur /media : ${req.method} ${req.originalUrl}`);
  next();
});

module.exports = router;
