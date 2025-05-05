/**
 * Tests unitaires pour les adaptateurs des réponses API.
 */

import { extractDataArray } from './adapters';

describe('extractDataArray', () => {
  test('extrait correctement les données d\'un tableau direct', () => {
    const rawResponse = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    const result = extractDataArray({ data: rawResponse });
    expect(result).toEqual(rawResponse);
  });
  
  test('extrait correctement les données d\'une réponse avec un tableau dans "data"', () => {
    const dataArray = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    const result = extractDataArray({ data: dataArray });
    expect(result).toEqual(dataArray);
  });
  
  test('extrait correctement les données d\'une réponse paginée', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    const response = {
      data: {
        items: items,
        meta: {
          page: 1,
          pageSize: 10,
          total: 2
        }
      }
    };
    
    const result = extractDataArray(response);
    expect(result).toEqual(items);
  });
  
  test('extrait correctement les données d\'une réponse paginée avec success:true', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    const response = {
      data: {
        success: true,
        data: items,
        meta: {
          page: 1,
          pageSize: 10,
          total: 2
        }
      }
    };
    
    const result = extractDataArray(response);
    expect(result).toEqual(items);
  });
  
  test('gère correctement une réponse vide', () => {
    const result = extractDataArray({});
    expect(result).toEqual([]);
  });
  
  test('gère correctement une réponse null', () => {
    const result = extractDataArray(null);
    expect(result).toEqual([]);
  });
  
  test('gère correctement une réponse avec data: null', () => {
    const result = extractDataArray({ data: null });
    expect(result).toEqual([]);
  });
  
  test('gère correctement une réponse avec data qui n\'est ni un tableau ni un objet', () => {
    const result = extractDataArray({ data: 'not an array' });
    expect(result).toEqual([]);
  });
});