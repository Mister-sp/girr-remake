/**
 * Module de filtrage avancé pour les données.
 * Permet d'appliquer des filtres complexes aux requêtes API.
 * @module config/filtering
 */

/**
 * Configuration des champs filtrables par type de ressource
 */
const FILTERABLE_FIELDS = {
  programs: {
    title: { type: 'text', operators: ['eq', 'contains', 'startsWith', 'endsWith'] },
    description: { type: 'text', operators: ['contains'] },
    createdAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    updatedAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    isActive: { type: 'boolean', operators: ['eq'] }
  },
  episodes: {
    title: { type: 'text', operators: ['eq', 'contains', 'startsWith', 'endsWith'] },
    description: { type: 'text', operators: ['contains'] },
    recordingDate: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    publishDate: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    createdAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    updatedAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    duration: { type: 'number', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    status: { type: 'enum', values: ['draft', 'scheduled', 'published', 'archived'], operators: ['eq', 'in'] }
  },
  topics: {
    title: { type: 'text', operators: ['eq', 'contains', 'startsWith', 'endsWith'] },
    description: { type: 'text', operators: ['contains'] },
    createdAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    updatedAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    duration: { type: 'number', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    order: { type: 'number', operators: ['eq', 'gt', 'lt', 'gte', 'lte'] },
    status: { type: 'enum', values: ['pending', 'active', 'done'], operators: ['eq', 'in'] }
  },
  mediaItems: {
    title: { type: 'text', operators: ['eq', 'contains', 'startsWith', 'endsWith'] },
    type: { type: 'enum', values: ['image', 'video', 'document', 'other'], operators: ['eq', 'in'] },
    createdAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    updatedAt: { type: 'date', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] },
    order: { type: 'number', operators: ['eq', 'gt', 'lt', 'gte', 'lte'] },
    size: { type: 'number', operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'] }
  }
};

/**
 * Validateurs pour les différents types de champs
 */
const fieldValidators = {
  text: (value) => typeof value === 'string',
  number: (value) => !isNaN(Number(value)),
  boolean: (value) => typeof value === 'boolean' || value === 'true' || value === 'false',
  date: (value) => !isNaN(Date.parse(value)),
  enum: (value, allowedValues) => allowedValues.includes(value)
};

/**
 * Opérateurs de filtre disponibles
 */
const filterOperators = {
  // Opérateurs textuels
  eq: (field, value) => (item) => String(item[field]) === String(value),
  neq: (field, value) => (item) => String(item[field]) !== String(value),
  contains: (field, value) => (item) => item[field] && String(item[field]).toLowerCase().includes(String(value).toLowerCase()),
  startsWith: (field, value) => (item) => item[field] && String(item[field]).toLowerCase().startsWith(String(value).toLowerCase()),
  endsWith: (field, value) => (item) => item[field] && String(item[field]).toLowerCase().endsWith(String(value).toLowerCase()),
  
  // Opérateurs numériques et dates
  gt: (field, value) => (item) => item[field] > value,
  lt: (field, value) => (item) => item[field] < value,
  gte: (field, value) => (item) => item[field] >= value,
  lte: (field, value) => (item) => item[field] <= value,
  between: (field, [min, max]) => (item) => item[field] >= min && item[field] <= max,
  
  // Opérateurs de collection
  in: (field, values) => (item) => values.includes(item[field]),
  nin: (field, values) => (item) => !values.includes(item[field])
};

/**
 * Parser les filtres à partir des paramètres de requête
 * @param {Object} queryParams - Paramètres de requête
 * @param {string} resourceType - Type de ressource (programs, episodes, topics, mediaItems)
 * @returns {Array} Tableau de filtres validés
 */
function parseFilters(queryParams, resourceType) {
  const filters = [];
  const allowedFields = FILTERABLE_FIELDS[resourceType] || {};

  // Parcourir tous les paramètres de requête
  Object.keys(queryParams).forEach(param => {
    // Vérifier si c'est un paramètre de filtre (format: filter[field][op]=value)
    const filterMatch = param.match(/^filter\[([^\]]+)\](?:\[([^\]]+)\])?$/);
    
    if (filterMatch) {
      const [, field, operator = 'eq'] = filterMatch;
      const value = queryParams[param];
      
      // Vérifier si le champ est filtrable pour ce type de ressource
      if (allowedFields[field]) {
        const fieldConfig = allowedFields[field];
        
        // Vérifier si l'opérateur est valide pour ce champ
        if (fieldConfig.operators.includes(operator)) {
          // Traitement spécial pour les opérateurs de plage
          if (operator === 'between') {
            const [min, max] = Array.isArray(value) ? value : String(value).split(',');
            
            if (fieldConfig.type === 'date') {
              if (fieldValidators.date(min) && fieldValidators.date(max)) {
                filters.push({
                  field,
                  operator,
                  value: [new Date(min), new Date(max)]
                });
              }
            } else if (fieldConfig.type === 'number') {
              if (fieldValidators.number(min) && fieldValidators.number(max)) {
                filters.push({
                  field,
                  operator,
                  value: [Number(min), Number(max)]
                });
              }
            }
          } 
          // Traitement spécial pour les opérateurs de collection (in, nin)
          else if (operator === 'in' || operator === 'nin') {
            const values = Array.isArray(value) ? value : String(value).split(',');
            
            // Pour les énumérations, vérifier que les valeurs sont valides
            if (fieldConfig.type === 'enum') {
              const validValues = values.filter(v => fieldConfig.values.includes(v));
              if (validValues.length > 0) {
                filters.push({
                  field,
                  operator,
                  value: validValues
                });
              }
            } else {
              filters.push({
                field,
                operator,
                value: values
              });
            }
          }
          // Traitement standard pour les autres opérateurs
          else {
            let processedValue = value;
            
            // Convertir la valeur selon le type du champ
            switch (fieldConfig.type) {
              case 'number':
                if (fieldValidators.number(value)) {
                  processedValue = Number(value);
                } else {
                  return; // Ignorer ce filtre si la valeur est invalide
                }
                break;
              case 'boolean':
                processedValue = value === 'true' || (value === true);
                break;
              case 'date':
                if (fieldValidators.date(value)) {
                  processedValue = new Date(value);
                } else {
                  return; // Ignorer ce filtre si la date est invalide
                }
                break;
              case 'enum':
                if (!fieldConfig.values.includes(value)) {
                  return; // Ignorer ce filtre si la valeur n'est pas dans l'enum
                }
                break;
            }
            
            filters.push({
              field,
              operator,
              value: processedValue
            });
          }
        }
      }
    }
  });
  
  return filters;
}

