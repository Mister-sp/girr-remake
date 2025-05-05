import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de panneau de filtres avancés pour les listes de données.
 * Permet de construire dynamiquement des filtres basés sur la configuration fournie.
 * 
 * @component
 */
const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  filterConfig,
  isExpanded = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // Synchroniser les filtres externes si non modifiés localement
    if (!touched && filters && JSON.stringify(filters) !== JSON.stringify(localFilters)) {
      setLocalFilters(filters);
    }
  }, [filters, localFilters, touched]);

  const handleFilterChange = (key, value) => {
    setTouched(true);
    
    const updatedFilters = {
      ...localFilters,
      [key]: value
    };
    
    // Si la valeur est vide ou null, supprimer le filtre
    if (value === '' || value === null || value === undefined) {
      delete updatedFilters[key];
    }
    
    setLocalFilters(updatedFilters);
  };

  const handleApplyFilters = () => {
    setTouched(false);
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    setTouched(true);
    setLocalFilters({});
  };

  // Rendu d'un contrôle de filtre spécifique en fonction de son type
  const renderFilterControl = (config) => {
    const { id, label, type, options, placeholder } = config;
    const value = localFilters[id] || '';
    
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            id={id}
            value={value}
            placeholder={placeholder || `Filtrer par ${label}`}
            onChange={(e) => handleFilterChange(id, e.target.value)}
            className="filter-text-input"
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={id}
            value={value}
            placeholder={placeholder || `Filtrer par ${label}`}
            onChange={(e) => handleFilterChange(id, e.target.value ? Number(e.target.value) : '')}
            className="filter-number-input"
          />
        );
        
      case 'select':
        return (
          <select
            id={id}
            value={value}
            onChange={(e) => handleFilterChange(id, e.target.value)}
            className="filter-select"
          >
            <option value="">Tous</option>
            {options && options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'date':
        return (
          <input
            type="date"
            id={id}
            value={value}
            onChange={(e) => handleFilterChange(id, e.target.value)}
            className="filter-date-input"
          />
        );
        
      case 'dateRange':
        const startValue = Array.isArray(value) ? value[0] || '' : '';
        const endValue = Array.isArray(value) ? value[1] || '' : '';
        
        return (
          <div className="filter-date-range">
            <input
              type="date"
              id={`${id}-start`}
              value={startValue}
              onChange={(e) => {
                const newRange = [e.target.value, endValue];
                handleFilterChange(id, newRange);
              }}
              className="filter-date-input"
            />
            <span className="filter-date-separator">à</span>
            <input
              type="date"
              id={`${id}-end`}
              value={endValue}
              onChange={(e) => {
                const newRange = [startValue, e.target.value];
                handleFilterChange(id, newRange);
              }}
              className="filter-date-input"
            />
          </div>
        );
        
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={id}
            checked={!!value}
            onChange={(e) => handleFilterChange(id, e.target.checked)}
            className="filter-checkbox"
          />
        );
        
      case 'radio':
        return (
          <div className="filter-radio-group">
            {options && options.map((option) => (
              <label key={option.value} className="filter-radio-label">
                <input
                  type="radio"
                  name={id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleFilterChange(id, option.value)}
                  className="filter-radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        );
        
      case 'toggle':
        return (
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFilterChange(id, e.target.checked)}
            />
            <span className="filter-toggle-slider"></span>
          </label>
        );
        
      default:
        return null;
    }
  };

  if (!filterConfig || filterConfig.length === 0) {
    return null;
  }

  return (
    <div className={`filter-panel ${expanded ? 'expanded' : 'collapsed'} ${className}`}>
      <div className="filter-panel-header" onClick={() => setExpanded(!expanded)}>
        <h3>Filtres avancés</h3>
        <button className="filter-toggle-button">
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      
      {expanded && (
        <div className="filter-panel-content">
          <div className="filter-grid">
            {filterConfig.map((config) => (
              <div key={config.id} className="filter-item">
                <label htmlFor={config.id} className="filter-label">
                  {config.label}
                </label>
                {renderFilterControl(config)}
              </div>
            ))}
          </div>
          
          <div className="filter-actions">
            <button 
              onClick={handleResetFilters} 
              className="filter-reset-button"
            >
              Réinitialiser
            </button>
            <button 
              onClick={handleApplyFilters} 
              className="filter-apply-button"
              disabled={!touched}
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .filter-panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .filter-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1rem;
          cursor: pointer;
          background: #f8f8f8;
          border-bottom: 1px solid #ddd;
        }
        
        .filter-panel-header h3 {
          margin: 0;
          font-size: 1rem;
        }
        
        .filter-toggle-button {
          background: none;
          border: none;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .filter-panel-content {
          padding: 1rem;
        }
        
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .filter-item {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.5rem;
        }
        
        .filter-label {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        
        .filter-text-input,
        .filter-number-input,
        .filter-select,
        .filter-date-input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 0.9rem;
        }
        
        .filter-checkbox,
        .filter-radio {
          margin-right: 0.5rem;
        }
        
        .filter-radio-group {
          display: flex;
          flex-direction: column;
        }
        
        .filter-radio-label {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        
        .filter-date-range {
          display: flex;
          align-items: center;
        }
        
        .filter-date-separator {
          margin: 0 0.5rem;
        }
        
        .filter-toggle {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        
        .filter-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .filter-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        
        .filter-toggle-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        .filter-toggle input:checked + .filter-toggle-slider {
          background-color: #2196F3;
        }
        
        .filter-toggle input:checked + .filter-toggle-slider:before {
          transform: translateX(20px);
        }
        
        .filter-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        
        .filter-reset-button,
        .filter-apply-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .filter-reset-button {
          background: #f0f0f0;
          margin-right: 0.5rem;
        }
        
        .filter-apply-button {
          background: #2196F3;
          color: white;
        }
        
        .filter-apply-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

FilterPanel.propTypes = {
  /** État actuel des filtres (objet clé-valeur) */
  filters: PropTypes.object,
  /** Callback appelé quand les filtres sont appliqués */
  onFilterChange: PropTypes.func.isRequired,
  /** Configuration des filtres disponibles */
  filterConfig: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['text', 'number', 'select', 'date', 'dateRange', 'checkbox', 'radio', 'toggle']).isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
      label: PropTypes.string.isRequired
    })),
    placeholder: PropTypes.string
  })).isRequired,
  /** Le panneau est-il déplié par défaut */
  isExpanded: PropTypes.bool,
  /** Classe CSS additionnelle */
  className: PropTypes.string
};

export default FilterPanel;