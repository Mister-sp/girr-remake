import React, { useState, useEffect } from 'react';
// Importer les fonctions API et DND
import { getMediaForTopic, createMedia, deleteMedia, updateMedia, updateMediaOrder } from '../services/api';
import ConfirmModal from './ConfirmModal.jsx';
import { useToast } from './ToastProvider.jsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaTrash, FaPlus, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';

import { buttonStyle } from './buttonStyle';
// Style uniforme pour tous les boutons d'action média
// (supprimé car maintenant importé)

// Helper function pour extraire l'ID YouTube d'une URL
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Prend programId, episodeId, topicId, topicTitle, onBack
function MediaList({ programId, episodeId, topicId, topicTitle, onBack }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMediaType, setNewMediaType] = useState('text'); 
  const [newMediaContent, setNewMediaContent] = useState('');
  // États pour l'édition inline
  const [editingMediaId, setEditingMediaId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Charger les médias pour le sujet spécifié
  const loadMedia = async () => {
    if (!programId || !episodeId || !topicId) return;
    try {
      setLoading(true);
      const response = await getMediaForTopic(programId, episodeId, topicId);
      setMediaItems(response.data);
      setError(null);
    } catch (err) {
      console.error(`Erreur lors de la récupération des médias pour le sujet ${topicId}:`, err);
      setError('Impossible de charger les médias.');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et quand les IDs changent
  useEffect(() => {
    loadMedia();
  }, [programId, episodeId, topicId]);

  // Ajouter un nouveau média
  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMediaContent.trim()) {
      alert('Le contenu du média est requis.');
      return;
    }
    if (!programId || !episodeId || !topicId) return;

    try {
      const mediaData = { 
        type: newMediaType, 
        content: newMediaContent 
      };
      await createMedia(programId, episodeId, topicId, mediaData);
      setNewMediaType('text');
      setNewMediaContent('');
      await loadMedia();
    } catch (err) {
      console.error("Erreur lors de la création du média:", err);
      setError('Impossible de créer le média.');
    }
  };

  // Supprimer un média
  const handleDeleteMedia = async (mediaId) => {
    if (!programId || !episodeId || !topicId) return;
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer le média ID ${mediaId} ?`;
    if (window.confirm(confirmationMessage)) {
      try {
        await deleteMedia(programId, episodeId, topicId, mediaId);
        await loadMedia();
      } catch (err) {
        console.error("Erreur lors de la suppression du média:", err);
        setError('Impossible de supprimer le média.');
      }
    }
  };

  // --- Fonctions d'édition inline ---
  const handleEditStart = (media) => {
    setEditingMediaId(media.id);
    setEditingContent(media.content);
  };

  const handleEditCancel = () => {
    setEditingMediaId(null);
    setEditingContent('');
  };

  const handleEditSave = async () => {
    if (editingMediaId === null) return;
    
    const originalMedia = mediaItems.find(m => m.id === editingMediaId);
    if (!originalMedia) return;

    // Ne rien faire si le contenu n'a pas changé
    if (originalMedia.content === editingContent) {
      handleEditCancel();
      return;
    }

    try {
      // Mettre à jour seulement le contenu
      await updateMedia(programId, episodeId, topicId, editingMediaId, { content: editingContent });
      setEditingMediaId(null);
      setEditingContent('');
      await loadMedia(); // Recharger pour voir la modif
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du média:", err);
      setError('Impossible de sauvegarder les modifications du média.');
      // Optionnel: garder l'éditeur ouvert en cas d'erreur ?
      // handleEditCancel(); 
    }
  };
  // --- Fin Fonctions d’édition inline ---

  // --- Fonction pour gérer la fin du Drag & Drop ---
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Si l'élément est lâché en dehors d'une zone de dépôt
    if (!destination) {
      return;
    }

    // Si l'élément est remis à sa place initiale
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // On ne réordonne que les 'otherMediaItems'
    const otherMediaItems = mediaItems.filter(item => item.type !== 'text');
    // Trouver l'item déplacé en utilisant l'ID formaté comme dans Draggable
    const draggedItem = otherMediaItems.find(item => `media-${item.id}` === draggableId);
    
    if (!draggedItem) return; // Sécurité, ne devrait pas arriver

    const newOtherMediaItems = Array.from(otherMediaItems);
    newOtherMediaItems.splice(source.index, 1); // Enlève l'élément de l'ancienne position
    newOtherMediaItems.splice(destination.index, 0, draggedItem); // Insère l'élément à la nouvelle position

    // Recombiner avec les textItems (qui ne bougent pas) et mettre à jour l'état
    const textItems = mediaItems.filter(item => item.type === 'text');
    const updatedMediaItems = [...textItems, ...newOtherMediaItems];
    setMediaItems(updatedMediaItems);
    
    // Extraire les IDs des médias non-textuels dans le nouvel ordre
    const orderedOtherMediaIds = newOtherMediaItems.map(item => item.id);

    // Appeler l'API pour sauvegarder le nouvel ordre
    try {
      // Log des paramètres avant l'appel
      console.log(`Sauvegarde de l'ordre pour P=${programId}, E=${episodeId}, T=${topicId}`);
      console.log('IDs ordonnés envoyés:', orderedOtherMediaIds);
      
      await updateMediaOrder(programId, episodeId, topicId, orderedOtherMediaIds);
      // Optionnel: Afficher un message de succès ou recharger les données si nécessaire
      console.log('Ordre sauvegardé sur le serveur.');
      // Pas besoin de recharger ici car le GET trie déjà correctement,
      // et l'état local est déjà à jour.
    } catch (err) {
      console.error("Erreur détaillée lors de la sauvegarde de l'ordre:", err);
      if (err.response) {
        // Erreur Axios avec une réponse du serveur (même si c'est une erreur 4xx ou 5xx)
        console.error('Status de la réponse:', err.response.status);
        console.error('Données de la réponse:', err.response.data);
        console.error('Headers de la réponse:', err.response.headers);
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Aucune réponse reçue, requête:', err.request);
      } else {
        // Erreur lors de la configuration de la requête
        console.error('Erreur de configuration de la requête:', err.message);
      }
      // Toujours logger la configuration de la requête Axios si disponible
      if (err.config) {
          console.error('Configuration Axios de la requête:', err.config);
      }
      
      setError("Impossible de sauvegarder le nouvel ordre des médias.");
      // Optionnel: Revenir à l'ordre précédent en cas d'erreur ?
      // Pour l'instant, on laisse l'ordre visuel modifié.
    }
  };
  // --- Fin Fonction Drag & Drop ---

  // Affichage
  if (!programId || !episodeId || !topicId) {
    return <div>IDs manquants pour afficher les médias.</div>;
  }

  if (loading) {
    return <div>Chargement des médias...</div>;
  }

  const renderMediaContent = (media) => {
    switch (media.type) {
      case 'image':
        return <img src={media.content} alt={`Média ${media.id}`} style={{ maxWidth: '200px', maxHeight: '150px', display: 'block', marginTop: '5px' }} />;
      case 'video':
        const videoId = getYouTubeId(media.content);
        if (videoId) {
          return (
            <iframe 
              width="280" // Taille réduite pour l'aperçu
              height="157"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{marginTop: '10px'}}
            ></iframe>
          );
        } else {
          // Si ce n'est pas YouTube, afficher un lien
          return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">Voir la vidéo (Lien externe)</a></div>;
        }
      case 'audio':
        return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">Écouter l'audio</a></div>;
      case 'link':
        return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">{media.content}</a></div>;
      case 'text':
      default:
        // Afficher le texte complet pour les scripts
        return <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{media.content}</p>;
    }
  };

  return (
    <div>
      <button onClick={onBack} style={buttonStyle} title="Retour">
        <FaArrowLeft />
      </button>
      <h2>Médias du sujet "{topicTitle}"</h2>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>Erreur : {error}</div>}

      {/* Formulaire d'ajout de média */}
      <MediaForm 
        onSubmit={handleAddMedia} 
        type={newMediaType} setType={setNewMediaType}
        content={newMediaContent} setContent={setNewMediaContent}
      />

      {/* Affichage des médias - passer onDragEnd */}
      <MediaDisplay 
        mediaItems={mediaItems} 
        onDelete={handleDeleteMedia} 
        editingMediaId={editingMediaId}
        editingContent={editingContent}
        onEditingContentChange={setEditingContent}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onEditSave={handleEditSave}
        onDragEnd={onDragEnd} // Passer la fonction de DND
      />
    </div>
  );
}

