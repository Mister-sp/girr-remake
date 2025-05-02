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

/**
 * Gestion des erreurs API.
 * @param {Response} response - Réponse fetch
 * @returns {Promise} Données de la réponse ou erreur
 * @private
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur serveur');
  }
  return response.json();
}

/**
 * Récupère les détails d'un programme.
 * @param {number} programId - ID du programme
 * @returns {Promise<Object>} Détails du programme
 */
export async function getProgramDetails(programId) {
  const response = await fetch(`${API_BASE}/programs/${programId}`);
  return handleResponse(response);
}

/**
 * Crée un nouveau programme.
 * @param {Object} data - Données du programme
 * @param {File} [logoFile] - Fichier logo optionnel
 * @returns {Promise<Object>} Programme créé
 */
export async function createProgram(data, logoFile) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  if (logoFile) {
    formData.append('logo', logoFile);
  }
  const response = await fetch(`${API_BASE}/programs`, {
    method: 'POST',
    body: formData
  });
  return handleResponse(response);
}

/**
 * Récupère les détails d'un épisode.
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode
 * @returns {Promise<Object>} Détails de l'épisode
 */
export async function getEpisodeDetails(programId, episodeId) {
  const response = await fetch(`${API_BASE}/programs/${programId}/episodes/${episodeId}`);
  return handleResponse(response);
}

/**
 * Récupère les sujets d'un épisode.
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode
 * @returns {Promise<Array>} Liste des sujets
 */
export async function getTopicsForEpisode(programId, episodeId) {
  const response = await fetch(`${API_BASE}/programs/${programId}/episodes/${episodeId}/topics`);
  return handleResponse(response);
}

/**
 * Récupère les médias d'un sujet.
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet
 * @returns {Promise<Array>} Liste des médias
 */
export async function getMediaForTopic(programId, episodeId, topicId) {
  const response = await fetch(`${API_BASE}/programs/${programId}/episodes/${episodeId}/topics/${topicId}/media`);
  return handleResponse(response);
}

/**
 * Met à jour l'ordre des médias d'un sujet.
 * @param {number} programId - ID du programme parent
 * @param {number} episodeId - ID de l'épisode parent
 * @param {number} topicId - ID du sujet
 * @param {Array<number>} orderedIds - Liste ordonnée des IDs de médias
 * @returns {Promise<void>}
 */
export async function updateMediaOrder(programId, episodeId, topicId, orderedIds) {
  const response = await fetch(`${API_BASE}/programs/${programId}/episodes/${episodeId}/topics/${topicId}/media/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds })
  });
  return handleResponse(response);
}

/**
 * Obtient les paramètres de transition.
 * @returns {Promise<Object>} Paramètres de transition
 */
export async function getTransitionSettings() {
  const response = await fetch(`${API_BASE}/settings/transitions`);
  return handleResponse(response);
}

/**
 * Met à jour les paramètres de transition.
 * @param {Object} settings - Nouveaux paramètres
 * @returns {Promise<Object>} Paramètres mis à jour
 */
export async function updateTransitionSettings(settings) {
  const response = await fetch(`${API_BASE}/settings/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return handleResponse(response);
}

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
export const deleteProgram = (id) => apiClient.delete(`/programs/${id}`); // Ajout de la fonction de suppression

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
