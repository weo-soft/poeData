/**
 * Weight cache service
 * Provides caching functionality for weight calculation results
 * Stores calculated weights in LocalStorage with validation against dataset index
 */

import {
  generateDatasetSignature,
  generateCacheKey,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  estimateCacheEntrySize
} from '../utils/cacheUtils.js';

const CACHE_KEY_PREFIX = 'poeData:weightCache:';

/**
 * Get all cache entries from LocalStorage
 * @returns {Array<{key: string, entry: Object, lastAccessed: string}>} Array of cache entries with metadata
 */
function getAllCacheEntries() {
  const entries = [];
  
  if (typeof localStorage === 'undefined') {
    return entries;
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const json = safeLocalStorageGet(key);
          if (json) {
            const entry = JSON.parse(json);
            if (entry.metadata && entry.metadata.lastAccessed) {
              entries.push({
                key,
                entry,
                lastAccessed: entry.metadata.lastAccessed
              });
            }
          }
        } catch (error) {
          // Skip corrupted entries
          continue;
        }
      }
    }
  } catch (error) {
    console.warn(`[WeightCache] Error scanning cache entries: ${error.message}`);
  }

  return entries;
}

/**
 * Downsample posterior samples for caching
 * Reduces sample count while preserving distribution shape for visualization
 * @param {Object<string, number[]>} posteriorSamples - Full posterior samples per item
 * @param {number} targetSamples - Target number of samples per item (default: 200)
 * @returns {Object<string, number[]>} Downsampled posterior samples
 */
function downsamplePosteriorSamples(posteriorSamples, targetSamples = 200) {
  const downsampled = {};
  
  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    if (!Array.isArray(samples) || samples.length === 0) {
      downsampled[itemId] = samples;
      continue;
    }
    
    if (samples.length <= targetSamples) {
      // Already small enough, keep as is
      downsampled[itemId] = samples;
      continue;
    }
    
    // Downsample by taking evenly spaced samples
    // This preserves the distribution shape better than random sampling
    const step = samples.length / targetSamples;
    const downsampledSamples = [];
    
    for (let i = 0; i < targetSamples; i++) {
      const index = Math.floor(i * step);
      if (index < samples.length) {
        downsampledSamples.push(samples[index]);
      }
    }
    
    downsampled[itemId] = downsampledSamples;
  }
  
  return downsampled;
}

/**
 * Evict oldest cache entries to free up storage space
 * @param {number} requiredSpace - Bytes of space needed
 * @returns {Promise<number>} Bytes freed
 */
async function evictOldestEntries(requiredSpace) {
  let bytesFreed = 0;
  
  try {
    // Get all cache entries sorted by lastAccessed (oldest first)
    const entries = getAllCacheEntries();
    entries.sort((a, b) => {
      const timeA = new Date(a.lastAccessed).getTime();
      const timeB = new Date(b.lastAccessed).getTime();
      return timeA - timeB; // Oldest first
    });

    // Evict entries until we have enough space
    for (const { key, entry } of entries) {
      if (bytesFreed >= requiredSpace) {
        break;
      }

      const entrySize = estimateCacheEntrySize(entry);
      if (safeLocalStorageRemove(key)) {
        bytesFreed += entrySize;
      }
    }
  } catch (error) {
    console.warn(`[WeightCache] Error evicting cache entries: ${error.message}`);
  }

  return bytesFreed;
}

/**
 * Validate a cache entry against current index.json data
 * @param {Object} cacheEntry - Cached weight entry
 * @param {Object} currentIndexData - Current index.json data
 * @returns {Object} Validation result { isValid: boolean, reason?: string }
 */
