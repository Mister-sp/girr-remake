import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Importer les fonctions API pour les sujets
import { getTopicsForEpisode, createTopic, deleteTopic, updateTopic } from '../services/api';
import ConfirmModal from './ConfirmModal.jsx';
import { useToast } from './ToastProvider.jsx';
import { FaPencilAlt, FaCheck, FaTimes, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Modal from './Modal.jsx';

import { buttonStyle } from './buttonStyle';
// Style uniforme pour tous les boutons d'action
// (supprimé car maintenant importé)

// Ce composant prend programId, episodeId, episodeTitle, onSelectTopic et onBack en props
import { useNavigate } from 'react-router-dom';

function TopicList({ programId: propProgramId, episodeId: propEpisodeId, episodeTitle, onSelectTopic, onBack }) {
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const programId = propProgramId || params.programId;
  const episodeId = propEpisodeId || params.episodeId;
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Fonction pour charger les sujets de l'épisode spécifié
  const loadTopics = async () => {
    if (!programId || !episodeId) return; // Sécurité
    try {
      setLoading(true);
      const response = await getTopicsForEpisode(programId, episodeId);
      setTopics(response.data);
      setError(null);
    } catch (err) {
      console.error(`Erreur lors de la récupération des sujets pour l'épisode ${episodeId}:`, err);
      setError('Impossible de charger les sujets.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les sujets lorsque episodeId change
  useEffect(() => {
    loadTopics();
  }, [programId, episodeId]); // Dépendances

  // Gestionnaire pour la création d'un nouveau sujet
  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) {
      alert("Le titre du sujet ne peut pas être vide.");
      return;
    }
    if (!programId || !episodeId) return;

    try {
      // Pour l'instant, on envoie juste le titre.
      const topicData = { title: newTopicTitle }; 
      await createTopic(programId, episodeId, topicData);
      setNewTopicTitle('');
      await loadTopics(); // Recharger la liste
    } catch (err) {
      console.error("Erreur lors de la création du sujet:", err);
      setError('Impossible de créer le sujet.');
    }
  };

  // Gestionnaire pour la suppression d'un sujet
  const handleDeleteTopic = async (topicId) => {
    if (!programId || !episodeId) return;
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer le sujet ID ${topicId} et tous ses médias associés ?`;
    if (window.confirm(confirmationMessage)) {
      try {
        await deleteTopic(programId, episodeId, topicId);
        await loadTopics(); // Recharger la liste
      } catch (err) {
        console.error("Erreur lors de la suppression du sujet:", err);
        setError('Impossible de supprimer le sujet.');
      }
    }
  };

  // Gestionnaire de navigation au clic sur un sujet
  const handleTopicClick = (topicId, topicTitle) => {
    navigate(`/program/${programId}/episode/${episodeId}/topic/${topicId}`);
  };

  // Affichage
  if (!programId || !episodeId) {
    return <div>IDs manquants pour afficher les sujets.</div>; // Message d'erreur
  }

  if (loading) {
    return <div>Chargement des sujets...</div>;
  }

  // Afficher l'erreur mais permettre de continuer
  if (error) {
    return (
      <div>
        <button onClick={onBack} style={{ marginBottom: '15px' }}>
          &larr; Retour à l'épisode "{episodeTitle}"
        </button>
        <h2>Sujets de l'épisode "{episodeTitle}"</h2>
        <div style={{ color: 'red' }}>Erreur : {error}</div>
        <TopicForm onSubmit={handleAddTopic} title={newTopicTitle} setTitle={setNewTopicTitle} />
        {/* Passer onSelectTopic à TopicDisplay */}
        <TopicDisplay topics={topics} onDelete={handleDeleteTopic} onSelect={handleTopicClick} />
      </div>
    );
  }

  return (
    <div>
       <button onClick={onBack} style={buttonStyle} title="Retour">
        <FaArrowLeft />
      </button>
      <h2>Sujets de l'épisode "{episodeTitle}"</h2>
      {/* Bouton flottant + pour ouvrir le modal d'ajout */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          top: 112,
          right: 32,
          zIndex: 1000,
          width: 56,
          height: 56,
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
        title="Ajouter un sujet"
        aria-label="Ajouter un sujet"
      >
        <FaPlus style={{ fontSize: 28, display: 'block', margin: 0, padding: 0 }} />
      </button>
      {/* Modal d'ajout */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <TopicForm onSubmit={handleAddTopic} title={newTopicTitle} setTitle={setNewTopicTitle} />
      </Modal>
      {/* Passer onSelectTopic à TopicDisplay */}
      <TopicDisplay topics={topics} onDelete={handleDeleteTopic} onSelect={handleTopicClick} />
    </div>
  );
}

// ---- Sous-composants pour le formulaire et l'affichage ----

function TopicForm({ onSubmit, title, setTitle }) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }}>
      <h3>Ajouter un nouveau sujet</h3>
      <input
        type="text"
        placeholder="Titre du sujet"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ marginRight: '10px' }}
      />
      <button type="submit" title="Ajouter"><FaPlus /></button>
    </form>
  );
}

function TopicDisplay({ topics, onDelete, onSelect }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditClick = (topic) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };
  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await updateTopic(topics.find(t=>t.id===id).programId, topics.find(t=>t.id===id).episodeId, id, { title: editTitle });
      setEditingId(null);
      setEditTitle('');
      if (typeof window !== 'undefined' && window.location) window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {topics.length === 0 ? (
        <p>Aucun sujet trouvé pour cet épisode.</p>
      ) : (
        <ul>
          {topics.map((topic) => (
            <li key={topic.id} style={{ marginBottom: '5px' }}>
              {editingId === topic.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{marginRight: '8px'}}
                    disabled={saving}
                  />
                  <button onClick={() => handleEditSave(topic.id)} disabled={saving} style={{color: 'green', marginRight: 4}} title="Enregistrer"><FaCheck /></button>
                  <button onClick={handleEditCancel} disabled={saving} style={{color: 'red'}} title="Annuler"><FaTimes /></button>
                </>
              ) : (
                <>
                  <span
                    onClick={() => onSelect(topic.id, topic.title)}
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                  >
                    {topic.title}
                  </span>
                  <button onClick={() => handleEditClick(topic)} style={{marginRight: 8}} title="Modifier"><FaPencilAlt /></button>
                  <button
                    onClick={() => onDelete(topic.id)}
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

export default TopicList;
