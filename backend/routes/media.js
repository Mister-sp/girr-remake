console.log("media.js chargé");
const express = require('express');
const router = express.Router({ mergeParams: true });
const { store, deleteTopicCascade } = require('../data/store'); // Importer store directement
const { mediaCounter } = require('../config/monitoring');

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

// GET tous les médias pour un sujet spécifique (TRIÉS PAR ORDRE)
router.get('/', (req, res) => {
  const { programId, episodeId, topicId } = req.params;
  const topicMedia = store.mediaItems // Correction: Utiliser mediaItems
    .filter(m => m.programId === parseInt(programId) && m.episodeId === parseInt(episodeId) && m.topicId === parseInt(topicId))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)); 
  res.json(topicMedia);
});

// GET un média spécifique par ID
router.get('/:mediaId', (req, res) => {
  const { programId, episodeId, topicId, mediaId } = req.params;
  const media = store.mediaItems.find(m => // Correction: Utiliser mediaItems
    m.id === parseInt(mediaId) && 
    m.programId === parseInt(programId) && 
    m.episodeId === parseInt(episodeId) && 
    m.topicId === parseInt(topicId)
  );
  if (!media) {
    return res.status(404).json({ message: 'Média non trouvé' });
  }
  res.json(media);
});

// POST un nouveau média pour un sujet
router.post('/', (req, res) => {
  const { programId, episodeId, topicId } = req.params;
  const { type, content } = req.body;

  // Trouver l'ordre maximum actuel pour ce sujet
  const currentTopicMedia = store.mediaItems // Correction: Utiliser mediaItems
     .filter(m => m.programId === parseInt(programId) && m.episodeId === parseInt(episodeId) && m.topicId === parseInt(topicId));
  const maxOrder = currentTopicMedia.reduce((max, m) => Math.max(max, m.order ?? -1), -1);

  const newMedia = {
    id: store.nextMediaId++,
    programId: parseInt(programId),
    episodeId: parseInt(episodeId),
    topicId: parseInt(topicId),
    type: type || 'text',
    content: content || '',
    order: maxOrder + 1
  };
  store.mediaItems.push(newMedia); // Correction: Utiliser mediaItems
  mediaCounter.inc(); // Incrémenter le compteur de médias
  console.log('Nouveau média ajouté:', newMedia);
  res.status(201).json(newMedia);
});

// PUT (modifier) un média existant
router.put('/:mediaId', (req, res) => {
  const { programId, episodeId, topicId, mediaId } = req.params;
  const { type, content } = req.body; // Permettre la modification de type et content

  const mediaIndex = store.mediaItems.findIndex(m => // Correction: Utiliser mediaItems
    m.id === parseInt(mediaId) && 
    m.programId === parseInt(programId) && 
    m.episodeId === parseInt(episodeId) && 
    m.topicId === parseInt(topicId)
  );

  if (mediaIndex === -1) {
    return res.status(404).json({ message: 'Média non trouvé' });
  }

  // Mettre à jour les champs fournis
  const mediaItem = store.mediaItems[mediaIndex]; // Correction: Utiliser mediaItems
  if (type !== undefined) mediaItem.type = type;
  if (content !== undefined) mediaItem.content = content;
  // Ne pas modifier l'ordre ici

  console.log('Média mis à jour:', mediaItem);
  res.json(mediaItem);
});

// DELETE un média existant
router.delete('/:mediaId', (req, res) => {
  const { programId, episodeId, topicId, mediaId } = req.params;
  const initialLength = store.mediaItems.length; // Correction: Utiliser mediaItems
  store.mediaItems = store.mediaItems.filter(m => // Correction: Utiliser mediaItems
    !(m.id === parseInt(mediaId) && 
      m.programId === parseInt(programId) && 
      m.episodeId === parseInt(episodeId) && 
      m.topicId === parseInt(topicId))
  );

  if (store.mediaItems.length === initialLength) { // Correction: Utiliser mediaItems
    return res.status(404).json({ message: 'Média non trouvé' });
  }
  
  console.log(`Média ID ${mediaId} supprimé.`);
  // Pas besoin de renvoyer l'item supprimé, juste un succès
  res.status(204).send(); 
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
