import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import Pagination from './Pagination';
import AdvancedFilters from './AdvancedFilters';
import usePagination from '../hooks/usePagination';
import ApiService from '../services/apiService';

/**
 * Composant affichant une liste paginée de sujets pour un épisode
 * avec filtres avancés et pagination.
 * 
 * @component
 */
const TopicListWithPagination = ({ onTopicClick, onAddTopic, onEditTopic, onDeleteTopic }) => {
  const { programId, episodeId } = useParams();
  const [activeFilters, setActiveFilters] = useState({});

  // Définition des filtres disponibles pour les sujets
  const topicFilters = [
    {
      id: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Rechercher un titre...'
    },
    {
      id: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'pending', label: 'En attente' },
        { value: 'active', label: 'Actif' },
        { value: 'done', label: 'Terminé' }
      ]
    },
    {
      id: 'duration',
      label: 'Durée',
      type: 'numberRange',
      min: 0,
      max: 300,
      step: 1
    },
    {
      id: 'hasMedia',
      label: 'Avec média',
      type: 'checkbox',
      defaultValue: false
    },
    {
      id: 'createdAt',
      label: 'Date de création',
      type: 'dateRange'
    }
  ];

  // Fonction pour récupérer les sujets depuis l'API avec pagination et filtres
  const fetchTopics = useCallback(async (paginationParams) => {
    try {
      // Fusionner les paramètres de pagination avec les filtres actifs
      const params = {
        ...paginationParams,
        ...activeFilters,
        // Transformer les dates pour le backend
        ...(activeFilters.createdAtStart && { 
          createdAtStart: new Date(activeFilters.createdAtStart).toISOString() 
        }),
        ...(activeFilters.createdAtEnd && { 
          createdAtEnd: new Date(activeFilters.createdAtEnd).toISOString() 
        })
      };

      return await ApiService.get(
        `/api/programs/${programId}/episodes/${episodeId}/topics`, 
        {
          params,
          // Options de retry pour les appels critiques
          retries: 2,
          retryDelay: 800,
          onRetry: (error, attempt) => {
            console.log(`Tentative ${attempt} de récupération des sujets après erreur:`, error.message);
          }
        }
      );
    } catch (error) {
      console.error("Erreur après tentatives de récupération des sujets:", error);
      throw error;
    }
  }, [programId, episodeId, activeFilters]);

  // Utiliser notre hook personnalisé pour gérer la pagination
  const {
    data: topics,
    page,
    pageSize,
    totalItems,
    totalPages,
    isLoading,
    error,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePagination(fetchTopics, {
    defaultPageSize: 15,
    defaultPage: 1
  });

  // Gestionnaire pour appliquer les filtres
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    // Revenir à la première page lors de l'application des filtres
    handlePageChange(1);
  };

  // Gestionnaire pour supprimer un sujet et rafraîchir la liste
  const handleDeleteTopic = async (topicId) => {
    try {
      // Utiliser le service API avec retry pour les opérations critiques
      await ApiService.delete(
        `/api/programs/${programId}/episodes/${episodeId}/topics/${topicId}`,
        {
          retries: 2,
          onRetry: (error, attempt) => {
            console.log(`Tentative ${attempt} de suppression du sujet ${topicId} après erreur:`, error.message);
          }
        }
      );
      
      if (onDeleteTopic) {
        await onDeleteTopic(topicId);
      }
      
      // Rafraîchir la liste après suppression
      refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression du sujet:", error);
    }
  };

  return (
    <div className="topics-list-container">
      <div className="topics-header">
        <h2>Sujets de l'épisode</h2>
        <button onClick={onAddTopic} className="add-button">
          + Ajouter un sujet
        </button>
      </div>
      
      {/* Filtres avancés */}
      <AdvancedFilters 
        filters={topicFilters} 
        onApplyFilters={handleApplyFilters} 
        initialValues={activeFilters}
      />
      
      {isLoading && topics.length === 0 ? (
        <div className="loading">Chargement des sujets...</div>
      ) : error ? (
        <div className="error-container">
          <h3>Erreur lors du chargement des sujets</h3>
          <p>{error.message || "Une erreur est survenue"}</p>
          <button onClick={refresh}>Réessayer</button>
        </div>
      ) : topics.length === 0 ? (
        <div className="no-topics">
          <p>
            {Object.keys(activeFilters).length > 0 
              ? "Aucun sujet ne correspond aux filtres sélectionnés." 
              : "Aucun sujet pour cet épisode."}
          </p>
        </div>
      ) : (
        <>
          {/* Indicateur de filtres actifs */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="active-filters-indicator">
              <span>Filtres actifs : {Object.keys(activeFilters).length}</span>
            </div>
          )}
          
          <ul className="topics-list">
            {topics.map((topic) => (
              <li 
                key={topic.id} 
                className={`topic-item status-${topic.status}`}
                onClick={() => onTopicClick(topic.id)}
              >
                <div className="topic-content">
                  <span className="topic-title">{topic.title}</span>
                  <span className="topic-duration">{topic.duration || 0} min</span>
                </div>
                <div className="topic-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTopic(topic.id);
                    }} 
                    className="edit-button"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(topic.id);
                    }} 
                    className="delete-button"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Composant de pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[5, 10, 15, 20, 50]}
          />
        </>
      )}
      
      <style jsx>{`
        .topics-list-container {
          margin: 1rem 0;
        }
        
        .topics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .add-button {
          background: #4caf50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .active-filters-indicator {
          background-color: #e3f2fd;
          padding: 0.5rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #1976d2;
        }
        
        .topics-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .topic-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem;
          margin-bottom: 0.5rem;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .topic-item:hover {
          background: #f8f8f8;
        }
        
        .topic-content {
          display: flex;
          flex-direction: column;
        }
        
        .topic-title {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .topic-duration {
          font-size: 0.9rem;
          color: #666;
        }
        
        .topic-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .edit-button, .delete-button {
          padding: 0.3rem 0.5rem;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .edit-button:hover {
          background: #e0e0e0;
        }
        
        .delete-button:hover {
          background: #ffcccc;
        }
        
        .loading, .error-container, .no-topics {
          padding: 1rem;
          text-align: center;
          margin: 1rem 0;
          background: #f9f9f9;
          border-radius: 4px;
        }
        
        .error-container {
          color: #d32f2f;
          background: #ffebee;
        }
        
        /* Styles pour les différents statuts */
        .status-pending {
          border-left: 4px solid #ff9800;
        }
        
        .status-active {
          border-left: 4px solid #4caf50;
        }
        
        .status-done {
          border-left: 4px solid #9e9e9e;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

TopicListWithPagination.propTypes = {
  /** Fonction appelée quand un sujet est cliqué */
  onTopicClick: PropTypes.func.isRequired,
  /** Fonction appelée pour ajouter un nouveau sujet */
  onAddTopic: PropTypes.func.isRequired,
  /** Fonction appelée pour éditer un sujet */
  onEditTopic: PropTypes.func.isRequired,
  /** Fonction appelée pour supprimer un sujet */
  onDeleteTopic: PropTypes.func.isRequired
};

export default TopicListWithPagination;