import React from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de pagination réutilisable.
 * Fonctionne avec la structure de pagination standardisée du backend.
 * 
 * @component
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  showPageSizeSelector = true,
  showItemsInfo = true,
  maxPageButtons = 5
}) => {
  // Calculer la plage de boutons de page à afficher
  const getPageRange = () => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Toujours inclure la première et dernière page
    const range = [];
    const leftOffset = Math.floor(maxPageButtons / 2);
    const rightOffset = Math.ceil(maxPageButtons / 2) - 1;
    
    let start = Math.max(1, currentPage - leftOffset);
    let end = Math.min(totalPages, currentPage + rightOffset);
    
    // Ajuster si on est proche du début ou de la fin
    if (currentPage <= leftOffset) {
      end = maxPageButtons;
    } else if (currentPage + rightOffset >= totalPages) {
      start = totalPages - maxPageButtons + 1;
    }
    
    // Générer la plage
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    // Ajouter des ellipses si nécessaire
    if (start > 1) {
      range.unshift('...');
      range.unshift(1);
    }
    if (end < totalPages) {
      range.push('...');
      range.push(totalPages);
    }
    
    return range;
  };
  
  // Gérer le changement de taille de page
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };
  
  // Calculer les informations sur les éléments affichés
  const startItem = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(totalItems, currentPage * pageSize);
  
  return (
    <div className={`pagination-container ${className}`}>
      {showItemsInfo && totalItems > 0 && (
        <div className="pagination-info">
          Affichage {startItem}-{endItem} sur {totalItems} éléments
        </div>
      )}
      
      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          className="pagination-button pagination-first"
          title="Première page"
        >
          &laquo;
        </button>
        
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="pagination-button pagination-prev"
          title="Page précédente"
        >
          &lsaquo;
        </button>
        
        {getPageRange().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`pagination-button ${currentPage === page ? 'pagination-active' : ''}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages || totalPages === 0}
          className="pagination-button pagination-next"
          title="Page suivante"
        >
          &rsaquo;
        </button>
        
        <button 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages || totalPages === 0}
          className="pagination-button pagination-last"
          title="Dernière page"
        >
          &raquo;
        </button>
      </div>
      
      {showPageSizeSelector && (
        <div className="pagination-size-selector">
          <label htmlFor="page-size-select">Éléments par page:</label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="pagination-select"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}
      
      <style jsx>{`
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 1rem 0;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .pagination-info {
          font-size: 0.9rem;
          color: #666;
        }
        
        .pagination-controls {
          display: flex;
          align-items: center;
        }
        
        .pagination-button {
          padding: 0.3rem 0.6rem;
          margin: 0 0.1rem;
          background: #f0f0f0;
          border: 1px solid #ddd;
          cursor: pointer;
          border-radius: 3px;
          font-size: 0.9rem;
        }
        
        .pagination-button:hover:not([disabled]) {
          background: #e0e0e0;
        }
        
        .pagination-button:disabled {
          color: #aaa;
          cursor: not-allowed;
        }
        
        .pagination-active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .pagination-ellipsis {
          padding: 0 0.5rem;
        }
        
        .pagination-size-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        
        .pagination-select {
          padding: 0.3rem;
          border: 1px solid #ddd;
          border-radius: 3px;
          background: #fff;
        }
      `}</style>
    </div>
  );
};

Pagination.propTypes = {
  /** Page actuelle (commence à 1) */
  currentPage: PropTypes.number.isRequired,
  /** Nombre total de pages */
  totalPages: PropTypes.number.isRequired,
  /** Callback appelé lors d'un changement de page */
  onPageChange: PropTypes.func.isRequired,
  /** Nombre d'éléments par page */
  pageSize: PropTypes.number.isRequired,
  /** Nombre total d'éléments */
  totalItems: PropTypes.number.isRequired,
  /** Callback appelé lors d'un changement de taille de page */
  onPageSizeChange: PropTypes.func,
  /** Options pour le sélecteur de taille de page */
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  /** Classe CSS additionnelle */
  className: PropTypes.string,
  /** Afficher ou non le sélecteur de taille de page */
  showPageSizeSelector: PropTypes.bool,
  /** Afficher ou non les informations sur les éléments affichés */
  showItemsInfo: PropTypes.bool,
  /** Nombre maximum de boutons de page à afficher */
  maxPageButtons: PropTypes.number
};

export default Pagination;