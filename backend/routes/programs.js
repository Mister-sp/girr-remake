/**
 * Routes de gestion des programmes.
 * @module routes/programs
 */

const express = require('express');
const router = express.Router();
const {
  getAllPrograms,
  getProgramById,
  addOrUpdateProgram,
  deleteProgramCascade,
  getNextProgramId,
  saveStore
} = require('../data/store');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const { paginateData, calculatePagination } = require('../config/pagination');

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
 * Liste tous les programmes avec support de pagination.
 * 
 * @name GET /api/programs
 * @function
 * @memberof module:routes/programs
 * @returns {Array} Liste des programmes paginée
 */
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || undefined;
  const sortBy = req.query.sortBy || undefined;
  const sortDirection = req.query.sortDirection || undefined;
  
  // Récupérer tous les programmes
  const allPrograms = getAllPrograms();
  
  // Appliquer la pagination
  const result = paginateData(allPrograms, {
    page,
    pageSize,
    type: 'programs',
    sortBy,
    sortDirection
  });
  
  res.json(result);
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
  const program = getProgramById(parseInt(req.params.id));
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
    const newProgram = {
      id: getNextProgramId(),
      title: req.body.title,
      description: req.body.description || '',
      logoUrl: req.file ? `/logos/${req.file.filename}` : null,
      logoEffect: req.body.logoEffect || 'none',
      logoPosition: req.body.logoPosition || 'top-right',
      logoSize: parseInt(req.body.logoSize) || 80,
      lowerThirdConfig: req.body.lowerThirdConfig ? JSON.parse(req.body.lowerThirdConfig) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addOrUpdateProgram(newProgram);
    await saveStore();
    
    logger.info(`Programme créé: ${newProgram.title} (ID: ${newProgram.id})`);
    res.status(201).json(newProgram);
  } catch (err) {
    logger.error('Erreur création programme:', err);
    if (req.file) {
        await fs.unlink(req.file.path).catch(unlinkErr => logger.error(`Échec suppression logo uploadé après erreur: ${req.file.filename}`, unlinkErr));
    }
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
    const existingProgram = getProgramById(programId);
    
    if (!existingProgram) {
      if (req.file) {
          await fs.unlink(req.file.path).catch(unlinkErr => logger.error(`Échec suppression logo uploadé pour programme inexistant: ${req.file.filename}`, unlinkErr));
      }
      return res.status(404).json({ message: 'Programme non trouvé' });
    }

    let oldLogoPath = null;
    if (req.file && existingProgram.logoUrl) {
      oldLogoPath = path.join(__dirname, '../public', existingProgram.logoUrl);
    }

    const updatedProgram = {
        ...existingProgram,
        title: req.body.title !== undefined ? req.body.title : existingProgram.title,
        description: req.body.description !== undefined ? req.body.description : existingProgram.description,
        logoUrl: req.file ? `/logos/${req.file.filename}` : existingProgram.logoUrl,
        logoEffect: req.body.logoEffect !== undefined ? req.body.logoEffect : existingProgram.logoEffect,
        logoPosition: req.body.logoPosition !== undefined ? req.body.logoPosition : existingProgram.logoPosition,
        logoSize: req.body.logoSize !== undefined ? parseInt(req.body.logoSize) : existingProgram.logoSize,
        lowerThirdConfig: req.body.lowerThirdConfig ? JSON.parse(req.body.lowerThirdConfig) : existingProgram.lowerThirdConfig,
        updatedAt: new Date().toISOString()
    };

    addOrUpdateProgram(updatedProgram);
    await saveStore();

    if (oldLogoPath) {
        await fs.unlink(oldLogoPath).catch(unlinkErr => logger.error(`Échec suppression ancien logo: ${oldLogoPath}`, unlinkErr));
    }
    
    logger.info(`Programme mis à jour: ${updatedProgram.title} (ID: ${updatedProgram.id})`);
    res.json(updatedProgram);
  } catch (err) {
    logger.error(`Erreur mise à jour programme ${req.params.id}:`, err);
    if (req.file) {
        await fs.unlink(req.file.path).catch(unlinkErr => logger.error(`Échec suppression logo uploadé après erreur MAJ: ${req.file.filename}`, unlinkErr));
    }
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
    const programToDelete = getProgramById(programId);
    
    if (!programToDelete) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }

    const logoPathToDelete = programToDelete.logoUrl
        ? path.join(__dirname, '../public', programToDelete.logoUrl)
        : null;

    const deleted = deleteProgramCascade(programId);

    if (deleted) {
        if (logoPathToDelete) {
            await fs.unlink(logoPathToDelete).catch(unlinkErr => logger.error(`Échec suppression logo lors de la suppression du programme: ${logoPathToDelete}`, unlinkErr));
        }
        logger.info(`Programme supprimé: ${programToDelete.title} (ID: ${programId})`);
        res.json({ message: 'Programme supprimé avec succès' });
    } else {
         logger.warn(`Tentative de suppression du programme ${programId} échouée après l'avoir trouvé.`);
         res.status(500).json({ message: 'Erreur lors de la suppression du programme dans le store' });
    }

  } catch (err) {
    logger.error(`Erreur suppression programme ${req.params.id}:`, err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du programme' });
  }
});

module.exports = router;