function validateCacheEntry(cacheEntry, currentIndexData) {
  // If indexData is unavailable, treat cache as invalid
  if (!currentIndexData || !currentIndexData.lastUpdated || !currentIndexData.datasets) {
    return {
      isValid: false,
      reason: 'index_unavailable'
    };
  }

  // Validate cache entry structure
  if (!cacheEntry.metadata || !cacheEntry.metadata.datasetSignature) {
    return {
      isValid: false,
      reason: 'corrupted_entry'
    };
  }

  // Generate current dataset signature
  const currentSignature = generateDatasetSignature(
    currentIndexData.datasets,
    currentIndexData.lastUpdated
  );

  // Compare signatures
  if (cacheEntry.metadata.datasetSignature !== currentSignature) {
    return {
      isValid: false,
      reason: 'dataset_signature_mismatch',
      currentSignature,
      cachedSignature: cacheEntry.metadata.datasetSignature
    };
  }

  // Signatures match - cache is valid
  return {
    isValid: true
  };
}

/**
 * Get cached weights for a category if valid, otherwise return null
 * 
 * Validates cache entry against current index.json to ensure datasets haven't changed.
 * Returns cached weights if valid, null if cache miss or invalid.
 * Updates lastAccessed timestamp on successful retrieval.
 * 
 * Performance target: <100ms for cache hit (SC-001)
 * 
 * @param {string} categoryId - Category identifier (e.g., "catalysts", "scarabs")
 * @param {Array<{number: number, filename: string}>} datasets - Array of dataset metadata objects with number and filename properties
 * @param {string} calculationType - Type of weight calculation: "mle" or "bayesian"
 * @param {Object} indexData - Current index.json data with lastUpdated (ISO 8601 string) and datasets (array)
 * @returns {Promise<Object<string, number> | null>} Cached weights object (itemId → weight mapping) if valid, null if cache miss/invalid
 * @throws {never} Never throws errors - uses graceful degradation, returns null on any error
 * 
 * @example
 * const indexData = {
 *   lastUpdated: "2026-01-16T20:24:21.045Z",
 *   datasets: [{ number: 1, filename: "dataset1.json" }]
 * };
 * const weights = await getCachedWeights("catalysts", indexData.datasets, "mle", indexData);
 * if (weights) {
 *   console.log("Cache hit!", weights);
 * } else {
 *   console.log("Cache miss, need to recalculate");
 * }
 */
export async function getCachedWeights(categoryId, datasets, calculationType, indexData) {
  try {
    // If indexData is unavailable, treat as cache miss (can't validate)
    if (!indexData || !indexData.lastUpdated || !indexData.datasets) {
      console.warn(`[WeightCache] Index data unavailable for ${categoryId}, treating cache as invalid`);
      return null;
    }

    // Generate cache key
    const datasetSignature = generateDatasetSignature(datasets, indexData.lastUpdated);
    const cacheKey = generateCacheKey(categoryId, datasetSignature, calculationType);

    // Load from LocalStorage
    const cachedJson = safeLocalStorageGet(cacheKey);
    if (!cachedJson) {
      return null; // Cache miss
    }

    // Deserialize cache entry
    let cacheEntry;
    try {
      cacheEntry = JSON.parse(cachedJson);
    } catch (parseError) {
      // Corrupted entry - delete it and return null
      console.warn(`[WeightCache] Corrupted cache entry for ${cacheKey}, deleting`);
      safeLocalStorageRemove(cacheKey);
      return null;
    }

    // Validate cache entry structure
    if (!cacheEntry.weights || !cacheEntry.metadata) {
      console.warn(`[WeightCache] Invalid cache entry structure for ${cacheKey}, deleting`);
      safeLocalStorageRemove(cacheKey);
      return null;
    }

    // Validate cache entry against current index.json
    const validationResult = validateCacheEntry(cacheEntry, indexData);

    if (!validationResult.isValid) {
      // Cache is invalid - delete it and return null
      console.log(`[WeightCache] Cache invalid for ${cacheKey}: ${validationResult.reason}`);
      safeLocalStorageRemove(cacheKey);
      return null;
    }

    // Cache is valid - update lastAccessed
    const now = new Date().toISOString();
    cacheEntry.metadata.lastAccessed = now;

    // Update cache entry with new lastAccessed
    try {
      const updatedJson = JSON.stringify(cacheEntry);
      safeLocalStorageSet(cacheKey, updatedJson);
    } catch (error) {
      // If update fails, still return the data (non-critical)
      console.warn(`[WeightCache] Failed to update lastAccessed for ${cacheKey}: ${error.message}`);
    }

    // For Bayesian with full result, return the full object; otherwise return just weights
    if (calculationType === 'bayesian' && cacheEntry.posteriorSamples) {
      return {
        weights: cacheEntry.weights,
        posteriorSamples: cacheEntry.posteriorSamples,
        summaryStatistics: cacheEntry.summaryStatistics,
        convergenceDiagnostics: cacheEntry.convergenceDiagnostics,
        modelAssumptions: cacheEntry.modelAssumptions,
        metadata: cacheEntry.metadata
      };
    }
    
    return cacheEntry.weights;
  } catch (error) {
    // Graceful degradation - log error and return null
    console.error(`[WeightCache] Error retrieving cached weights: ${error.message}`);
    return null;
  }
}

