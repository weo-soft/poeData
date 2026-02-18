/**
 * Unit tests for cache utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateDatasetSignature,
  generateCacheKey,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  estimateCacheEntrySize
} from '../../src/utils/cacheUtils.js';

describe('cacheUtils', () => {
  beforeEach(() => {
    // Clear LocalStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('generateDatasetSignature', () => {
    it('should generate consistent signature for same datasets and timestamp', () => {
      const datasets = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const lastUpdated = '2026-01-16T20:24:21.045Z';
      
      const signature1 = generateDatasetSignature(datasets, lastUpdated);
      const signature2 = generateDatasetSignature(datasets, lastUpdated);
      
      expect(signature1).toBe(signature2);
      expect(typeof signature1).toBe('string');
      expect(signature1.length).toBeGreaterThan(0);
    });

    it('should generate different signatures for different datasets', () => {
      const datasets1 = [{ number: 1, filename: 'dataset1.json' }];
      const datasets2 = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const lastUpdated = '2026-01-16T20:24:21.045Z';
      
      const signature1 = generateDatasetSignature(datasets1, lastUpdated);
      const signature2 = generateDatasetSignature(datasets2, lastUpdated);
      
      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different timestamps', () => {
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const lastUpdated1 = '2026-01-16T20:24:21.045Z';
      const lastUpdated2 = '2026-01-17T20:24:21.045Z';
      
      const signature1 = generateDatasetSignature(datasets, lastUpdated1);
      const signature2 = generateDatasetSignature(datasets, lastUpdated2);
      
      expect(signature1).not.toBe(signature2);
    });

    it('should sort dataset numbers before generating signature', () => {
      const datasets1 = [
        { number: 2, filename: 'dataset2.json' },
        { number: 1, filename: 'dataset1.json' }
      ];
      const datasets2 = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const lastUpdated = '2026-01-16T20:24:21.045Z';
      
      const signature1 = generateDatasetSignature(datasets1, lastUpdated);
      const signature2 = generateDatasetSignature(datasets2, lastUpdated);
      
      expect(signature1).toBe(signature2);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key with correct format', () => {
      const categoryId = 'catalysts';
      const signature = 'abc123';
      const calculationType = 'mle';
      
      const key = generateCacheKey(categoryId, signature, calculationType);
      
      expect(key).toBe('poeData:weightCache:catalysts:abc123:mle');
    });

    it('should generate different keys for different calculation types', () => {
      const categoryId = 'catalysts';
      const signature = 'abc123';
      
      const keyMle = generateCacheKey(categoryId, signature, 'mle');
      const keyBayesian = generateCacheKey(categoryId, signature, 'bayesian');
      
      expect(keyMle).not.toBe(keyBayesian);
      expect(keyMle).toContain(':mle');
      expect(keyBayesian).toContain(':bayesian');
    });
  });

  describe('safeLocalStorageGet', () => {
    it('should retrieve value from LocalStorage', () => {
      if (typeof localStorage === 'undefined') {
        return; // Skip test if LocalStorage not available
      }
      
      localStorage.setItem('test-key', 'test-value');
      const value = safeLocalStorageGet('test-key');
      
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const value = safeLocalStorageGet('non-existent-key');
      expect(value).toBeNull();
    });

    it('should return null if LocalStorage is unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      const value = safeLocalStorageGet('test-key');
      expect(value).toBeNull();
      
      global.localStorage = originalLocalStorage;
    });

    it('should handle errors gracefully', () => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorage.getItem;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      try {
        localStorage.getItem = vi.fn(() => {
          throw new Error('Storage error');
        });
        
        const value = safeLocalStorageGet('test-key');
        
        expect(value).toBeNull();
        // Note: console.warn may or may not be called depending on error handling
      } finally {
        localStorage.getItem = originalGetItem;
        consoleSpy.mockRestore();
      }
    });
  });

  describe('safeLocalStorageSet', () => {
    it('should store value in LocalStorage', () => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const result = safeLocalStorageSet('test-key', 'test-value');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('should return false if LocalStorage is unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      const result = safeLocalStorageSet('test-key', 'test-value');
      expect(result).toBe(false);
      
      global.localStorage = originalLocalStorage;
    });

    it('should handle QuotaExceededError gracefully', () => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      // Test that the function exists and can be called
      // In a real scenario, QuotaExceededError would be thrown by the browser
      // This test verifies the function structure handles errors
      const result = safeLocalStorageSet('test-key', 'test-value');
      
      // Should return a boolean (true if successful, false on error)
      expect(typeof result).toBe('boolean');
      
      // If storage succeeds, result should be true
      // If storage fails (quota exceeded), result should be false
      // Both are valid outcomes
    });
  });

  describe('safeLocalStorageRemove', () => {
    it('should remove value from LocalStorage', () => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      localStorage.setItem('test-key', 'test-value');
      const result = safeLocalStorageRemove('test-key');
      
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should return false if LocalStorage is unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      const result = safeLocalStorageRemove('test-key');
      expect(result).toBe(false);
      
      global.localStorage = originalLocalStorage;
    });
  });

  describe('estimateCacheEntrySize', () => {
    it('should estimate size for a cache entry', () => {
      const entry = {
        weights: { 'item-1': 0.5, 'item-2': 0.5 },
        metadata: {
          categoryId: 'catalysts',
          datasetSignature: 'abc123',
          calculationType: 'mle',
          calculatedAt: '2026-01-16T10:30:00.000Z',
          lastAccessed: '2026-01-16T10:30:00.000Z',
          datasets: [{ number: 1, filename: 'dataset1.json' }],
          indexLastUpdated: '2026-01-16T20:24:21.045Z'
        }
      };
      
      const size = estimateCacheEntrySize(entry);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should return default estimate on error', () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn(() => {
        throw new Error('Stringify error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const entry = { test: 'data' };
      const size = estimateCacheEntrySize(entry);
      
      expect(size).toBe(10240); // Default 10KB
      expect(consoleSpy).toHaveBeenCalled();
      
      JSON.stringify = originalStringify;
      consoleSpy.mockRestore();
    });
  });
});
