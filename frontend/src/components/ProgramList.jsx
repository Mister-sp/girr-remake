import React, { useState, useEffect } from 'react';
import { getPrograms, createProgram, deleteProgram, updateProgram } from '../services/api'; // Importer createProgram, deleteProgram et updateProgram
import defaultLogo from '../assets/default-logo.png';
import Modal from './Modal.jsx';

// Accepter onSelectProgram en props
function ProgramList({ onSelectProgram }) {
  const [showModal, setShowModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProgramTitle, setNewProgramTitle] = useState(''); // État pour le titre du nouveau programme
  const [newLogoFile, setNewLogoFile] = useState(null); // État pour le logo du nouveau programme

  // Fonction pour charger les programmes
  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await getPrograms();
      setPrograms(response.data);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des programmes:", err);
      setError('Impossible de charger les programmes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  // Gestionnaire pour la création d'un nouveau programme
  const handleAddProgram = async (e) => {
    e.preventDefault(); // Empêcher le rechargement de la page par le formulaire
    if (!newProgramTitle.trim()) {
      // Optionnel: Ajouter une validation ou un message si le titre est vide
      alert("Le titre du programme ne peut pas être vide.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', newProgramTitle);
      if (newLogoFile) formData.append('logo', newLogoFile);
      await createProgram(formData); // Appeler l'API pour créer
      setNewProgramTitle(''); // Vider le champ de saisie
      setNewLogoFile(null);
      await loadPrograms(); // Recharger la liste des programmes pour voir le nouveau
    } catch (err) {
      console.error("Erreur lors de la création du programme:", err);
      // Afficher une erreur plus spécifique à l'utilisateur ?
      setError('Impossible de créer le programme.');
    }
  };

  // Gestionnaire pour la suppression d'un programme
  const handleDeleteProgram = async (programId) => {
    // Confirmation avant suppression
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le programme ID ${programId} et tous ses épisodes/sujets/médias associés ?`)) {
      try {
        await deleteProgram(programId); // Appeler l'API de suppression
        await loadPrograms(); // Recharger la liste après suppression
      } catch (err) {
        console.error("Erreur lors de la suppression du programme:", err);
        setError('Impossible de supprimer le programme.');
      }
    }
  };

  if (loading) {
    return <div>Chargement des programmes...</div>;
  }

  if (error) {
    // Afficher l'erreur mais aussi le reste de l'UI pour permettre de réessayer
    return (
      <div>
        <div style={{ color: 'red' }}>Erreur : {error}</div>
        {/* Afficher quand même le formulaire et la liste existante si disponible */}
        <ProgramForm onSubmit={handleAddProgram} title={newProgramTitle} setTitle={setNewProgramTitle} logoFile={newLogoFile} setLogoFile={setNewLogoFile} />
        {/* Passer onSelectProgram à ProgramDisplay */}
        <ProgramDisplay programs={programs} onDelete={handleDeleteProgram} onSelect={onSelectProgram} />
      </div>
    );
  }

  return (
    <div>
      {/* Bouton flottant pour ouvrir le modal d'ajout */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          top: 32,
          right: 32,
          zIndex: 1000,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#4F8CFF',
          color: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        title="Ajouter un programme"
        aria-label="Ajouter un programme"
      >
        <FaPlus style={{ fontSize: 32, display: 'block', margin: 0, padding: 0 }} />
      </button>
      {/* Modal d'ajout */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <ProgramForm onSubmit={handleAddProgram} title={newProgramTitle} setTitle={setNewProgramTitle} logoFile={newLogoFile} setLogoFile={setNewLogoFile} />
      </Modal>
      {/* Passer onSelectProgram à ProgramDisplay */}
      <ProgramDisplay programs={programs} onDelete={handleDeleteProgram} onSelect={onSelectProgram} />
    </div>
  );
}

// Sous-composant pour le formulaire d'ajout
function ProgramForm({ onSubmit, title, setTitle, logoFile, setLogoFile }) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }} encType="multipart/form-data">
      <h3>Ajouter un nouveau programme</h3>
      <input
        type="text"
        placeholder="Titre du programme"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ marginRight: '10px' }}
      />
      <input
  type="file"
  accept="image/*"
  onChange={e => setLogoFile(e.target.files[0])}
  style={{ marginRight: '10px' }}
/>
<button type="submit" title="Ajouter"><FaPlus /></button>
    </form>
  );
}

// Sous-composant pour afficher la liste
// Ajouter 'onSelect' aux props
import { FaPencilAlt, FaCheck, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

function ProgramDisplay({ programs, onDelete, onSelect }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
const [editLogoFile, setEditLogoFile] = useState(null);
const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleEditClick = (program) => {
    setEditingId(program.id);
    setEditTitle(program.title);
    setEditLogoPreview(program.logoUrl ? `http://localhost:3001${program.logoUrl}` : null);
    setEditLogoFile(null);
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditLogoFile(null);
    setEditLogoPreview(null);
  };
  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      if (editLogoFile) formData.append('logo', editLogoFile);
      await updateProgram(id, formData);
      setEditingId(null);
      setEditTitle('');
      setEditLogoFile(null);
      setEditLogoPreview(null);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{marginBottom: 32}}>Liste des Programmes</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '32px',
          marginBottom: 40
        }}
      >
        {programs.length === 0 ? (
          <p>Aucun programme trouvé.</p>
        ) : (
          programs.map((program) => {
            const imageUrl = program.logoUrl ? `http://localhost:3001${program.logoUrl}` : defaultLogo;
            return (
              <div
                key={program.id}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1/1',
                  minHeight: 0,
                  maxHeight: 'none',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                  background: `url(${imageUrl}) center/cover no-repeat`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  border: '1px solid #e0e0e0',
                  transition: 'box-shadow .2s',
                }}
              >
                {/* Overlay titre */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'rgba(40,40,40,0.60)',
                  color: '#fff',
                  padding: '16px 0',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: 1,
                  textShadow: '0 2px 8px #222',
                  zIndex: 2
                }}>
                  {editingId === program.id ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        style={{marginRight: '8px', fontSize: 20, borderRadius: 6, border: '1px solid #bbb', padding: 4}}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          setEditLogoFile(e.target.files[0]);
                          setEditLogoPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : editLogoPreview);
                        }}
                        style={{marginRight: '8px'}}
                      />
                      {editLogoPreview && (
                        <img src={editLogoPreview} alt="logo preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, marginRight: 8, border: '2px solid #4F8CFF', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                      )}
                      <button onClick={() => handleEditSave(program.id)} disabled={saving} style={{color: 'green', marginRight: 4, fontSize: 18}}><FaCheck /></button>
                      <button onClick={handleEditCancel} disabled={saving} style={{color: 'red', fontSize: 18}}><FaTimes /></button>
                    </>
                  ) : (
                    <>
                      <span
                        onClick={() => onSelect(program.id, program.title)}
                        style={{ cursor: 'pointer', fontSize: 24 }}
                      >
                        {program.title}
                      </span>
                      <span style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditClick(program)} style={{marginRight: 8, fontSize: 18, background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}} title="Éditer"><FaPencilAlt /></button>
                        <button
                          onClick={() => onDelete(program.id)}
                          style={{ color: 'red', cursor: 'pointer', fontSize: 18, background: 'none', border: 'none' }}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </span>
                    </>
                  )}
                </div>
                {/* Pour accessibilité, image cachée */}
                <img src={imageUrl} alt={program.title} style={{ display: 'none' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProgramList;
