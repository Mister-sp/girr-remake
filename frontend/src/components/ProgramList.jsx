import React, { useState, useEffect } from 'react';
import { getPrograms, createProgram, deleteProgram, updateProgram } from '../services/api'; // Importer createProgram, deleteProgram et updateProgram
import defaultLogo from '../assets/default-logo.png';
import Modal from './Modal.jsx';
import './logo-effects.css';

// Accepter onSelectProgram en props
function ProgramList({ onSelectProgram }) {
  const [showModal, setShowModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProgramTitle, setNewProgramTitle] = useState(''); // État pour le titre du nouveau programme
  const [newLogoFile, setNewLogoFile] = useState(null); // État pour le logo du nouveau programme
  const [newLogoPosition, setNewLogoPosition] = useState('top-right');
  const [newLogoSize, setNewLogoSize] = useState(80);
  const [newLogoEffect, setNewLogoEffect] = useState('none');
  const [newLogoEffectIntensity, setNewLogoEffectIntensity] = useState(5);

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
      formData.append('logoPosition', newLogoPosition);
      formData.append('logoSize', newLogoSize);
      formData.append('logoEffect', newLogoEffect);
      formData.append('logoEffectIntensity', newLogoEffectIntensity);
      await createProgram(formData); // Appeler l'API pour créer
      setNewProgramTitle(''); // Vider le champ de saisie
      setNewLogoFile(null);
      setNewLogoPosition('top-right');
      setNewLogoSize(80);
      setNewLogoEffect('none');
      setNewLogoEffectIntensity(5);
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
        <ProgramForm
  onSubmit={handleAddProgram}
  title={newProgramTitle}
  setTitle={setNewProgramTitle}
  logoFile={newLogoFile}
  setLogoFile={setNewLogoFile}
  logoPosition={newLogoPosition}
  setLogoPosition={setNewLogoPosition}
  logoSize={newLogoSize}
  setLogoSize={setNewLogoSize}
  logoEffect={newLogoEffect}
  setLogoEffect={setNewLogoEffect}
/>
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
        <ProgramForm
  onSubmit={handleAddProgram}
  title={newProgramTitle}
  setTitle={setNewProgramTitle}
  logoFile={newLogoFile}
  setLogoFile={setNewLogoFile}
  logoPosition={newLogoPosition}
  setLogoPosition={setNewLogoPosition}
  logoSize={newLogoSize}
  setLogoSize={setNewLogoSize}
  logoEffect={newLogoEffect}
  setLogoEffect={setNewLogoEffect}
/>
      </Modal>
      {/* Passer onSelectProgram à ProgramDisplay */}
      <ProgramDisplay programs={programs} onDelete={handleDeleteProgram} onSelect={onSelectProgram} />
    </div>
  );
}

