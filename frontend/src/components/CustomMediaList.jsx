/**
 * Composant de gestion de la liste des médias.
 * @module components/CustomMediaList
 */

import React, { useState, useEffect } from 'react';
import { updateMediaOrder, deleteMedia } from '../services/api';
import ConfirmModal from './ConfirmModal';
import { usePerformance } from './PerformanceProvider';

/**
 * Liste de médias réordonnables avec prévisualisation.
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.mediaItems - Liste des médias
 * @param {Function} props.onMediaClick - Callback lors du clic sur un média
 * @param {Function} props.onMediaUpdate - Callback après mise à jour
 * @param {number} props.programId - ID du programme parent
 * @param {number} props.episodeId - ID de l'épisode parent
 * @param {number} props.topicId - ID du sujet parent
 * @param {boolean} [props.allowReorder=true] - Autoriser le réordonnement
 * @param {boolean} [props.allowDelete=true] - Autoriser la suppression
 */
export default function CustomMediaList({
  mediaItems,
  onMediaClick,
  onMediaUpdate,
  programId,
  episodeId,
  topicId,
  allowReorder = true,
  allowDelete = true
}) {
  const { debounce } = usePerformance();
  const [items, setItems] = useState(mediaItems);
  const [draggedItem, setDraggedItem] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Mettre à jour la liste quand les props changent
  useEffect(() => {
    setItems(mediaItems);
  }, [mediaItems]);

  /**
   * Gère le début du drag and drop.
   * @param {Event} e - Event dragstart
   * @param {Object} item - Item en cours de drag
   */
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  /**
   * Met à jour l'ordre des médias.
   * @param {Array} orderedItems - Liste réordonnée
   */
  const updateOrder = debounce(async (orderedItems) => {
    try {
      await updateMediaOrder(
        programId,
        episodeId,
        topicId,
        orderedItems.map(item => item.id)
      );
      onMediaUpdate();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', err);
    }
  }, 500);

  /**
   * Gère le drop d'un média.
   * @param {Event} e - Event drop
   * @param {Object} overItem - Item sur lequel on drop
   */
  const handleDrop = (e, overItem) => {
    e.preventDefault();
    if (!draggedItem || !allowReorder) return;

    const draggedIdx = items.findIndex(i => i.id === draggedItem.id);
    const overIdx = items.findIndex(i => i.id === overItem.id);
    if (draggedIdx === overIdx) return;

    const newItems = [...items];
    newItems.splice(draggedIdx, 1);
    newItems.splice(overIdx, 0, draggedItem);
    
    setItems(newItems);
    updateOrder(newItems);
    setDraggedItem(null);
  };

  /**
   * Supprime un média.
   * @param {Object} item - Média à supprimer
   */
  const handleDelete = async (item) => {
    try {
      await deleteMedia(programId, episodeId, topicId, item.id);
      onMediaUpdate();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  return (
    <>
      <div className="media-list">
        {items.map((item) => (
          <div
            key={item.id}
            className="media-item"
            draggable={allowReorder}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, item)}
            onClick={() => onMediaClick(item)}
          >
            {/* Prévisualisation du média */}
            <div className="media-preview">
              {item.type === 'image' ? (
                <img src={item.url} alt="" />
              ) : item.type === 'youtube' ? (
                <div className="youtube-preview">
                  <i className="fab fa-youtube" />
                </div>
              ) : (
                <div className="generic-preview">
                  <i className="fas fa-link" />
                </div>
              )}
            </div>

            {/* Conteneur du texte */}
            <div className="media-info">
              <div className="media-title">
                {item.title || 'Sans titre'}
              </div>
              <div className="media-type">
                {item.type}
              </div>
            </div>

            {/* Actions */}
            {allowDelete && (
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(item);
                  setDeleteModalOpen(true);
                }}
                aria-label="Supprimer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => handleDelete(itemToDelete)}
        title="Supprimer le média"
        message="Êtes-vous sûr de vouloir supprimer ce média ?"
        isDangerous
      />
    </>
  );
}
