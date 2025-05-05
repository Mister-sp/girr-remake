import { renderHook, act } from '@testing-library/react-hooks';
import usePagination from './usePagination';

// Mock pour la fonction fetchFunction qui sera passée au hook
const mockFetch = jest.fn();

// Mock pour les réponses d'API
const createApiResponse = (items, meta = {}) => ({
  data: {
    items,
    meta: {
      page: 1,
      pageSize: 10,
      total: items.length,
      totalPages: Math.ceil(items.length / 10),
      ...meta
    }
  }
});

describe('usePagination Hook', () => {
  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  test('initialise avec les valeurs par défaut', async () => {
    // Configurer le mock pour renvoyer une réponse vide
    mockFetch.mockResolvedValueOnce(createApiResponse([]));

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch)
    );

    // Attendre que la requête soit terminée
    await waitForNextUpdate();

    // Vérifier les valeurs par défaut
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20); // Valeur par défaut
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalItems).toBe(0);
  });

  test('charge des données et gère les métadonnées correctement', async () => {
    // Créer des données fictives
    const fakeItems = Array(30).fill().map((_, i) => ({ id: i, name: `Item ${i}` }));
    
    // Mock retournant les 10 premiers éléments avec méta
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItems.slice(0, 10), {
      total: 30,
      totalPages: 3
    }));

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch, { defaultPageSize: 10 })
    );

    // Attendre que la requête soit terminée
    await waitForNextUpdate();

    // Vérifier que les données et métadonnées sont correctes
    expect(result.current.data).toHaveLength(10);
    expect(result.current.totalItems).toBe(30);
    expect(result.current.totalPages).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 10
    }));
  });

  test('change de page correctement', async () => {
    // Créer des données fictives pour la page 1
    const fakeItemsPage1 = Array(10).fill().map((_, i) => ({ id: i, name: `Item ${i}` }));
    // Données pour la page 2
    const fakeItemsPage2 = Array(10).fill().map((_, i) => ({ id: i + 10, name: `Item ${i + 10}` }));
    
    // Premier appel - page 1
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItemsPage1, {
      page: 1,
      total: 30,
      totalPages: 3
    }));

    // Deuxième appel - page 2
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItemsPage2, {
      page: 2,
      total: 30,
      totalPages: 3
    }));

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch, { defaultPageSize: 10 })
    );

    // Attendre la première requête
    await waitForNextUpdate();
    expect(result.current.page).toBe(1);
    expect(result.current.data[0].id).toBe(0); // Premier élément de la page 1

    // Changer de page
    act(() => {
      result.current.handlePageChange(2);
    });

    // Attendre la mise à jour
    await waitForNextUpdate();

    // Vérifier que la page a changé et que les bonnes données sont chargées
    expect(result.current.page).toBe(2);
    expect(result.current.data[0].id).toBe(10); // Premier élément de la page 2
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 10
    }));
  });

  test('change la taille de page correctement', async () => {
    // Créer des données fictives
    const fakeItemsPage1Size10 = Array(10).fill().map((_, i) => ({ id: i, name: `Item ${i}` }));
    const fakeItemsPage1Size20 = Array(20).fill().map((_, i) => ({ id: i, name: `Item ${i}` }));
    
    // Premier appel - taille 10
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItemsPage1Size10, {
      pageSize: 10,
      total: 30,
      totalPages: 3
    }));

    // Deuxième appel - taille 20
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItemsPage1Size20, {
      pageSize: 20,
      total: 30,
      totalPages: 2
    }));

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch, { defaultPageSize: 10 })
    );

    // Attendre la première requête
    await waitForNextUpdate();
    expect(result.current.pageSize).toBe(10);
    expect(result.current.data).toHaveLength(10);

    // Changer la taille de page
    act(() => {
      result.current.handlePageSizeChange(20);
    });

    // Attendre la mise à jour
    await waitForNextUpdate();

    // Vérifier que la taille de page a changé
    expect(result.current.pageSize).toBe(20);
    expect(result.current.data).toHaveLength(20);
    expect(result.current.page).toBe(1); // Doit revenir à la page 1
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({
      pageSize: 20,
      page: 1
    }));
  });

  test('gère les erreurs correctement', async () => {
    // Simuler une erreur
    const error = new Error('Erreur API');
    mockFetch.mockRejectedValueOnce(error);

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch)
    );

    // Attendre que la promesse soit rejetée et que le state soit mis à jour
    await waitForNextUpdate();

    // Vérifier l'état d'erreur
    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  test('rafraîchit les données correctement', async () => {
    // Créer des données fictives
    const fakeItems1 = [{ id: 1, name: 'Item 1' }];
    const fakeItems2 = [{ id: 1, name: 'Item 1 mis à jour' }];
    
    // Premier appel
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItems1));
    
    // Deuxième appel (après refresh)
    mockFetch.mockResolvedValueOnce(createApiResponse(fakeItems2));

    // Rendre le hook
    const { result, waitForNextUpdate } = renderHook(() => 
      usePagination(mockFetch)
    );

    // Attendre la première requête
    await waitForNextUpdate();
    expect(result.current.data).toEqual(fakeItems1);

    // Appeler refresh
    act(() => {
      result.current.refresh();
    });

    // Attendre la mise à jour
    await waitForNextUpdate();

    // Vérifier que les données ont été rafraîchies
    expect(result.current.data).toEqual(fakeItems2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});