/**
 * Store calculated weights in cache
 * 
 * Stores calculated weights in LocalStorage with metadata for validation.
 * For Bayesian calculations, can store full result including posterior samples.
 * Automatically evicts oldest entries if storage quota would be exceeded.
 * 
 * Performance target: <50ms for storage (non-blocking, SC-003)
 * 
 * @param {string} categoryId - Category identifier (e.g., "catalysts", "scarabs")
 * @param {Array<{number: number, filename: string}>} datasets - Array of dataset metadata used in calculation
 * @param {string} calculationType - Type of calculation performed: "mle" or "bayesian"
 * @param {Object<string, number>|Object} weights - For MLE: weights object mapping item IDs to weight values. For Bayesian: full result object with posteriorSamples, summaryStatistics, etc.
 * @param {Object} indexData - Index.json data with lastUpdated (ISO 8601 string) and datasets (array)
 * @returns {Promise<void>} Resolves when storage completes (or fails gracefully)
 * @throws {never} Never throws errors - uses graceful degradation, logs errors but continues
 * 
 * @example
 * // MLE weights
 * const weights = { "item-1": 0.5, "item-2": 0.5 };
 * await setCachedWeights("catalysts", datasets, "mle", weights, indexData);
 * 
 * @example
 * // Bayesian full result
 * const bayesianResult = { posteriorSamples: {...}, summaryStatistics: {...}, ... };
 * await setCachedWeights("catalysts", datasets, "bayesian", bayesianResult, indexData);
 */
