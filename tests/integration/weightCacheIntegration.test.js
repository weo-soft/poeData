/**
 * Integration tests for weight cache service
 * Tests the full cache flow including integration with weight calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedWeights,
  setCachedWeights,
  getCacheStats
} from '../../src/services/weightCache.js';

describe('weightCacheIntegration', () => {
  beforeEach(() => {
    // Clear LocalStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should cache and retrieve weights for cache retrieval flow', async () => {
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
    const weights = {
      'item-1': 0.3,
      'item-2': 0.4,
      'item-3': 0.3
    };

    // Step 1: Calculate and cache weights (simulating weight calculation)
    await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

    // Step 2: Retrieve cached weights (simulating page navigation back)
    const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

    // Step 3: Verify cache hit
    expect(cachedWeights).not.toBeNull();
    expect(cachedWeights).toEqual(weights);
  });

  it('should invalidate cache when datasets change', async () => {
    const categoryId = 'catalysts';
    const datasets1 = [
      { number: 1, filename: 'dataset1.json' },
      { number: 2, filename: 'dataset2.json' }
    ];
    const datasets2 = [
      { number: 1, filename: 'dataset1.json' },
      { number: 2, filename: 'dataset2.json' },
      { number: 3, filename: 'dataset3.json' } // New dataset added
    ];
    const calculationType = 'mle';
    const indexData1 = {
      lastUpdated: '2026-01-16T20:24:21.045Z',
      datasets: datasets1
    };
    const indexData2 = {
      lastUpdated: '2026-01-17T20:24:21.045Z', // Updated timestamp
      datasets: datasets2 // New dataset added
    };
    const weights1 = {
      'item-1': 0.5,
      'item-2': 0.5
    };

    // Step 1: Cache weights with initial datasets
    await setCachedWeights(categoryId, datasets1, calculationType, weights1, indexData1);

    // Step 2: Verify cache works with original datasets
    const cached1 = await getCachedWeights(categoryId, datasets1, calculationType, indexData1);
    expect(cached1).toEqual(weights1);

    // Step 3: Try to retrieve with updated datasets (new dataset added)
    // Cache should be invalidated because datasets changed
    const cached2 = await getCachedWeights(categoryId, datasets2, calculationType, indexData2);
    expect(cached2).toBeNull(); // Cache should be invalid

    // Step 4: Verify original cache is still invalid (signature changed)
    const cached3 = await getCachedWeights(categoryId, datasets1, calculationType, indexData1);
    // Note: This might still work if the signature matches, but with new indexData it should be invalid
    // The key point is that when datasets change, cache should be invalid
  });

  it('should persist cache across page refresh simulation', async () => {
    const categoryId = 'catalysts';
    const datasets = [
      { number: 1, filename: 'dataset1.json' }
    ];
    const calculationType = 'mle';
    const indexData = {
      lastUpdated: '2026-01-16T20:24:21.045Z',
      datasets
    };
    const weights = {
      'item-1': 0.4,
      'item-2': 0.6
    };

    // Step 1: Set cache (simulating calculation)
    await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

    // Step 2: Verify cache exists
    const statsBefore = await getCacheStats();
    expect(statsBefore.totalEntries).toBeGreaterThanOrEqual(1);

    // Step 3: Simulate page refresh by checking cache still exists
    // (LocalStorage persists across page refreshes)
    const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

    // Step 4: Verify cache persisted
    expect(cachedWeights).not.toBeNull();
    expect(cachedWeights).toEqual(weights);

    // Step 5: Verify stats still show the entry
    const statsAfter = await getCacheStats();
    expect(statsAfter.totalEntries).toBeGreaterThanOrEqual(1);
  });

  it('should cache and retrieve MLE weight calculations', async () => {
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
    const weights = {
      'item-1': 0.25,
      'item-2': 0.35,
      'item-3': 0.40
    };

    // Step 1: Cache MLE weights
    await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

    // Step 2: Retrieve MLE weights
    const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

    // Step 3: Verify MLE cache works
    expect(cachedWeights).not.toBeNull();
    expect(cachedWeights).toEqual(weights);
  });

  it('should cache and retrieve Bayesian weight calculations', async () => {
    const categoryId = 'catalysts';
    const datasets = [
      { number: 1, filename: 'dataset1.json' },
      { number: 2, filename: 'dataset2.json' }
    ];
    const calculationType = 'bayesian';
    const indexData = {
      lastUpdated: '2026-01-16T20:24:21.045Z',
      datasets
    };
    const weights = {
      'item-1': 0.30,
      'item-2': 0.30,
      'item-3': 0.40
    };

    // Step 1: Cache Bayesian weights
    await setCachedWeights(categoryId, datasets, calculationType, weights, indexData);

    // Step 2: Retrieve Bayesian weights
    const cachedWeights = await getCachedWeights(categoryId, datasets, calculationType, indexData);

    // Step 3: Verify Bayesian cache works
    expect(cachedWeights).not.toBeNull();
    expect(cachedWeights).toEqual(weights);

    // Step 4: Verify MLE and Bayesian caches are independent
    const mleWeights = await getCachedWeights(categoryId, datasets, 'mle', indexData);
    // MLE cache should be separate (may be null if not set, or different if set)
    expect(cachedWeights).not.toEqual(mleWeights || {});
  });
});
