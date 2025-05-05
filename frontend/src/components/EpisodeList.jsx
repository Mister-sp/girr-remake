import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Importer les fonctions API pour les épisodes
import { getEpisodesForProgram, createEpisode, deleteEpisode, updateEpisode } from '../services/api';
import { extractDataArray } from '../services/adapters'; // Importer l'adaptateur
import ConfirmModal from './ConfirmModal.jsx';
import { useToast } from './ToastProvider.jsx';
import { FaPencilAlt, FaCheck, FaTimes, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';

import { buttonStyle } from './buttonStyle';
// Style uniforme pour tous les boutons d'action
// (supprimé car maintenant importé)

// Ce composant prend l'ID du programme parent en props
import { useNavigate } from 'react-router-dom';

function EpisodeList({ programId: propProgramId, programTitle: propProgramTitle, onSelectEpisode, onBack }) {
  const params = useParams();
  const programId = propProgramId || params.programId;
  const [programTitle, setProgramTitle] = useState(propProgramTitle || '');
  const navigate = useNavigate();

  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState('');

  // Charger le titre du programme si absent
  useEffect(() => {
    async function fetchTitle() {
      if (!programTitle && programId) {
        // Appel API pour récupérer le titre du programme
        try {
          const response = await fetch(`/api/programs/${programId}`);
          const data = await response.json();
          setProgramTitle(data.title || '');
        } catch (e) { setProgramTitle(''); }
      }
    }
    fetchTitle();
  }, [programId, programTitle]);

  // Fonction pour charger les épisodes du programme spécifié
  const loadEpisodes = async () => {
    if (!programId) return; // Ne rien faire si programId n'est pas fourni
    try {
      setLoading(true);
      const response = await getEpisodesForProgram(programId);
      // Utiliser l'adaptateur pour extraire le tableau d'épisodes, quelle que soit la structure
      const episodesArray = extractDataArray(response);
      setEpisodes(episodesArray);
      setError(null);
    } catch (err) {
      console.error(`Erreur lors de la récupération des épisodes pour le programme ${programId}:`, err);
      setError('Impossible de charger les épisodes.');
      setEpisodes([]); // Initialiser à un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Charger les épisodes lorsque programId change
  useEffect(() => {
    loadEpisodes();
  }, [programId]); // Dépendance à programId

  // Gestionnaire pour la création d'un nouvel épisode
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    if (!newEpisodeTitle.trim() || !programId) {
      alert("Le titre de l'épisode ne peut pas être vide.");
      return;
    }
    try {
      // Note: Le backend s'attend peut-être à d'autres champs (ex: position, etc.)
      // Pour l'instant, on envoie juste le titre.
      const episodeData = { title: newEpisodeTitle }; 
      const res = await createEpisode(programId, episodeData);
      setNewEpisodeTitle('');
      // Redirige automatiquement vers la page du nouvel épisode si l'API retourne l'id
      const newId = res && res.data && (res.data.id || res.data._id);
      if (newId) {
        navigate(`/program/${programId}/episode/${newId}`);
      } else {
        await loadEpisodes(); // fallback si pas d'id
      }
    } catch (err) {
      console.error("Erreur lors de la création de l'épisode:", err);
      setError('Impossible de créer l\'épisode.');
    }
  };

  // Gestionnaire pour la suppression d'un épisode
  const handleDeleteEpisode = async (episodeId) => {
    if (!programId) return;
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer l'épisode ID ${episodeId} et tous ses sujets/médias associés ?`;
    if (window.confirm(confirmationMessage)) { 
      try {
        await deleteEpisode(programId, episodeId);
        await loadEpisodes(); 
      } catch (err) {
        console.error("Erreur lors de la suppression de l'épisode:", err);
        setError('Impossible de supprimer l\'épisode.');
      }
    }
  };

  // Gestionnaire de navigation au clic sur un épisode
  const handleEpisodeClick = (episodeId, episodeTitle) => {
    navigate(`/program/${programId}/episode/${episodeId}`);
  };

  // Affichage
  if (!programId) {
    return <div>Sélectionnez un programme pour voir ses épisodes.</div>; // Ou null
  }

  if (loading) {
    return <div>Chargement des épisodes...</div>;
  }

  // Afficher l'erreur mais permettre de continuer
  if (error) {
    return (
      <div>
        <button onClick={onBack} style={{ marginBottom: '15px' }}>
          &larr; Retour aux Programmes 
        </button>
        {/* Ne plus afficher l'ID ici */}
        <h2>Épisodes de "{programTitle}"</h2>
        <div style={{ color: 'red' }}>Erreur : {error}</div>
        <EpisodeForm onSubmit={handleAddEpisode} title={newEpisodeTitle} setTitle={setNewEpisodeTitle} />
        <EpisodeDisplay episodes={episodes} onDelete={handleDeleteEpisode} onSelect={handleEpisodeClick} />
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={buttonStyle} title="Retour">
        <FaArrowLeft />
      </button>
      {/* Ne plus afficher l'ID ici */}
      <h2>Épisodes de "{programTitle}"</h2>
      <EpisodeForm onSubmit={handleAddEpisode} title={newEpisodeTitle} setTitle={setNewEpisodeTitle} />
      <EpisodeDisplay episodes={episodes} onDelete={handleDeleteEpisode} onSelect={handleEpisodeClick} />
    </div>
  );
}

// ---- Sous-composants pour le formulaire et l'affichage ----

function EpisodeForm({ onSubmit, title, setTitle }) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }}>
      <h3>Ajouter un nouvel épisode</h3>
      <input
        type="text"
        placeholder="Titre de l'épisode"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ marginRight: '10px' }}
      />
      <button type="submit" title="Ajouter"><FaPlus /></button>
    </form>
  );
}

function EpisodeDisplay({ episodes, onDelete, onSelect }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditClick = (episode) => {
    setEditingId(episode.id);
    setEditTitle(episode.title);
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };
  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await updateEpisode(episodes.find(e=>e.id===id).programId, id, { title: editTitle });
      setEditingId(null);
      setEditTitle('');
      if (typeof window !== 'undefined' && window.location) window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {episodes.length === 0 ? (
        <p>Aucun épisode trouvé pour ce programme.</p>
      ) : (
        <ul>
          {episodes.map((episode) => (
            <li key={episode.id} style={{ marginBottom: '5px' }}>
              {editingId === episode.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{marginRight: '8px'}}
                    disabled={saving}
                  />
                  <button onClick={() => handleEditSave(episode.id)} disabled={saving} style={{color: 'green', marginRight: 4}} title="Enregistrer"><FaCheck /></button>
                  <button onClick={handleEditCancel} disabled={saving} style={{color: 'red'}} title="Annuler"><FaTimes /></button>
                </>
              ) : (
                <>
                  <span
                    onClick={() => onSelect(episode.id, episode.title)}
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                  >
                    {episode.title}
                  </span>
                  <button onClick={() => handleEditClick(episode)} style={{marginRight: 8}} title="Modifier"><FaPencilAlt /></button>
                  <button
                    onClick={() => onDelete(episode.id)}
                    style={{ color: 'red', cursor: 'pointer', padding: '2px 5px' }}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EpisodeList;
