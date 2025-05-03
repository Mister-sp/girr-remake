import axios from 'axios';

/**
 * Service de gestion des appels API.
 * @module services/api
 */

const API_BASE = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE, // L'URL de base de notre backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fremen_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Rediriger vers la page de connexion si le token est invalide ou expiré
      localStorage.removeItem('fremen_auth_token');
      localStorage.removeItem('fremen_user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fonctions pour interagir avec l'API des programmes
export const getPrograms = () => apiClient.get('/programs');
export const createProgram = (programData) => {
  if (programData instanceof FormData) {
    return apiClient.post('/programs', programData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.post('/programs', programData);
};
export const updateProgram = (id, programData) => {
  if (programData instanceof FormData) {
    return apiClient.put(`/programs/${id}`, programData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.put(`/programs/${id}`, programData);
};
export const deleteProgram = (id) => apiClient.delete(`/programs/${id}`);

// Fonctions pour interagir avec l'API des épisodes (imbriqués sous les programmes)
export const getEpisodesForProgram = (programId) => apiClient.get(`/programs/${programId}/episodes`);
export const getEpisodeDetails = (programId, episodeId) => apiClient.get(`/programs/${programId}/episodes/${episodeId}`);
export const createEpisode = (programId, episodeData) => apiClient.post(`/programs/${programId}/episodes`, episodeData);
export const updateEpisode = (programId, episodeId, episodeData) => apiClient.put(`/programs/${programId}/episodes/${episodeId}`, episodeData);
export const deleteEpisode = (programId, episodeId) => apiClient.delete(`/programs/${programId}/episodes/${episodeId}`);

// Fonctions pour interagir avec l'API des sujets (imbriqués sous les épisodes)
export const getTopicsForEpisode = (programId, episodeId) => apiClient.get(`/programs/${programId}/episodes/${episodeId}/topics`);
export const createTopic = (programId, episodeId, topicData) => apiClient.post(`/programs/${programId}/episodes/${episodeId}/topics`, topicData);
export const updateTopic = (programId, episodeId, topicId, topicData) => apiClient.put(`/programs/${programId}/episodes/${episodeId}/topics/${topicId}`, topicData);
export const deleteTopic = (programId, episodeId, topicId) => apiClient.delete(`/programs/${programId}/episodes/${episodeId}/topics/${topicId}`);

// Fonctions pour interagir avec l'API des médias (imbriqués sous les sujets)
const mediaBaseUrl = (programId, episodeId, topicId) => 
  `/programs/${programId}/episodes/${episodeId}/topics/${topicId}/media`;

export const getMediaForTopic = (programId, episodeId, topicId) => 
  apiClient.get(mediaBaseUrl(programId, episodeId, topicId));

export const createMedia = (programId, episodeId, topicId, mediaData) => 
  apiClient.post(mediaBaseUrl(programId, episodeId, topicId), mediaData);

export const updateMedia = (programId, episodeId, topicId, mediaId, mediaData) => 
  apiClient.put(`${mediaBaseUrl(programId, episodeId, topicId)}/${mediaId}`, mediaData);

export const updateMediaOrder = (programId, episodeId, topicId, orderedIds) => 
  apiClient.put(`${mediaBaseUrl(programId, episodeId, topicId)}/order`, { orderedIds });

export const deleteMedia = (programId, episodeId, topicId, mediaId) => 
  apiClient.delete(`${mediaBaseUrl(programId, episodeId, topicId)}/${mediaId}`);

// Fonctions pour gérer les paramètres de transition
export const getTransitionSettings = () => apiClient.get('/settings/transitions');
export const updateTransitionSettings = (settings) => apiClient.post('/settings/transitions', settings);

// Fonctions pour l'export/import des configurations
export const exportConfig = () => apiClient.get('/settings/export', { responseType: 'blob' });
export const importConfig = (configData) => apiClient.post('/settings/import', configData);

export default apiClient;