// Sous-composant pour le formulaire d'ajout
function ProgramForm({ onSubmit, title, setTitle, logoFile, setLogoFile, logoPosition, setLogoPosition, logoSize, setLogoSize, logoEffect, setLogoEffect, logoEffectIntensity, setLogoEffectIntensity }) {
  return (
    <form onSubmit={onSubmit} style={{marginBottom:'20px', maxWidth:380}} encType="multipart/form-data">
      <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:340,overflowY:'auto',paddingRight:6}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Titre du programme</label>
          <input
            type="text"
            placeholder="Titre du programme"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{fontSize: 18, borderRadius: 6, border: '1px solid #bbb', padding: 6, width:'100%'}}
          />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setLogoFile(e.target.files[0])}
          />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Position du logo</label>
          <select value={logoPosition} onChange={e=>setLogoPosition(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
            <option value="top-left">Haut gauche</option>
            <option value="top-center">Haut centre</option>
            <option value="top-right">Haut droite</option>
            <option value="bottom-left">Bas gauche</option>
            <option value="bottom-center">Bas centre</option>
            <option value="bottom-right">Bas droite</option>
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Taille du logo (px)</label>
          <input type="number" placeholder="Taille (px)" style={{width:100,fontSize:16,padding:'4px 8px'}} value={logoSize} onChange={e=>setLogoSize(Number(e.target.value))} />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Effet</label>
          <select value={logoEffect || 'none'} onChange={e=>setLogoEffect(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
            <option value="none">Aucun</option>
            <option value="float">Flottant</option>
            <option value="glitch">Glitch</option>
            <option value="pulse">Pulse</option>
            <option value="oldtv">Old TV</option>
            <option value="vhs">VHS</option>
          </select>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button type="submit" title="Ajouter" style={{color: 'white', background:'#43a047', border:'none', borderRadius:6, fontSize:18, padding:'6px 18px', fontWeight:600, cursor:'pointer'}}><FaPlus style={{marginRight:5}}/>Créer</button>
        </div>
      </div>
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
  const [editLogoPosition, setEditLogoPosition] = useState('top-right'); // valeurs: 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'
  const [editLogoSize, setEditLogoSize] = useState(80);
  const [editLogoEffect, setEditLogoEffect] = useState('float'); // valeurs: 'none', 'float', 'glitch', 'pulse'
  const [editLogoEffectIntensity, setEditLogoEffectIntensity] = useState(5);

  const [saving, setSaving] = useState(false);

  const handleEditClick = (program) => {
    setEditingId(program.id);
    setEditTitle(program.title);
    setEditLogoPreview(program.logoUrl ? `http://localhost:3001${program.logoUrl}` : null);
    setEditLogoFile(null);
    setEditLogoPosition(program.logoPosition || 'top-right');
    setEditLogoSize(program.logoSize || 80);
    setEditLogoEffect(program.logoEffect || 'none');
    setEditLogoEffectIntensity(program.logoEffectIntensity || 5);
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
      formData.append('logoPosition', editLogoPosition);
      formData.append('logoSize', editLogoSize);
      formData.append('logoEffect', editLogoEffect);
      formData.append('logoEffectIntensity', editLogoEffectIntensity);
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
                      <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:340,overflowY:'auto',paddingRight:6}}>

                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
                          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Titre du programme</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            style={{fontSize: 18, borderRadius: 6, border: '1px solid #bbb', padding: 6, width:'100%'}}
                          />
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
                          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Logo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              setEditLogoFile(e.target.files[0]);
                              setEditLogoPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : editLogoPreview);
                            }}
                          />
                          {editLogoPreview && (
                            <img src={editLogoPreview} alt="logo preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginTop: 4, border: '2px solid #4F8CFF', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                          )}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
                          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Position du logo</label>
                          <select value={editLogoPosition} onChange={e=>setEditLogoPosition(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
                            <option value="top-left">Haut gauche</option>
                            <option value="top-center">Haut centre</option>
                            <option value="top-right">Haut droite</option>
                            <option value="bottom-left">Bas gauche</option>
                            <option value="bottom-center">Bas centre</option>
                            <option value="bottom-right">Bas droite</option>
                          </select>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
                          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Taille du logo (px)</label>
                          <input type="number" placeholder="Taille (px)" style={{width:100,fontSize:16,padding:'4px 8px'}} value={editLogoSize} onChange={e=>setEditLogoSize(Number(e.target.value))} />
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
                          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Effet</label>
                          <select value={editLogoEffect} onChange={e=>setEditLogoEffect(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
                            <option value="none">Aucun</option>
                            <option value="float">Flottant</option>
                            <option value="glitch">Glitch</option>
                            <option value="pulse">Pulse</option>
                            <option value="oldtv">Old TV</option>
                            <option value="vhs">VHS</option>
                          </select>
                          <label style={{fontWeight:600,margin:'8px 0 2px 0',color:'#222'}}>Intensité de l'effet</label>
                          <input type="range" min={1} max={10} value={editLogoEffectIntensity} onChange={e=>setEditLogoEffectIntensity(Number(e.target.value))} style={{width:'100%'}} />
                        </div>
                        <div style={{display:'flex',gap:8,marginTop:12}}>
                          <button onClick={() => handleEditSave(program.id)} disabled={saving} style={{color: 'white', background:'#43a047', border:'none', borderRadius:6, fontSize:18, padding:'6px 18px', fontWeight:600, cursor:'pointer'}}><FaCheck style={{marginRight:5}}/>Valider</button>
                          <button onClick={handleEditCancel} disabled={saving} style={{color: 'white', background:'#e53935', border:'none', borderRadius:6, fontSize:18, padding:'6px 18px', fontWeight:600, cursor:'pointer'}}><FaTimes style={{marginRight:5}}/>Annuler</button>
                        </div>
                      </div>
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
