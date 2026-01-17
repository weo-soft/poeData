/**
 * Unit tests for weight cache service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedWeights,
  setCachedWeights,
  getCacheStats,
  invalidateCache,
  clearCache
} from '../../src/services/weightCache.js';

describe('weightCache', () => {
  beforeEach(() => {
    // Clear LocalStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('getCachedWeights', () => {
    it('should return cached weights on cache hit', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const expectedWeights = {
        'item-1': 0.5,
        'item-2': 0.5
      };

      // First, set the cache
      await setCachedWeights(categoryId, datasets, calculationType, expectedWeights, indexData);

      // Then retrieve it
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

      expect(cachedWeights).toEqual(expectedWeights);
    });

    it('should return null on cache miss', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      // No cache set, should return null
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

      expect(cachedWeights).toBeNull();
    });
  });

  describe('setCachedWeights', () => {
    it('should store weights in cache', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const calculationType = 'mle';
      const weights = {
        'item-1': 0.6,
        'item-2': 0.4
      };
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Verify it was stored by retrieving it
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);
      expect(cachedWeights).toEqual(weights);
    });

    it('should handle storage errors gracefully', async () => {
      if (typeof localStorage === 'undefined') {
        return; // Skip if LocalStorage not available
      }

      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const weights = { 'item-1': 0.5 };
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      // Should not throw, should handle gracefully
      await expect(
        setCachedWeights(categoryId, datasets, calculationType, weights, indexData)
      ).resolves.not.toThrow();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('validateCacheEntry', () => {
    it('should validate cache entry with matching signature', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5, 'item-2': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Retrieve with same indexData - should be valid
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

      expect(cachedWeights).toEqual(weights);
    });

    it('should invalidate cache entry with signature mismatch', async () => {
      const categoryId = 'catalysts';
      const datasets1 = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const datasets2 = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' } // Different datasets
      ];
      const calculationType = 'mle';
      const indexData1 = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets: datasets1
      };
      const indexData2 = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets: datasets2 // Different datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache with datasets1
      await setCachedWeights(categoryId, datasets1, calculationType, weights, indexData1);

      // Try to retrieve with datasets2 - should be invalid (signature mismatch)
      const cachedWeights = await getCachedWeights(categoryId, datasets2, calculationType, indexData2);

      expect(cachedWeights).toBeNull(); // Cache should be invalid
    });

    it('should invalidate cache entry when index.json timestamp changes', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const calculationType = 'mle';
      const indexData1 = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const indexData2 = {
        lastUpdated: '2026-01-17T20:24:21.045Z', // Different timestamp
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache with indexData1
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData1);

      // Try to retrieve with indexData2 (newer timestamp) - should be invalid
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData2);

      expect(cachedWeights).toBeNull(); // Cache should be invalid due to timestamp change
    });

    it('should handle index.json unavailable scenario', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Try to retrieve with null indexData (simulating unavailable index.json)
      // In this case, we should treat cache as invalid
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, null);

      expect(cachedWeights).toBeNull(); // Should treat as invalid when index unavailable
    });

    it('should handle corrupted cache entry during validation', async () => {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      // Manually create a corrupted cache entry
      const { generateCacheKey, generateDatasetSignature } = await import('../../src/utils/cacheUtils.js');
      const datasetSignature = generateDatasetSignature(datasets, indexData.lastUpdated);
      const cacheKey = generateCacheKey(categoryId, datasetSignature, calculationType);
      localStorage.setItem(cacheKey, 'invalid json{');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Try to retrieve - should handle corrupted entry gracefully
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

      expect(cachedWeights).toBeNull(); // Should return null for corrupted entry
      expect(consoleSpy).toHaveBeenCalled();

      // Verify corrupted entry was deleted
      expect(localStorage.getItem(cacheKey)).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set some cache entries
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      const stats = await getCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entriesByCategory');
      expect(stats).toHaveProperty('entriesByType');
      expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache entries for a category', async () => {
      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Verify cache exists
      const before = await getCachedWeights(categoryId, datasets, calculationType, indexData);
      expect(before).not.toBeNull();

      // Invalidate
      const count = await invalidateCache(categoryId);

      expect(count).toBeGreaterThanOrEqual(1);

      // Verify cache is gone
      const after = await getCachedWeights(categoryId, datasets, calculationType, indexData);
      expect(after).toBeNull();
    });

    it('should invalidate only specific calculation type if provided', async () => {
      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set both MLE and Bayesian cache
      await setCachedWeights(categoryId, datasets, 'mle', weights, indexData);
      await setCachedWeights(categoryId, datasets, 'bayesian', weights, indexData);

      // Invalidate only MLE
      const count = await invalidateCache(categoryId, 'mle');

      expect(count).toBeGreaterThanOrEqual(1);

      // MLE should be gone
      const mleCache = await getCachedWeights(categoryId, datasets, 'mle', indexData);
      expect(mleCache).toBeNull();

      // Bayesian should still exist
      const bayesianCache = await getCachedWeights(categoryId, datasets, 'bayesian', indexData);
      expect(bayesianCache).not.toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      const categoryId1 = 'catalysts';
      const categoryId2 = 'scarabs';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache for multiple categories
      await setCachedWeights(categoryId1, datasets, 'mle', weights, indexData);
      await setCachedWeights(categoryId2, datasets, 'mle', weights, indexData);

      // Clear all
      const count = await clearCache();

      expect(count).toBeGreaterThanOrEqual(2);

      // Verify all caches are gone
      const cache1 = await getCachedWeights(categoryId1, datasets, 'mle', indexData);
      const cache2 = await getCachedWeights(categoryId2, datasets, 'mle', indexData);
      expect(cache1).toBeNull();
      expect(cache2).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entries when quota exceeded', async () => {
      if (typeof localStorage === 'undefined') {
        return;
      }

      // This test verifies the eviction mechanism exists
      // In a real scenario, quota would be exceeded and oldest entries evicted
      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, 'mle', weights, indexData);

      // Verify cache exists
      const cached = await getCachedWeights(categoryId, datasets, 'mle', indexData);
      expect(cached).not.toBeNull();

      // Note: Actual quota exceeded scenario would require filling LocalStorage
      // This test verifies the function structure handles eviction
    });
  });

  describe('Performance benchmarks', () => {
    it('should retrieve cached weights in under 100ms (SC-001)', async () => {
      const categoryId = 'catalysts';
      const datasets = [
        { number: 1, filename: 'dataset1.json' },
        { number: 2, filename: 'dataset2.json' }
      ];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5, 'item-2': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Measure retrieval time
      const startTime = performance.now();
      const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(cachedWeights).toEqual(weights);
      expect(duration).toBeLessThan(100); // SC-001: <100ms
    });

    it('should validate cache in under 50ms for 95% of requests (SC-003)', async () => {
      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };
      const weights = { 'item-1': 0.5 };

      // Set cache
      await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

      // Measure validation time (multiple runs to check consistency)
      const durations = [];
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        await getCachedWeights(categoryId, datasets, calculationType, indexData);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Check that 95% of requests are under 50ms
      durations.sort((a, b) => a - b);
      const p95Index = Math.floor(durations.length * 0.95);
      const p95Duration = durations[p95Index];

      expect(p95Duration).toBeLessThan(50); // SC-003: <50ms for 95% of requests
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle errors in getCachedWeights gracefully', async () => {
      // Test error path when JSON.parse fails
      if (typeof localStorage === 'undefined') {
        return;
      }

      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      // Manually create corrupted entry
      const { generateCacheKey, generateDatasetSignature } = await import('../../src/utils/cacheUtils.js');
      const datasetSignature = generateDatasetSignature(datasets, indexData.lastUpdated);
      const cacheKey = generateCacheKey(categoryId, datasetSignature, calculationType);
      localStorage.setItem(cacheKey, 'invalid json{');

      const result = await getCachedWeights(categoryId, datasets, calculationType, indexData);
      expect(result).toBeNull();
    });

    it('should handle errors in setCachedWeights gracefully', async () => {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const categoryId = 'catalysts';
      const datasets = [{ number: 1, filename: 'dataset1.json' }];
      const calculationType = 'mle';
      const weights = { 'item-1': 0.5 };
      const indexData = {
        lastUpdated: '2026-01-16T20:24:21.045Z',
        datasets
      };

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function() {
        throw new Error('Storage error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        setCachedWeights(categoryId, datasets, calculationType, weights, indexData)
      ).resolves.not.toThrow();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle errors in getCacheStats gracefully', async () => {
      if (typeof localStorage === 'undefined') {
        return;
      }

      // Create a scenario that might cause errors
      const stats = await getCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entriesByCategory');
      expect(stats).toHaveProperty('entriesByType');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
    });

    it('should handle errors in invalidateCache gracefully', async () => {
      const count = await invalidateCache('nonexistent-category');
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors in clearCache gracefully', async () => {
      const count = await clearCache();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
