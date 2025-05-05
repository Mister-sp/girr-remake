import axios from 'axios';
import ApiService from './apiService';
import { AuthService } from './auth';
import { handleApiError } from './adapters';

// Mock des modules externes
jest.mock('axios');
jest.mock('./auth', () => ({
  AuthService: {
    getToken: jest.fn()
  }
}));
jest.mock('./adapters', () => ({
  handleApiError: jest.fn()
}));

describe('ApiService', () => {
  // Configuration avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.getToken.mockReturnValue('fake-token');
    jest.useFakeTimers();
  });

  // Restaurer après les tests
  afterEach(() => {
    jest.useRealTimers();
  });

  test('effectue une requête GET réussie avec authentification', async () => {
    // Préparation de la réponse simulée
    const mockResponse = { data: { success: true, data: [{ id: 1, name: 'test' }] } };
    axios.mockResolvedValueOnce(mockResponse);

    // Exécution
    const result = await ApiService.get('/api/test');

    // Vérifications
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: '/api/test',
      headers: { Authorization: 'Bearer fake-token' },
      data: undefined,
      params: undefined
    });
    expect(result).toBe(mockResponse);
    expect(axios).toHaveBeenCalledTimes(1);
  });

  test('effectue une requête POST réussie avec données', async () => {
    // Préparation
    const mockData = { name: 'test', value: 123 };
    const mockResponse = { data: { success: true, id: 1 } };
    axios.mockResolvedValueOnce(mockResponse);

    // Exécution
    const result = await ApiService.post('/api/test', mockData);

    // Vérifications
    expect(axios).toHaveBeenCalledWith({
      method: 'post',
      url: '/api/test',
      headers: { Authorization: 'Bearer fake-token' },
      data: mockData,
      params: undefined
    });
    expect(result).toBe(mockResponse);
  });

  test('essaie à nouveau après un échec (mécanisme de retry)', async () => {
    // Préparation - échec puis succès
    const error = new Error('Network Error');
    const mockResponse = { data: { success: true } };
    
    axios.mockRejectedValueOnce(error); // Premier appel - échec
    axios.mockResolvedValueOnce(mockResponse); // Deuxième appel - succès

    // Callback de retry pour les tests
    const onRetry = jest.fn();

    // Exécution
    const resultPromise = ApiService.get('/api/test', { retries: 1, onRetry });

    // Avancer le temps pour laisser le délai de retry s'écouler
    jest.advanceTimersByTime(1000);
    
    // Attendre la résolution
    const result = await resultPromise;

    // Vérifications
    expect(axios).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(error, 1);
    expect(result).toBe(mockResponse);
  });

  test('échoue après avoir épuisé toutes les tentatives', async () => {
    // Préparation - tous les appels échouent
    const error = new Error('Server Error');
    axios.mockRejectedValue(error);

    // Exécution et attente de l'échec
    await expect(ApiService.get('/api/test', { retries: 2 })).rejects.toThrow('Server Error');

    // Vérifications
    expect(axios).toHaveBeenCalledTimes(3); // Appel initial + 2 retry
    expect(handleApiError).toHaveBeenCalledWith(error, '/api/test');
  });

  test('ne lance pas d\'erreur si throwOnError est false', async () => {
    // Préparation
    const error = new Error('API Error');
    axios.mockRejectedValue(error);

    // Exécution
    const result = await ApiService.get('/api/test', { 
      retries: 1, 
      throwOnError: false 
    });

    // Avancer le temps pour le retry
    jest.advanceTimersByTime(1000);

    // Vérifications
    expect(axios).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(result).toEqual({
      error,
      isError: true,
      status: 500,
      message: 'API Error'
    });
    expect(handleApiError).not.toHaveBeenCalled();
  });

  test('respecte le délai progressif entre les tentatives', async () => {
    // Préparation
    const error = new Error('Server Error');
    axios.mockRejectedValue(error);

    // Exécution
    const resultPromise = ApiService.get('/api/test', { 
      retries: 2,
      retryDelay: 500,
      throwOnError: false
    });

    // Premier retry (après 500ms)
    jest.advanceTimersByTime(500);
    // Deuxième retry (après 1000ms supplémentaires)
    jest.advanceTimersByTime(1000);
    
    // Attendre la résolution
    await resultPromise;

    // Vérifications
    expect(axios).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
  
  test('effectue une requête PUT avec authentification', async () => {
    // Préparation
    const mockData = { id: 1, updated: true };
    const mockResponse = { data: { success: true } };
    axios.mockResolvedValueOnce(mockResponse);

    // Exécution
    const result = await ApiService.put('/api/test/1', mockData);

    // Vérifications
    expect(axios).toHaveBeenCalledWith({
      method: 'put',
      url: '/api/test/1',
      headers: { Authorization: 'Bearer fake-token' },
      data: mockData,
      params: undefined
    });
    expect(result).toBe(mockResponse);
  });

  test('effectue une requête DELETE avec authentification', async () => {
    // Préparation
    const mockResponse = { data: { success: true } };
    axios.mockResolvedValueOnce(mockResponse);

    // Exécution
    const result = await ApiService.delete('/api/test/1');

    // Vérifications
    expect(axios).toHaveBeenCalledWith({
      method: 'delete',
      url: '/api/test/1',
      headers: { Authorization: 'Bearer fake-token' },
      data: undefined,
      params: undefined
    });
    expect(result).toBe(mockResponse);
  });

  test('permet de désactiver l\'authentification', async () => {
    // Préparation
    const mockResponse = { data: { success: true } };
    axios.mockResolvedValueOnce(mockResponse);

    // Exécution
    await ApiService.get('/api/public', { useAuth: false });

    // Vérifications
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: '/api/public',
      headers: {}, // Pas d'en-tête d'autorisation
      data: undefined,
      params: undefined
    });
    expect(AuthService.getToken).not.toHaveBeenCalled();
  });
});