export async function setCachedWeights(categoryId, datasets, calculationType, weights, indexData) {
  try {
    // Generate cache key
    const datasetSignature = generateDatasetSignature(datasets, indexData.lastUpdated);
    const cacheKey = generateCacheKey(categoryId, datasetSignature, calculationType);

    // Create cache entry
    const now = new Date().toISOString();
    
    // For Bayesian, store full result; for MLE, store just weights
    let cacheEntry;
    if (calculationType === 'bayesian' && weights.posteriorSamples) {
      // Downsample posterior samples for caching (reduces size significantly)
      // 200 samples per item is sufficient for density plots while being much smaller
      const downsampledSamples = downsamplePosteriorSamples(weights.posteriorSamples, 200);
      
      // Store Bayesian result with downsampled posterior samples
      cacheEntry = {
        weights: weights.summaryStatistics ? 
          Object.fromEntries(
            Object.entries(weights.summaryStatistics).map(([id, stats]) => [id, stats.median])
          ) : weights, // Fallback to weights if summaryStatistics not available
        posteriorSamples: downsampledSamples, // Downsampled for storage efficiency
        summaryStatistics: weights.summaryStatistics,
        convergenceDiagnostics: weights.convergenceDiagnostics,
        modelAssumptions: weights.modelAssumptions,
        metadata: {
          categoryId,
          datasetSignature,
          calculationType,
          calculatedAt: now,
          lastAccessed: now,
          datasets: [...datasets],
          indexLastUpdated: indexData.lastUpdated,
          hasPosteriorSamples: true,
          originalSampleCount: Object.values(weights.posteriorSamples)[0]?.length || 0, // Store original count for reference
          downsampled: true // Flag indicating samples were downsampled
        }
      };
    } else {
      // MLE or Bayesian without full result - store just weights
      cacheEntry = {
        weights,
        metadata: {
          categoryId,
          datasetSignature,
          calculationType,
          calculatedAt: now,
          lastAccessed: now,
          datasets: [...datasets],
          indexLastUpdated: indexData.lastUpdated
        }
      };
    }

    // Estimate entry size
    let entrySize = estimateCacheEntrySize(cacheEntry);

    // Serialize and store
    let jsonString = JSON.stringify(cacheEntry);
    let success = safeLocalStorageSet(cacheKey, jsonString);

    // If storage failed due to quota, try evicting oldest entries
    if (!success) {
      // Try to evict enough space (evict 2x the required space to leave buffer)
      const freed = await evictOldestEntries(entrySize * 2);
      
      if (freed > 0) {
        // Retry storage after eviction
        success = safeLocalStorageSet(cacheKey, jsonString);
      }

      // If still failing and this is a Bayesian result with posterior samples,
      // try storing without posterior samples as fallback
      if (!success && calculationType === 'bayesian' && cacheEntry.posteriorSamples) {
        console.warn(`[WeightCache] Full Bayesian result too large, storing without posterior samples`);
        
        // Create fallback entry without posterior samples
        const fallbackEntry = {
          weights: cacheEntry.weights,
          summaryStatistics: cacheEntry.summaryStatistics,
          convergenceDiagnostics: cacheEntry.convergenceDiagnostics,
          modelAssumptions: cacheEntry.modelAssumptions,
          metadata: {
            ...cacheEntry.metadata,
            hasPosteriorSamples: false,
            downsampled: false
          }
        };
        
        jsonString = JSON.stringify(fallbackEntry);
        entrySize = estimateCacheEntrySize(fallbackEntry);
        success = safeLocalStorageSet(cacheKey, jsonString);
        
        // If still failing, try evicting more and retry
        if (!success) {
          const moreFreed = await evictOldestEntries(entrySize * 2);
          if (moreFreed > 0) {
            success = safeLocalStorageSet(cacheKey, jsonString);
          }
        }
      }

      if (!success) {
        console.warn(`[WeightCache] Failed to store cache entry for ${cacheKey} after eviction and fallback`);
        // Graceful degradation - don't throw, just log
      }
    }
  } catch (error) {
    // Graceful degradation - log error but don't throw
    console.error(`[WeightCache] Error storing cached weights: ${error.message}`);
  }
}

/**
 * Get cache statistics
 * 
 * Returns comprehensive statistics about the weight cache including entry counts,
 * total size, distribution by category and calculation type, and oldest/newest entry timestamps.
 * 
 * @returns {Promise<Object>} Cache statistics object with:
 *   - totalEntries: {number} Total number of cache entries
 *   - totalSize: {number} Estimated total size in bytes
 *   - entriesByCategory: {Object<string, number>} Entry counts grouped by category ID
 *   - entriesByType: {Object} Entry counts by calculation type { mle: number, bayesian: number }
 *   - oldestEntry: {string|null} ISO 8601 timestamp of oldest entry (by lastAccessed)
 *   - newestEntry: {string|null} ISO 8601 timestamp of newest entry (by lastAccessed)
 * @throws {never} Never throws errors - returns empty stats object on error
 * 
 * @example
 * const stats = await getCacheStats();
 * console.log(`Cache has ${stats.totalEntries} entries`);
 * console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
 * console.log(`Categories: ${Object.keys(stats.entriesByCategory).length}`);
 */
