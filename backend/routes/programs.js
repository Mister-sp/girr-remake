const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configurer multer pour stocker les logos dans /public/logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/logos'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Importer les routes imbriquées
const episodeRoutes = require('./episodes');
// Importer le store
const { store, deleteProgramCascade } = require('../data/store');
const fs = require('fs');

// NE PLUS UTILISER LES ROUTES IMBRIQUEES ICI - FAIT DANS SERVER.JS
// router.use('/:programId/episodes', episodeRoutes);

// GET /api/programs - Récupérer tous les programmes
router.get('/', (req, res) => {
  res.json(store.programs);
});

// POST /api/programs - Créer un nouveau programme
router.post('/', (req, res) => {
  const newProgram = { 
    id: store.nextProgramId++,
    title: req.body.title || 'Nouveau Programme',
    description: req.body.description || '',
    // Ajoutez d'autres champs si nécessaire
  };
  store.programs.push(newProgram);
  require('../data/store').saveStore();
  res.status(201).json(newProgram);
});

// GET /api/programs/:id - Récupérer un programme par ID
router.get('/:id', (req, res) => {
  const program = store.programs.find(p => p.id === parseInt(req.params.id));
  if (!program) {
    return res.status(404).send('Programme non trouvé.');
  }
  res.json(program);
});

// PUT /api/programs/:id - Mettre à jour un programme par ID
router.put('/:id', upload.single('logo'), (req, res) => {
  const programId = parseInt(req.params.id);
  const programIndex = store.programs.findIndex(p => p.id === programId);
  if (programIndex === -1) {
    return res.status(404).send('Programme non trouvé.');
  }
  // Assurer que l'on met à jour avec 'title' si fourni
  let logoUrl = store.programs[programIndex].logoUrl;
  // Si un nouveau logo est uploadé, supprimer l'ancien fichier et utiliser le nouveau
  if (req.file) {
    if (logoUrl) {
      const oldLogoPath = path.join(__dirname, '../public', logoUrl);
      try { if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath); } catch(e) {}
    }
    logoUrl = `/logos/${req.file.filename}`;
  }
  const updatedProgram = { 
    ...store.programs[programIndex], 
    title: req.body.title !== undefined ? req.body.title : store.programs[programIndex].title,
    description: req.body.description !== undefined ? req.body.description : store.programs[programIndex].description,
    logoUrl
  };
  // Assurer que l'ID n'est pas modifié
  updatedProgram.id = programId;
  store.programs[programIndex] = updatedProgram;
  require('../data/store').saveStore();
  res.json(updatedProgram);
});

// DELETE /api/programs/:id - Supprimer un programme par ID (avec cascade)
router.delete('/:id', (req, res) => {
  const programId = parseInt(req.params.id);
  const programIndex = store.programs.findIndex(p => p.id === programId);
  if (programIndex === -1) {
    return res.status(404).send('Programme non trouvé.');
  }
  const deletedProgramData = { ...store.programs[programIndex] }; // Copie avant suppression
  // Supprimer le fichier logo si présent
  if (deletedProgramData.logoUrl) {
    const logoPath = path.join(__dirname, '../public', deletedProgramData.logoUrl);
    try {
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    } catch (e) {
      console.error('Erreur suppression logo:', e);
    }
  }
  // Utiliser la fonction de suppression en cascade du store
  deleteProgramCascade(programId);
  res.json(deletedProgramData); // Renvoyer les données du programme supprimé
});

module.exports = router;
