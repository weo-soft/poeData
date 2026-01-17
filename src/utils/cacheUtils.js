/**
 * Cache utilities for weight calculation caching
 * Provides helper functions for LocalStorage operations, cache key generation,
 * and dataset signature generation
 */

/**
 * Generate a dataset signature from dataset list and lastUpdated timestamp
 * @param {Array<{number: number, filename: string}>} datasets - Array of dataset metadata
 * @param {string} lastUpdated - ISO 8601 timestamp from index.json
 * @returns {string} Dataset signature (hash)
 */
export function generateDatasetSignature(datasets, lastUpdated) {
  // Sort dataset numbers to ensure consistent signature
  const datasetNumbers = datasets
    .map(d => d.number)
    .sort((a, b) => a - b)
    .join(',');
  
  // Combine with lastUpdated timestamp
  const signatureString = `${datasetNumbers}:${lastUpdated}`;
  
  // Simple hash function (for browser compatibility, avoid crypto.subtle complexity)
  let hash = 0;
  for (let i = 0; i < signatureString.length; i++) {
    const char = signatureString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Generate a cache key for weight calculation results
 * @param {string} categoryId - Category identifier
 * @param {string} datasetSignature - Dataset signature from generateDatasetSignature
 * @param {string} calculationType - "mle" or "bayesian"
 * @returns {string} Cache key
 */
export function generateCacheKey(categoryId, datasetSignature, calculationType) {
  return `poeData:weightCache:${categoryId}:${datasetSignature}:${calculationType}`;
}

/**
 * Safely get item from LocalStorage with error handling
 * @param {string} key - Storage key
 * @returns {string|null} Stored value or null if unavailable/error
 */
export function safeLocalStorageGet(key) {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[CacheUtils] Failed to get from LocalStorage: ${error.message}`);
    return null;
  }
}

/**
 * Safely set item in LocalStorage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
export function safeLocalStorageSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn(`[CacheUtils] LocalStorage quota exceeded for key: ${key}`);
    } else {
      console.warn(`[CacheUtils] Failed to set LocalStorage: ${error.message}`);
    }
    return false;
  }
}

/**
 * Safely remove item from LocalStorage with error handling
 * @param {string} key - Storage key
 * @returns {boolean} True if successful, false otherwise
 */
export function safeLocalStorageRemove(key) {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[CacheUtils] Failed to remove from LocalStorage: ${error.message}`);
    return false;
  }
}

/**
 * Estimate the size of a cache entry in bytes
 * @param {Object} entry - Cache entry object to estimate
 * @returns {number} Estimated size in bytes
 */
export function estimateCacheEntrySize(entry) {
  try {
    const jsonString = JSON.stringify(entry);
    // Each character in UTF-16 is 2 bytes, but JSON.stringify uses UTF-8
    // Estimate: most characters are 1 byte, some are 2-4 bytes
    // Use a conservative estimate of 1.5 bytes per character
    return Math.ceil(jsonString.length * 1.5);
  } catch (error) {
    console.warn(`[CacheUtils] Failed to estimate cache entry size: ${error.message}`);
    // Return a conservative default estimate
    return 10240; // 10KB default
  }
}
