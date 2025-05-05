import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de filtres avancés pour les listes paginées.
 * Permet de filtrer les données par différents critères et s'intègre avec le hook usePagination.
 * 
 * @component
 */
const AdvancedFilters = ({ 
  filters, 
  onApplyFilters, 
  initialValues = {}, 
  className = '',
  showResetButton = true 
}) => {
  // État pour stocker les valeurs des filtres
  const [filterValues, setFilterValues] = useState({});
  
  // Initialiser les valeurs des filtres
  useEffect(() => {
    const initialFilterValues = {};
    filters.forEach(filter => {
      initialFilterValues[filter.id] = initialValues[filter.id] !== undefined 
        ? initialValues[filter.id] 
        : filter.defaultValue !== undefined ? filter.defaultValue : '';
    });
    setFilterValues(initialFilterValues);
  }, [filters, initialValues]);
  
  // Gérer le changement d'une valeur de filtre
  const handleFilterChange = (filterId, value) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  };
  
  // Appliquer les filtres
  const handleApplyFilters = () => {
    // Ne conserver que les filtres non vides
    const nonEmptyFilters = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        nonEmptyFilters[key] = value;
      }
    });
    
    onApplyFilters(nonEmptyFilters);
  };
  
  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    const defaultValues = {};
    filters.forEach(filter => {
      defaultValues[filter.id] = filter.defaultValue !== undefined ? filter.defaultValue : '';
    });
    setFilterValues(defaultValues);
    onApplyFilters({});
  };
  
  // Rendu d'un champ de filtre en fonction de son type
  const renderFilterField = (filter) => {
    const { id, label, type, options } = filter;
    
    switch (type) {
      case 'text':
        return (
          <div className="filter-field" key={id}>
            <label htmlFor={`filter-${id}`}>{label}</label>
            <input
              id={`filter-${id}`}
              type="text"
              value={filterValues[id] || ''}
              onChange={e => handleFilterChange(id, e.target.value)}
              placeholder={filter.placeholder || ''}
            />
          </div>
        );
        
      case 'select':
        return (
          <div className="filter-field" key={id}>
            <label htmlFor={`filter-${id}`}>{label}</label>
            <select
              id={`filter-${id}`}
              value={filterValues[id] || ''}
              onChange={e => handleFilterChange(id, e.target.value)}
            >
              <option value="">{filter.placeholder || 'Sélectionner...'}</option>
              {options && options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="filter-field checkbox" key={id}>
            <input
              id={`filter-${id}`}
              type="checkbox"
              checked={!!filterValues[id]}
              onChange={e => handleFilterChange(id, e.target.checked)}
            />
            <label htmlFor={`filter-${id}`}>{label}</label>
          </div>
        );
        
      case 'date':
        return (
          <div className="filter-field" key={id}>
            <label htmlFor={`filter-${id}`}>{label}</label>
            <input
              id={`filter-${id}`}
              type="date"
              value={filterValues[id] || ''}
              onChange={e => handleFilterChange(id, e.target.value)}
            />
          </div>
        );
        
      case 'dateRange':
        return (
          <div className="filter-field date-range" key={id}>
            <label>{label}</label>
            <div className="date-inputs">
              <input
                id={`filter-${id}-start`}
                type="date"
                value={filterValues[`${id}Start`] || ''}
                onChange={e => handleFilterChange(`${id}Start`, e.target.value)}
                placeholder="Date de début"
              />
              <span className="date-separator">à</span>
              <input
                id={`filter-${id}-end`}
                type="date"
                value={filterValues[`${id}End`] || ''}
                onChange={e => handleFilterChange(`${id}End`, e.target.value)}
                placeholder="Date de fin"
              />
            </div>
          </div>
        );
        
      case 'number':
        return (
          <div className="filter-field" key={id}>
            <label htmlFor={`filter-${id}`}>{label}</label>
            <input
              id={`filter-${id}`}
              type="number"
              value={filterValues[id] || ''}
              onChange={e => handleFilterChange(id, e.target.value)}
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              placeholder={filter.placeholder || ''}
            />
          </div>
        );
        
      case 'numberRange':
        return (
          <div className="filter-field number-range" key={id}>
            <label>{label}</label>
            <div className="range-inputs">
              <input
                id={`filter-${id}-min`}
                type="number"
                value={filterValues[`${id}Min`] || ''}
                onChange={e => handleFilterChange(`${id}Min`, e.target.value)}
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                placeholder="Min"
              />
              <span className="range-separator">à</span>
              <input
                id={`filter-${id}-max`}
                type="number"
                value={filterValues[`${id}Max`] || ''}
                onChange={e => handleFilterChange(`${id}Max`, e.target.value)}
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                placeholder="Max"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`advanced-filters ${className}`}>
      <div className="filters-container">
        {filters.map(filter => renderFilterField(filter))}
      </div>
      
      <div className="filters-actions">
        <button 
          className="apply-filters" 
          onClick={handleApplyFilters}
        >
          Appliquer les filtres
        </button>
        
        {showResetButton && (
          <button 
            className="reset-filters" 
            onClick={handleResetFilters}
          >
            Réinitialiser
          </button>
        )}
      </div>
      
      <style jsx>{`
        .advanced-filters {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1rem;
          background-color: #f9f9f9;
        }
        
        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .filter-field {
          display: flex;
          flex-direction: column;
        }
        
        .filter-field.checkbox {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-field label {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .filter-field input,
        .filter-field select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .filter-field.date-range .date-inputs,
        .filter-field.number-range .range-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .date-separator,
        .range-separator {
          font-size: 0.9rem;
          color: #666;
        }
        
        .filters-actions {
          display: flex;
          justify-content: flex-start;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .apply-filters {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .reset-filters {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .apply-filters:hover {
          background-color: #45a049;
        }
        
        .reset-filters:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

AdvancedFilters.propTypes = {
  /** Définition des filtres à afficher */
  filters: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf([
      'text', 'select', 'checkbox', 
      'date', 'dateRange', 'number', 'numberRange'
    ]).isRequired,
    defaultValue: PropTypes.any,
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool
      ]).isRequired,
      label: PropTypes.string.isRequired
    })),
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number
  })).isRequired,
  
  /** Fonction appelée lorsque les filtres sont appliqués */
  onApplyFilters: PropTypes.func.isRequired,
  
  /** Valeurs initiales des filtres */
  initialValues: PropTypes.object,
  
  /** Classe CSS additionnelle */
  className: PropTypes.string,
  
  /** Afficher ou non le bouton de réinitialisation */
  showResetButton: PropTypes.bool
};

export default AdvancedFilters;