export async function getCacheStats() {
  try {
    const entries = getAllCacheEntries();
    
    let totalSize = 0;
    const entriesByCategory = {};
    const entriesByType = {
      mle: 0,
      bayesian: 0
    };
    let oldestEntry = null;
    let newestEntry = null;

    for (const { entry } of entries) {
      // Calculate size
      const entrySize = estimateCacheEntrySize(entry);
      totalSize += entrySize;

      // Count by category
      const categoryId = entry.metadata?.categoryId;
      if (categoryId) {
        entriesByCategory[categoryId] = (entriesByCategory[categoryId] || 0) + 1;
      }

      // Count by type
      const calculationType = entry.metadata?.calculationType;
      if (calculationType === 'mle' || calculationType === 'bayesian') {
        entriesByType[calculationType] = (entriesByType[calculationType] || 0) + 1;
      }

      // Track oldest and newest
      const lastAccessed = entry.metadata?.lastAccessed;
      if (lastAccessed) {
        if (!oldestEntry || lastAccessed < oldestEntry) {
          oldestEntry = lastAccessed;
        }
        if (!newestEntry || lastAccessed > newestEntry) {
          newestEntry = lastAccessed;
        }
      }
    }

    return {
      totalEntries: entries.length,
      totalSize,
      entriesByCategory,
      entriesByType,
      oldestEntry,
      newestEntry
    };
  } catch (error) {
    console.error(`[WeightCache] Error getting cache stats: ${error.message}`);
    return {
      totalEntries: 0,
      totalSize: 0,
      entriesByCategory: {},
      entriesByType: { mle: 0, bayesian: 0 },
      oldestEntry: null,
      newestEntry: null
    };
  }
}

/**
 * Invalidate cache entries for a category
 * 
 * Removes cache entries matching the specified category and optional calculation type.
 * Useful for manual cache invalidation when datasets are updated outside normal flow.
 * 
 * Performance: O(n) where n = number of cache entries
 * 
 * @param {string} categoryId - Category identifier to invalidate
 * @param {string} [calculationType] - Optional calculation type filter: "mle" or "bayesian". If omitted, invalidates all entries for the category
 * @returns {Promise<number>} Number of entries invalidated (0 if none found or error)
 * @throws {never} Never throws errors - returns 0 on error
 * 
 * @example
 * // Invalidate all cache entries for catalysts
 * const count = await invalidateCache("catalysts");
 * 
 * // Invalidate only MLE entries for catalysts
 * const mleCount = await invalidateCache("catalysts", "mle");
 */
export async function invalidateCache(categoryId, calculationType) {
  let count = 0;

  try {
    const entries = getAllCacheEntries();

    for (const { key, entry } of entries) {
      const entryCategoryId = entry.metadata?.categoryId;
      const entryCalculationType = entry.metadata?.calculationType;

      // Check if entry matches category and optional calculation type
      if (entryCategoryId === categoryId) {
        if (!calculationType || entryCalculationType === calculationType) {
          if (safeLocalStorageRemove(key)) {
            count++;
          }
        }
      }
    }
  } catch (error) {
    console.error(`[WeightCache] Error invalidating cache: ${error.message}`);
  }

  return count;
}

/**
 * Clear all weight cache entries
 * 
 * Removes all cache entries from LocalStorage. Useful for debugging, testing,
 * or user-initiated cache clearing (if UI is added later).
 * 
 * Performance: O(n) where n = number of cache entries
 * 
 * @returns {Promise<number>} Number of entries cleared (0 if none found or error)
 * @throws {never} Never throws errors - returns 0 on error
 * 
 * @example
 * const count = await clearCache();
 * console.log(`Cleared ${count} cache entries`);
 */
export async function clearCache() {
  let count = 0;

  try {
    if (typeof localStorage === 'undefined') {
      return 0;
    }

    const keysToRemove = [];
    
    // Collect all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all cache entries
    for (const key of keysToRemove) {
      if (safeLocalStorageRemove(key)) {
        count++;
      }
    }
  } catch (error) {
    console.error(`[WeightCache] Error clearing cache: ${error.message}`);
  }

  return count;
}
