import { useState, useCallback, useEffect } from 'react';
import { extractPaginationMeta } from '../services/adapters';

/**
 * Hook personnalisé pour gérer l'état de pagination et synchroniser avec les requêtes API.
 * Compatible avec la structure de pagination standardisée du backend.
 * 
 * @param {Function} fetchFunction - Fonction de récupération des données qui accepte les paramètres de pagination
 * @param {Object} options - Options de configuration
 * @param {number} options.defaultPage - Page par défaut (commence à 1)
 * @param {number} options.defaultPageSize - Taille de page par défaut
 * @param {Array<number>} options.pageSizeOptions - Options pour le sélecteur de taille de page
 * @param {Object} options.defaultFilters - Filtres initiaux à appliquer
 * @param {Object} options.additionalParams - Paramètres supplémentaires à passer à fetchFunction
 * @param {Function} options.onSuccess - Fonction appelée en cas de succès de fetchFunction
 * @param {Function} options.onError - Fonction appelée en cas d'erreur de fetchFunction
 * @returns {Object} État et fonctions de pagination
 */
function usePagination(fetchFunction, options = {}) {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
    defaultFilters = {},
    additionalParams = {},
    onSuccess,
    onError
  } = options;

  // État local pour la pagination
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  // Fonction pour charger les données avec les paramètres de pagination
  const fetchData = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFunction({
        page: params.page || page,
        pageSize: params.pageSize || pageSize,
        sortBy: params.sortBy || sortBy,
        sortDirection: params.sortDirection || sortDirection,
        filters: params.filters || filters,
        ...additionalParams
      });

      // Extraire les métadonnées de pagination
      const meta = extractPaginationMeta(response);
      
      if (meta) {
        setTotalItems(meta.total || 0);
        setTotalPages(meta.totalPages || 0);
        // Synchroniser la page actuelle avec la réponse si fournie
        if (meta.page) setPage(meta.page);
        // Synchroniser la taille de page avec la réponse si fournie
        if (meta.pageSize) setPageSize(meta.pageSize);
      }

      // Extraire les données si disponibles
      if (response.data) {
        // Si la structure contient des "items", c'est un format paginé standard
        if (response.data.items && Array.isArray(response.data.items)) {
          setData(response.data.items);
        }
        // Si la structure contient un "data", c'est un autre format avec succès+données+méta
        else if (response.data.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        }
        // Sinon c'est directement un tableau dans data
        else if (Array.isArray(response.data)) {
          setData(response.data);
        }
      }

      // Appeler onSuccess si fourni
      if (onSuccess) onSuccess(response);

    } catch (err) {
      console.error('Erreur lors de la récupération des données paginées :', err);
      setError(err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, page, pageSize, sortBy, sortDirection, filters, additionalParams, onSuccess, onError]);

  // Charger les données au montage et quand les paramètres de pagination changent
  useEffect(() => {
    fetchData();
  }, [fetchData, page, pageSize, sortBy, sortDirection, filters]);

  // Fonction pour changer de page
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Fonction pour changer la taille de page
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    // Revenir à la première page lors d'un changement de taille de page
    setPage(1);
  }, []);

  // Fonction pour changer le tri
  const handleSortChange = useCallback((field, direction) => {
    setSortBy(field);
    setSortDirection(direction);
    // Revenir à la première page lors d'un changement de tri
    setPage(1);
  }, []);

  // Fonction pour mettre à jour les filtres
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    // Revenir à la première page lors d'un changement de filtres
    setPage(1);
  }, []);

  // Fonction pour ajouter ou mettre à jour un seul filtre
  const updateFilter = useCallback((key, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      
      // Si la valeur est vide, supprimer le filtre
      if (value === undefined || value === null || value === '') {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      
      return newFilters;
    });
    
    // Revenir à la première page
    setPage(1);
  }, []);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  // Fonction pour rafraîchir les données avec les paramètres actuels
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // État
    page,
    pageSize,
    sortBy,
    sortDirection,
    filters,
    totalItems,
    totalPages,
    isLoading,
    error,
    data,
    pageSizeOptions,
    
    // Handlers
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleFilterChange,
    updateFilter,
    resetFilters,
    
    // Fonctions utilitaires
    refresh,
    setPage,
    setPageSize,
    
    // Paramètres complets pour la requête API
    paginationParams: {
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters
    }
  };
}

export default usePagination;