function MediaDisplay({ 
  mediaItems, 
  onDelete, 
  editingMediaId, 
  editingContent, 
  onEditingContentChange,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDragEnd // Récupérer la fonction
}) {
  // Séparer les items texte des autres
  const textItems = mediaItems.filter(item => item.type === 'text');
  const otherMediaItems = mediaItems.filter(item => item.type !== 'text');

  const renderMediaContent = (media) => {
    switch (media.type) {
      case 'image':
        return <img src={media.content} alt={`Média ${media.id}`} style={{ maxWidth: '200px', maxHeight: '150px', display: 'block', marginTop: '5px' }} />;
      case 'video':
        const videoId = getYouTubeId(media.content);
        if (videoId) {
          return (
            <iframe 
              width="280" // Taille réduite pour l'aperçu
              height="157"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{marginTop: '10px'}}
            ></iframe>
          );
        } else {
          // Si ce n'est pas YouTube, afficher un lien
          return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">Voir la vidéo (Lien externe)</a></div>;
        }
      case 'audio':
        return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">Écouter l'audio</a></div>;
      case 'link':
        return <div style={{marginTop: '5px'}}><a href={media.content} target="_blank" rel="noopener noreferrer">{media.content}</a></div>;
      case 'text':
      default:
        // Afficher le texte complet pour les scripts
        return <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{media.content}</p>;
    }
  };

  // Fonction pour rendre spécifiquement un item texte (script)
  const renderTextItem = (media) => {
    if (editingMediaId === media.id) {
      // Mode édition
      return (
        <div>
          <textarea 
            value={editingContent} 
            onChange={(e) => onEditingContentChange(e.target.value)} 
            style={{ width: '95%', minHeight: '100px', marginBottom: '5px', border: '1px solid #007bff' }}
          />
          <button onClick={onEditSave} title="Enregistrer" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', borderRadius: '6px', padding: '0 6px', color: 'green' }}><FaCheck /></button>
          <button onClick={onEditCancel} title="Annuler" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', borderRadius: '6px', padding: '0 6px', color: 'red' }}><FaTimes /></button>
        </div>
      );
    } else {
      // Mode affichage (cliquable pour éditer)
      return (
        <div onClick={() => onEditStart(media)} style={{ cursor: 'pointer', whiteSpace: 'pre-wrap' }}>
          {media.content}
        </div>
      );
    }
  }

  return (
    <div>
      {/* Section pour le Script (Textes) */}
      <h3>Script</h3>
      {textItems.length === 0 ? (
        <p>Aucun élément de script (texte) trouvé.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {textItems.map((media) => (
            <li key={media.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', marginBottom: '10px' }}>
              {/* Utiliser renderTextItem pour le contenu texte */}
              {renderTextItem(media)}
              {/* Afficher le bouton supprimer seulement si on n'est pas en mode édition pour cet item */}
              {editingMediaId !== media.id && (
                <button
                  onClick={() => onDelete(media.id)}
                  style={{ ...buttonStyle, marginTop: '10px', color: 'red' }}
                  title="Supprimer"
                >
                  <FaTrash />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Section pour les autres Médias - Intégration DND */}
      <h3 style={{marginTop: '30px'}}>Autres Médias</h3>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="otherMediaItems">
          {(providedDroppable) => (
            <ul 
              {...providedDroppable.droppableProps} 
              ref={providedDroppable.innerRef} 
              style={{ listStyle: 'none', padding: 0 }}
            >
              {otherMediaItems.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>Glissez-déposez des médias ici...</p>
              ) : (
                otherMediaItems.map((media, index) => (
                  <Draggable key={media.id} draggableId={`media-${media.id}`} index={index}>
                    {(providedDraggable) => (
                      <li 
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps} // Poignée de drag
                        style={{
                          border: '1px solid #eee', 
                          padding: '10px', 
                          marginBottom: '10px',
                          backgroundColor: 'white', // Important pour le DND visuel
                          userSelect: 'none', // Empêche la sélection de texte pendant le drag
                          ...providedDraggable.draggableProps.style // Styles appliqués par DND
                        }}
                      >
                        <strong>Type: {media.type}</strong>
                        {renderMediaContent(media)}
                        <button
                          onClick={() => onDelete(media.id)}
                          style={{ ...buttonStyle, marginTop: '5px', color: 'red' }}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))
              )}
              {providedDroppable.placeholder} {/* Espace réservé pendant le drag */}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function MediaForm({ onSubmit, type, setType, content, setContent }) {
  return (
    <form onSubmit={onSubmit} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
      <h3>Ajouter un nouveau média</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>Type: </label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="text">Texte</option>
          <option value="image">Image (URL)</option>
          <option value="video">Vidéo (URL)</option>
          <option value="audio">Audio (URL)</option>
          <option value="link">Lien Web</option>
        </select>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>{type === 'text' ? 'Contenu:' : 'URL:'} </label>
        {type === 'text' ? (
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: '90%', minHeight: '60px' }}/>
        ) : (
          <input type="url" value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: '90%' }}/>
        )}
      </div>
      <button type="submit" title="Ajouter Média" style={buttonStyle}><FaPlus /></button>
    </form>
  );
}

export default MediaList;
