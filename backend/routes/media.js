/**
 * Routes de gestion des médias (fichiers, URLs) attachés aux sujets.
 * @module routes/media
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { store, saveStore } = require('../data/store');
const { mediaCounter } = require('../config/monitoring');
const logger = require('../config/logger');

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
 * Liste les médias d'un sujet.
 * 
 * @name GET /api/programs/:programId/episodes/:episodeId/topics/:topicId/media
 * @function
 * @memberof module:routes/media
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet parent
 * @returns {Array} Liste des médias
 */
router.get('/', (req, res) => {
  const programId = parseInt(req.params.programId);
  const episodeId = parseInt(req.params.episodeId);
  const topicId = parseInt(req.params.topicId);

  const media = store.mediaItems.filter(m => 
    m.programId === programId && 
    m.episodeId === episodeId &&
    m.topicId === topicId
  );

  res.json(media);
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

  const media = store.mediaItems.find(m => 
    m.id === mediaId &&
    m.programId === programId && 
    m.episodeId === episodeId &&
    m.topicId === topicId
  );

  if (!media) {
    return res.status(404).json({ message: 'Média non trouvé' });
  }

  res.json(media);
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
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const programId = parseInt(req.params.programId);
    const episodeId = parseInt(req.params.episodeId);
    const topicId = parseInt(req.params.topicId);

    // Vérifier que le sujet parent existe
    const topic = store.topics.find(t => 
      t.id === topicId &&
      t.programId === programId &&
      t.episodeId === episodeId
    );
    if (!topic) {
      return res.status(404).json({ message: 'Sujet parent non trouvé' });
    }

    const media = {
      id: store.nextMediaId++,
      programId,
      episodeId,
      topicId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/media/${req.file.filename}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.mediaItems.push(media);
    await saveStore();

    // Incrémenter le compteur de médias
    mediaCounter.inc();

    logger.info(`Média uploadé: ${media.originalName} (ID: ${media.id}, Sujet: ${topic.title})`);
    res.status(201).json(media);
  } catch (err) {
    logger.error('Erreur upload média:', err);
    res.status(500).json({ message: 'Erreur upload média' });
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

    const media = store.mediaItems.find(m => 
      m.id === mediaId &&
      m.programId === programId && 
      m.episodeId === episodeId &&
      m.topicId === topicId
    );

    if (!media) {
      return res.status(404).json({ message: 'Média non trouvé' });
    }

    // Mettre à jour les champs
    Object.assign(media, {
      title: req.body.title || media.title,
      description: req.body.description || media.description,
      updatedAt: new Date().toISOString()
    });

    await saveStore();

    logger.info(`Média mis à jour: ${media.originalName} (ID: ${media.id})`);
    res.json(media);
  } catch (err) {
    logger.error('Erreur mise à jour média:', err);
    res.status(500).json({ message: 'Erreur mise à jour média' });
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

    const media = store.mediaItems.find(m => 
      m.id === mediaId &&
      m.programId === programId && 
      m.episodeId === episodeId &&
      m.topicId === topicId
    );

    if (!media) {
      return res.status(404).json({ message: 'Média non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '../public/media', media.filename);
    await fs.unlink(filePath);

    // Supprimer l'entrée de la base
    store.mediaItems = store.mediaItems.filter(m => m.id !== mediaId);
    await saveStore();

    logger.info(`Média supprimé: ${media.originalName} (ID: ${media.id})`);
    res.json({ message: 'Média supprimé' });
  } catch (err) {
    logger.error('Erreur suppression média:', err);
    res.status(500).json({ message: 'Erreur suppression média' });
  }
});

// PUT /order - Mettre à jour l'ordre des médias
router.put('/order', (req, res) => {
  const { programId, episodeId, topicId } = req.params;
  const orderedIds = req.body.orderedIds;

  // Log complet de la requête reçue
  console.log('--- Requête PUT /order reçue ---');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('Etat du store AVANT:', JSON.stringify(store.mediaItems, null, 2));

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ message: 'Le corps de la requête doit contenir un tableau orderedIds.' });
  }

  // Parser les IDs des paramètres d'URL ici une seule fois
  const pId = parseInt(programId);
  const eId = parseInt(episodeId);
  const tId = parseInt(topicId);

  // Vérifier si le parsing a fonctionné
  if (isNaN(pId) || isNaN(eId) || isNaN(tId)) {
      console.error(`Erreur: un des paramètres d'URL (programId=${programId}, episodeId=${episodeId}, topicId=${topicId}) n'est pas un nombre valide.`);
      return res.status(400).json({ message: 'Paramètre ID invalide dans l\'URL.' });
  }

  // DEBUG: log du store avant filtrage
  console.log('DEBUG: store.mediaItems AVANT filtrage:', JSON.stringify(store.mediaItems, null, 2));

  // Sélectionner tous les médias du topic concerné
  let topicMedia = store.mediaItems.filter(m =>
    m.programId === pId &&
    m.episodeId === eId &&
    m.topicId === tId
  );
  if (topicMedia.length === 0) {
    console.warn(`Aucun média trouvé pour programId=${pId}, episodeId=${eId}, topicId=${tId}`);
    return res.status(404).json({ message: 'Aucun média trouvé pour ce topic.' });
  }

  // DEBUG LOGS
  console.log('--- DEBUG /order ---');
  console.log('orderedIds reçus:', orderedIds);
  console.log('topicMedia trouvés:', JSON.stringify(topicMedia, null, 2));
  console.log('store.mediaItems complet:', JSON.stringify(store.mediaItems, null, 2));

  // Créer une map pour accès rapide
  const mediaMap = new Map(topicMedia.map(item => [item.id, item]));

  // Mettre à jour l'ordre pour ceux présents dans orderedIds
  let updateCount = 0;
  orderedIds.forEach((id, idx) => {
    const currentId = parseInt(id);
    if (isNaN(currentId)) {
      console.warn(` - ID '${id}' dans le tableau n'est pas un nombre valide, ignoré.`);
      return;
    }
    const mediaItem = mediaMap.get(currentId);
    if (mediaItem) {
      if (mediaItem.order !== idx) {
        mediaItem.order = idx;
        updateCount++;
        console.log(` - Média ID ${currentId} mis à jour avec order = ${idx}`);
      }
    } else {
      console.warn(` - Média ID ${currentId} (depuis orderedIds) non trouvé dans le topic ${tId}`);
    }
  });

  // Les médias du topic non inclus dans orderedIds sont relégués à la fin (ordre croissant après ceux ordonnés)
  const remainingMedia = topicMedia.filter(m => !orderedIds.includes(String(m.id)) && !orderedIds.includes(m.id));
  remainingMedia.forEach((m, i) => {
    const newOrder = orderedIds.length + i;
    if (m.order !== newOrder) {
      m.order = newOrder;
      updateCount++;
      console.log(` - Média ID ${m.id} (non ordonné explicitement) relégué à la fin avec order = ${newOrder}`);
    }
  });

  console.log(`${updateCount} ordres de médias mis à jour.`);
  console.log('Etat du store APRES:', JSON.stringify(store.mediaItems, null, 2));
  res.status(204).send();
});

// Middleware de log placé tout en haut du fichier pour logger TOUTES les requêtes
router.use((req, res, next) => {
  console.log('Requête reçue sur /media :', req.method, req.originalUrl);
  next();
});

module.exports = router;
