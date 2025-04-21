import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // L'URL de base de notre backend
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default apiClient;
