/**
 * Routes de gestion des programmes.
 * @module routes/programs
 */

const express = require('express');
const router = express.Router();
const { store, saveStore, deleteProgramCascade } = require('../data/store');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Configuration de multer pour les logos
const storage = multer.diskStorage({
  destination: './public/logos',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

/**
 * Liste tous les programmes.
 * 
 * @name GET /api/programs
 * @function
 * @memberof module:routes/programs
 * @returns {Array} Liste des programmes
 */
router.get('/', (req, res) => {
  res.json(store.programs);
});

/**
 * Récupère un programme par son ID.
 * 
 * @name GET /api/programs/:id
 * @function
 * @memberof module:routes/programs
 * @param {number} id - ID du programme
 * @returns {Object} Programme trouvé
 */
router.get('/:id', (req, res) => {
  const program = store.programs.find(p => p.id === parseInt(req.params.id));
  if (!program) {
    return res.status(404).json({ message: 'Programme non trouvé' });
  }
  res.json(program);
});

/**
 * Crée un nouveau programme.
 * 
 * @name POST /api/programs
 * @function
 * @memberof module:routes/programs
 * @param {Object} req.body - Données du programme
 * @param {string} req.body.title - Titre du programme
 * @param {string} [req.body.description] - Description du programme
 * @param {File} [req.files.logo] - Fichier logo
 * @returns {Object} Programme créé
 */
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const program = {
      id: store.nextProgramId++,
      title: req.body.title,
      description: req.body.description || '',
      logoUrl: req.file ? `/logos/${req.file.filename}` : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.programs.push(program);
    await saveStore();
    
    logger.info(`Programme créé: ${program.title} (ID: ${program.id})`);
    res.status(201).json(program);
  } catch (err) {
    logger.error('Erreur création programme:', err);
    res.status(500).json({ message: 'Erreur création programme' });
  }
});

/**
 * Met à jour un programme.
 * 
 * @name PUT /api/programs/:id
 * @function
 * @memberof module:routes/programs
 * @param {number} id - ID du programme
 * @param {Object} req.body - Données à mettre à jour
 * @returns {Object} Programme mis à jour
 */
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    const program = store.programs.find(p => p.id === programId);
    
    if (!program) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }

    // Supprimer l'ancien logo si un nouveau est fourni
    if (req.file && program.logoUrl) {
      const oldLogoPath = path.join(__dirname, '../public', program.logoUrl);
      await fs.unlink(oldLogoPath).catch(() => {});
    }

    // Mettre à jour les champs
    Object.assign(program, {
      title: req.body.title || program.title,
      description: req.body.description || program.description,
      logoUrl: req.file ? `/logos/${req.file.filename}` : program.logoUrl,
      updatedAt: new Date().toISOString()
    });

    await saveStore();
    
    logger.info(`Programme mis à jour: ${program.title} (ID: ${program.id})`);
    res.json(program);
  } catch (err) {
    logger.error('Erreur mise à jour programme:', err);
    res.status(500).json({ message: 'Erreur mise à jour programme' });
  }
});

/**
 * Supprime un programme.
 * 
 * @name DELETE /api/programs/:id
 * @function
 * @memberof module:routes/programs
 * @param {number} id - ID du programme
 * @returns {Object} Message de confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    const program = store.programs.find(p => p.id === programId);
    
    if (!program) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }

    // Supprimer le logo si présent
    if (program.logoUrl) {
      const logoPath = path.join(__dirname, '../public', program.logoUrl);
      await fs.unlink(logoPath).catch(() => {});
    }

    // Supprimer le programme et ses dépendances
    deleteProgramCascade(programId);
    
    logger.info(`Programme supprimé: ${program.title} (ID: ${program.id})`);
    res.json({ message: 'Programme supprimé' });
  } catch (err) {
    logger.error('Erreur suppression programme:', err);
    res.status(500).json({ message: 'Erreur suppression programme' });
  }
});

module.exports = router;