/**
 * Appliquer des filtres à un tableau de données
 * @param {Array} data - Tableau de données à filtrer
 * @param {Array} filters - Filtres à appliquer
 * @returns {Array} Données filtrées
 */
function applyFilters(data, filters) {
  if (!filters || !filters.length) {
    return data;
  }
  
  return data.filter(item => {
    // Un élément doit satisfaire tous les filtres (AND logique)
    return filters.every(filter => {
      const { field, operator, value } = filter;
      
      // Si l'opérateur existe, l'appliquer
      if (filterOperators[operator]) {
        return filterOperators[operator](field, value)(item);
      }
      
      return true;
    });
  });
}

/**
 * Filtre un ensemble de données selon les critères spécifiés
 * @param {Array} data - Données à filtrer
 * @param {Object} queryParams - Paramètres de requête avec filtres
 * @param {string} resourceType - Type de ressource
 * @returns {Array} Données filtrées
 */
function filterData(data, queryParams, resourceType) {
  const filters = parseFilters(queryParams, resourceType);
  return applyFilters(data, filters);
}

/**
 * Génère la documentation de tous les filtres disponibles pour un type de ressource
 * @param {string} resourceType - Type de ressource
 * @returns {Object} Documentation des filtres
 */
function getFilterDocumentation(resourceType) {
  const fields = FILTERABLE_FIELDS[resourceType];
  if (!fields) {
    return { error: `Type de ressource '${resourceType}' non pris en charge` };
  }
  
  const documentation = {
    resourceType,
    filterableFields: {}
  };
  
  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    
    documentation.filterableFields[fieldName] = {
      type: field.type,
      operators: field.operators,
      example: generateFilterExample(fieldName, field)
    };
    
    if (field.type === 'enum') {
      documentation.filterableFields[fieldName].allowedValues = field.values;
    }
  });
  
  return documentation;
}

/**
 * Génère un exemple de filtre pour un champ
 * @param {string} fieldName - Nom du champ
 * @param {Object} fieldConfig - Configuration du champ
 * @returns {string} Exemple de filtre
 */
function generateFilterExample(fieldName, fieldConfig) {
  const operator = fieldConfig.operators[0];
  let value;
  
  switch (fieldConfig.type) {
    case 'text':
      value = 'exemple';
      break;
    case 'number':
      value = 42;
      break;
    case 'boolean':
      value = true;
      break;
    case 'date':
      value = '2023-01-01';
      break;
    case 'enum':
      value = fieldConfig.values[0];
      break;
    default:
      value = 'valeur';
  }
  
  return `filter[${fieldName}][${operator}]=${value}`;
}

module.exports = {
  FILTERABLE_FIELDS,
  filterData,
  parseFilters,
  applyFilters,
  getFilterDocumentation
};